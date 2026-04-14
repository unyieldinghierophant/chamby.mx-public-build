import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { settleJobCompletion } from "../_shared/settlement.ts";

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[COMPLETE-JOB] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const userId = userData.user.id;
    const { job_id, action } = await req.json();
    if (!job_id) throw new Error("job_id is required");
    if (!action || !["provider_mark_done", "client_confirm"].includes(action)) {
      throw new Error("action must be 'provider_mark_done' or 'client_confirm'");
    }

    log("Request", { job_id, action, userId });

    // Fetch job
    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, status, client_id, provider_id, completion_status, has_open_dispute")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) throw new Error("Job not found");

    // ── Provider marks done ──
    if (action === "provider_mark_done") {
      if (job.provider_id !== userId) throw new Error("Not the assigned provider");
      if (job.completion_status !== "in_progress") {
        throw new Error(`Cannot mark done: completion_status is '${job.completion_status}'`);
      }

      // Check invoice is paid
      const { data: invoice } = await supabase
        .from("invoices")
        .select("id, status")
        .eq("job_id", job_id)
        .eq("status", "paid")
        .maybeSingle();

      if (!invoice) throw new Error("Invoice must be paid before marking job as done");

      const { error: updateErr } = await supabase
        .from("jobs")
        .update({
          completion_status: "provider_marked_done",
          status: "provider_done",
          completion_marked_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", job_id);

      if (updateErr) throw new Error(updateErr.message);

      // System message
      await supabase.from("messages").insert({
        job_id,
        sender_id: userId,
        receiver_id: job.client_id,
        message_text: "✅ El proveedor indicó que el trabajo fue terminado. Por favor confirma.",
        is_system_message: true,
        system_event_type: "provider_marked_done",
        read: false,
      });

      // Notify client
      await supabase.from("notifications").insert({
        user_id: job.client_id,
        type: "job_completion_pending",
        title: "Confirma tu trabajo",
        message: "El proveedor terminó el trabajo. Confirma para liberar el pago.",
        link: `/active-jobs`,
        data: { job_id },
      });

      log("Provider marked done", { job_id });
      return new Response(
        JSON.stringify({ success: true, completion_status: "provider_marked_done" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Client confirms ──
    if (action === "client_confirm") {
      if (job.client_id !== userId) throw new Error("Not the job client");
      if (job.completion_status !== "provider_marked_done") {
        throw new Error(`Cannot confirm: completion_status is '${job.completion_status}'`);
      }
      if (job.has_open_dispute) {
        throw new Error("Cannot confirm while a dispute is open");
      }

      const now = new Date().toISOString();
      const { error: updateErr } = await supabase
        .from("jobs")
        .update({
          completion_status: "completed",
          completion_confirmed_at: now,
          status: "completed",
          updated_at: now,
        })
        .eq("id", job_id);

      if (updateErr) throw new Error(updateErr.message);

      // System message
      await supabase.from("messages").insert({
        job_id,
        sender_id: userId,
        receiver_id: job.provider_id!,
        message_text: "🎉 El cliente confirmó que el trabajo fue completado. ¡Pago en camino!",
        is_system_message: true,
        system_event_type: "completed",
        read: false,
      });

      // Trigger settlement (refund visit fee + transfer to provider)
      const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

      const settlement = await settleJobCompletion(
        supabase,
        stripe,
        job_id,
        job.provider_id!,
        "COMPLETE-JOB"
      );

      log("Settlement result", settlement as unknown as Record<string, unknown>);

      // ── Notifications ──
      // Notify client about refund
      const refundMsg = settlement.visitFeeRefund
        ? "Tu trabajo se completó. Se liberó el cargo de diagnóstico de $406."
        : "Tu trabajo se completó. El cargo de diagnóstico de $406 será liberado pronto.";

      await supabase.from("notifications").insert({
        user_id: job.client_id,
        type: "job_completed",
        title: "Trabajo completado",
        message: refundMsg,
        link: `/active-jobs`,
        data: { job_id, refund_id: settlement.visitFeeRefund },
      });

      // Notify provider about payout
      if (settlement.payoutStatus === "paid") {
        // Fetch the payout amount for the notification
        const { data: payoutRow } = await supabase
          .from("payouts")
          .select("amount")
          .eq("job_id", job_id)
          .eq("payout_type", "job_completion")
          .maybeSingle();

        const payoutAmount = payoutRow?.amount ?? 0;
        await supabase.from("notifications").insert({
          user_id: job.provider_id!,
          type: "payout_released",
          title: "¡Pago liberado!",
          message: `Se depositaron $${payoutAmount.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN a tu cuenta.`,
          link: "/provider-portal/account",
          data: { job_id },
        });
      } else {
        await supabase.from("notifications").insert({
          user_id: job.provider_id!,
          type: "job_completed",
          title: "Trabajo completado",
          message: "El cliente confirmó el trabajo. Tu pago será procesado pronto.",
          link: "/provider-portal/jobs",
          data: { job_id },
        });
      }

      log("Client confirmed, settlement complete", { job_id });
      return new Response(
        JSON.stringify({
          success: true,
          completion_status: "completed",
          settlement: {
            visitFeeRefund: settlement.visitFeeRefund,
            providerTransfer: settlement.providerTransfer,
            payoutStatus: settlement.payoutStatus,
            errors: settlement.errors,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});
