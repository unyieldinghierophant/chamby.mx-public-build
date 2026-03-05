import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { settleJobCompletion } from "../_shared/settlement.ts";

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[AUTO-COMPLETE-JOBS] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

serve(async (req) => {
  try {
    log("Cron triggered");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      log("STRIPE_SECRET_KEY not configured");
      return new Response(JSON.stringify({ error: "STRIPE_SECRET_KEY not configured" }), { status: 500 });
    }
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Find jobs where provider marked done > 24h ago and client hasn't confirmed
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data: jobs, error } = await supabase
      .from("jobs")
      .select("id, provider_id, client_id, completion_marked_at, has_open_dispute")
      .eq("completion_status", "provider_marked_done")
      .eq("has_open_dispute", false)
      .lt("completion_marked_at", cutoff);

    if (error) {
      log("Query error", { error: error.message });
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    if (!jobs || jobs.length === 0) {
      log("No jobs to auto-complete");
      return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
    }

    log(`Found ${jobs.length} jobs to auto-complete`);

    let processed = 0;
    for (const job of jobs) {
      try {
        const now = new Date().toISOString();

        // Update job
        await supabase
          .from("jobs")
          .update({
            completion_status: "auto_completed",
            completion_confirmed_at: now,
            status: "completed",
            updated_at: now,
          })
          .eq("id", job.id);

        // System message
        if (job.provider_id) {
          await supabase.from("messages").insert({
            job_id: job.id,
            sender_id: job.provider_id,
            receiver_id: job.client_id,
            message_text: "⏰ El trabajo fue completado automáticamente tras 24 horas sin respuesta del cliente.",
            is_system_message: true,
            system_event_type: "auto_completed",
            read: false,
          });
        }

        // Trigger settlement using shared utility
        const settlement = await settleJobCompletion(
          supabase,
          stripe,
          job.id,
          job.provider_id!,
          "AUTO-COMPLETE"
        );

        // Notify client about auto-completion and refund
        const refundMsg = settlement.visitFeeRefund
          ? "Tu trabajo se completó automáticamente. Se procesó el reembolso de $429."
          : "Tu trabajo se completó automáticamente tras 24 horas sin confirmación.";

        await supabase.from("notifications").insert({
          user_id: job.client_id,
          type: "job_auto_completed",
          title: "Trabajo completado automáticamente",
          message: refundMsg,
          link: `/active-jobs`,
          data: { job_id: job.id },
        });

        // Notify provider
        if (settlement.payoutStatus === "paid") {
          const { data: payoutRow } = await supabase
            .from("payouts")
            .select("amount")
            .eq("job_id", job.id)
            .eq("payout_type", "job_completion")
            .maybeSingle();

          await supabase.from("notifications").insert({
            user_id: job.provider_id!,
            type: "payout_released",
            title: "¡Pago liberado!",
            message: `Se depositaron $${(payoutRow?.amount ?? 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN a tu cuenta (auto-completado).`,
            link: "/provider-portal/account",
            data: { job_id: job.id },
          });
        }

        processed++;
        log(`Auto-completed job`, { jobId: job.id, settlement: settlement as unknown as Record<string, unknown> });
      } catch (jobErr) {
        log(`Failed to auto-complete job`, { jobId: job.id, error: String(jobErr) });
      }
    }

    log(`Done`, { processed, total: jobs.length });
    return new Response(JSON.stringify({ processed, total: jobs.length }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
