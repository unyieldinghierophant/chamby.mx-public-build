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

    log(`Found ${jobs?.length ?? 0} jobs to auto-complete`);

    let processed = 0;
    for (const job of jobs ?? []) {
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

    log(`Auto-complete pass done`, { processed, total: jobs?.length ?? 0 });

    // ────────────────────────────────────────────────────────────────────
    // Second pass: release provider payouts whose 5-day hold has expired.
    //
    // At job completion, settlement.ts records the payout with
    // status='holding' + release_after=+5 days. Here we promote ready
    // payouts to 'released' by executing the Stripe transfer. If the
    // provider isn't yet payout-enabled, we skip and the row stays in
    // `holding` so it'll retry on the next cron pass.
    // ────────────────────────────────────────────────────────────────────
    const nowIso = new Date().toISOString();
    const { data: readyPayouts, error: readyErr } = await (supabase as any)
      .from("payouts")
      .select("id, amount, provider_id, job_id, invoice_id")
      .eq("status", "holding")
      .not("release_after", "is", null)
      .lte("release_after", nowIso);

    let released = 0;
    let releaseFailed = 0;
    let releaseSkipped = 0;

    if (readyErr) {
      log("Holding-payouts query error", { error: readyErr.message });
    } else if (!readyPayouts || readyPayouts.length === 0) {
      log("No holding payouts ready for release");
    } else {
      log(`Found ${readyPayouts.length} holding payouts past release_after`);
      for (const payout of readyPayouts as Array<{
        id: string;
        amount: number;
        provider_id: string;
        job_id: string | null;
        invoice_id: string | null;
      }>) {
        try {
          const { data: provider } = await supabase
            .from("providers")
            .select("stripe_account_id, stripe_payouts_enabled, stripe_onboarding_status")
            .eq("user_id", payout.provider_id)
            .maybeSingle();

          if (!provider?.stripe_account_id || !provider.stripe_payouts_enabled) {
            log("Provider not payout-enabled, skipping", {
              payout_id: payout.id,
              provider_id: payout.provider_id,
            });
            releaseSkipped++;
            continue;
          }

          const transfer = await stripe.transfers.create({
            amount: Math.round(payout.amount * 100),
            currency: "mxn",
            destination: provider.stripe_account_id,
            metadata: {
              payout_id: payout.id,
              job_id: payout.job_id ?? "",
              invoice_id: payout.invoice_id ?? "",
              type: "auto_release_5day",
            },
          });

          const releasedAt = new Date().toISOString();
          await (supabase as any)
            .from("payouts")
            .update({
              status: "released",
              stripe_transfer_id: transfer.id,
              released_at: releasedAt,
              paid_at: releasedAt, // keep legacy field in sync
              updated_at: releasedAt,
            })
            .eq("id", payout.id);

          await supabase.from("notifications").insert({
            user_id: payout.provider_id,
            type: "payout_released",
            title: "¡Pago liberado!",
            message: `Se depositaron $${payout.amount.toLocaleString("es-MX", {
              minimumFractionDigits: 2,
            })} MXN a tu cuenta bancaria registrada.`,
            link: "/provider/earnings",
            data: { job_id: payout.job_id, payout_id: payout.id },
          });

          released++;
          log("Payout released", { payout_id: payout.id, transfer_id: transfer.id });
        } catch (err: any) {
          const errorMsg = err?.message || String(err);
          log("Payout release failed", { payout_id: payout.id, error: errorMsg });
          await (supabase as any)
            .from("payouts")
            .update({
              status: "failed",
              notes: errorMsg.slice(0, 500),
              updated_at: new Date().toISOString(),
            })
            .eq("id", payout.id);
          releaseFailed++;
        }
      }
    }

    log("Auto-release pass done", { released, releaseFailed, releaseSkipped });

    // ────────────────────────────────────────────────────────────────────
    // Third pass (Bug 9): cancel Stripe holds for `no_match` jobs whose
    // 2-hour grace window has passed. notify-no-provider sets
    // hold_expires_at when it flips searching→no_match but leaves the hold
    // live so the client can retry. Here we reap the ones that never came
    // back: cancel the PI, mark the payment cancelled, notify the client.
    // ────────────────────────────────────────────────────────────────────
    const { data: expiredHoldJobs, error: expiredErr } = await supabase
      .from("jobs")
      .select("id, client_id")
      .eq("status", "no_match")
      .not("hold_expires_at", "is", null)
      .lte("hold_expires_at", nowIso);

    let holdsCancelled = 0;
    let holdsFailed = 0;

    if (expiredErr) {
      log("Expired-hold query error", { error: expiredErr.message });
    } else if (!expiredHoldJobs || expiredHoldJobs.length === 0) {
      log("No no_match jobs past hold_expires_at");
    } else {
      log(`Found ${expiredHoldJobs.length} no_match jobs past hold_expires_at`);
      for (const ej of expiredHoldJobs as Array<{ id: string; client_id: string }>) {
        try {
          const { data: vfPayment } = await supabase
            .from("payments")
            .select("id, stripe_payment_intent_id")
            .eq("job_id", ej.id)
            .eq("type", "visit_fee")
            .eq("status", "authorized")
            .maybeSingle();

          if (vfPayment?.stripe_payment_intent_id) {
            try {
              await stripe.paymentIntents.cancel(vfPayment.stripe_payment_intent_id);
            } catch (err) {
              log("PI cancel failed (may already be cancelled)", { job_id: ej.id, error: String(err) });
            }
            await supabase
              .from("payments")
              .update({ status: "cancelled" })
              .eq("id", vfPayment.id);
          }

          // Clear hold_expires_at so we don't re-process on the next pass.
          await supabase
            .from("jobs")
            .update({ hold_expires_at: null, updated_at: new Date().toISOString() })
            .eq("id", ej.id);

          await supabase.from("notifications").insert({
            user_id: ej.client_id,
            type: "hold_cancelled",
            title: "Reserva cancelada",
            message: "Tu reserva fue cancelada y el cargo fue reembolsado.",
            link: "/user-landing",
            data: { job_id: ej.id },
          });

          holdsCancelled++;
        } catch (err) {
          holdsFailed++;
          log("Expired-hold cancel failed", { job_id: ej.id, error: String(err) });
        }
      }
    }

    log("Expired-hold pass done", { holdsCancelled, holdsFailed });

    return new Response(
      JSON.stringify({
        processed,
        total: jobs?.length ?? 0,
        released,
        releaseFailed,
        releaseSkipped,
        holdsCancelled,
        holdsFailed,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
});
