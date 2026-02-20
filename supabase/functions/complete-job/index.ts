import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[COMPLETE-JOB] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
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
      .select("id, status, client_id, provider_id, completion_status")
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

      // Trigger escrow release
      await triggerEscrowRelease(supabase, job_id, job.provider_id!);

      log("Client confirmed, escrow released", { job_id });
      return new Response(
        JSON.stringify({ success: true, completion_status: "completed" }),
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

async function triggerEscrowRelease(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  providerId: string
) {
  const log2 = (s: string, d?: Record<string, unknown>) =>
    console.log(`[ESCROW-RELEASE] ${s}${d ? ` - ${JSON.stringify(d)}` : ""}`);

  try {
    // Get the paid invoice
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, subtotal_provider, status")
      .eq("job_id", jobId)
      .eq("status", "paid")
      .maybeSingle();

    if (!invoice) {
      log2("No paid invoice found, skipping release", { jobId });
      return;
    }

    // Check provider has Stripe account
    const { data: provider } = await supabase
      .from("providers")
      .select("stripe_account_id, stripe_onboarding_status")
      .eq("user_id", providerId)
      .single();

    if (!provider?.stripe_account_id || provider.stripe_onboarding_status !== "enabled") {
      log2("Provider not ready for payout, marking as ready_to_release", { providerId });
      await supabase
        .from("invoices")
        .update({ status: "ready_to_release", updated_at: new Date().toISOString() })
        .eq("id", invoice.id);
      return;
    }

    // Create payout record if not exists
    const { data: existingPayout } = await supabase
      .from("payouts")
      .select("id")
      .eq("invoice_id", invoice.id)
      .maybeSingle();

    let payoutId: string;
    if (existingPayout) {
      payoutId = existingPayout.id;
    } else {
      const { data: newPayout, error: payoutErr } = await supabase
        .from("payouts")
        .insert({
          invoice_id: invoice.id,
          provider_id: providerId,
          amount: invoice.subtotal_provider,
          status: "pending",
        })
        .select("id")
        .single();

      if (payoutErr || !newPayout) {
        log2("Failed to create payout record", { error: payoutErr?.message });
        return;
      }
      payoutId = newPayout.id;
    }

    // Create Stripe transfer
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      log2("STRIPE_SECRET_KEY not configured");
      return;
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const amountCentavos = Math.round(invoice.subtotal_provider * 100);
    const transfer = await stripe.transfers.create({
      amount: amountCentavos,
      currency: "mxn",
      destination: provider.stripe_account_id,
      metadata: {
        payout_id: payoutId,
        job_id: jobId,
        provider_id: providerId,
      },
    });

    log2("Transfer created", { transferId: transfer.id, amount: amountCentavos });

    // Update payout
    await supabase
      .from("payouts")
      .update({
        stripe_transfer_id: transfer.id,
        status: "paid",
        paid_at: new Date().toISOString(),
      })
      .eq("id", payoutId);

    // Update invoice status to released
    await supabase
      .from("invoices")
      .update({ status: "released", updated_at: new Date().toISOString() })
      .eq("id", invoice.id);

    // Record in payments ledger
    await supabase.from("payments").insert({
      job_id: jobId,
      provider_id: providerId,
      stripe_payment_intent_id: transfer.id,
      amount: amountCentavos,
      currency: "mxn",
      type: "job_invoice",
      status: "released",
      metadata: { payout_id: payoutId, transfer_id: transfer.id },
    });

    // Notify provider
    await supabase.from("notifications").insert({
      user_id: providerId,
      type: "payout_released",
      title: "¡Pago liberado!",
      message: `Se depositaron $${invoice.subtotal_provider} MXN a tu cuenta de Stripe.`,
      link: "/provider-portal/account",
      data: { job_id: jobId, payout_id: payoutId },
    });

    log2("Escrow release complete", { payoutId, transferId: transfer.id });
  } catch (err) {
    log2("Escrow release failed", { error: err instanceof Error ? err.message : String(err) });
    // Don't throw - mark invoice as ready_to_release so admin can handle
    await supabase
      .from("invoices")
      .update({ status: "ready_to_release", updated_at: new Date().toISOString() })
      .eq("job_id", jobId)
      .eq("status", "paid");
  }
}
