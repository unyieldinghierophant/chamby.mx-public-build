import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[CANCEL-JOB] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const LATE_WINDOW_MS = 2 * 60 * 60 * 1000;       // 2 hours
const CLIENT_PENALTY_CENTS = 20000;                // $200 MXN captured by Chamby
const CLIENT_REFUND_CENTS = 20600;                 // $206 MXN refund when full-capture fallback
const PROVIDER_PENALTY_CENTS = 10000;              // $100 MXN added to pending_penalty_balance
const FLAG_FREEZE = 3;
const FLAG_SUSPEND = 6;

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const respond = (status: number, data: Record<string, unknown>) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond(401, { error: "No authorization header" });

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !userData.user) return respond(401, { error: "Authentication failed" });
    const user = userData.user;

    const { job_id, cancelled_by, cancel_reason } = await req.json();
    if (!job_id || !cancelled_by) return respond(400, { error: "job_id and cancelled_by are required" });
    if (!["client", "provider"].includes(cancelled_by)) return respond(400, { error: "cancelled_by must be 'client' or 'provider'" });

    const { data: job, error: jobErr } = await supabase
      .from("jobs")
      .select("id, client_id, provider_id, status, scheduled_at, stripe_visit_payment_intent_id")
      .eq("id", job_id)
      .single();

    if (jobErr || !job) return respond(404, { error: "Job not found" });

    if (cancelled_by === "client" && job.client_id !== user.id) return respond(403, { error: "Forbidden" });
    if (cancelled_by === "provider" && job.provider_id !== user.id) return respond(403, { error: "Forbidden" });

    const isLate = job.scheduled_at
      ? new Date(job.scheduled_at).getTime() - Date.now() < LATE_WINDOW_MS
      : false;

    const { data: visitFeePayment } = await supabase
      .from("payments")
      .select("stripe_payment_intent_id")
      .eq("job_id", job_id)
      .eq("type", "visit_fee")
      .in("status", ["authorized", "succeeded"])
      .maybeSingle();

    const piId = visitFeePayment?.stripe_payment_intent_id || job.stripe_visit_payment_intent_id;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    log("Processing cancellation", { job_id, cancelled_by, isLate, hasPi: !!piId });

    // ── Shared: apply account flag + freeze/suspend logic ──────────────────────
    const applyFlag = async (userId: string, reason: string) => {
      const { data: u } = await supabase
        .from("users")
        .select("flag_count, account_status, pending_penalty_balance")
        .eq("id", userId)
        .single();

      const newFlagCount = (u?.flag_count ?? 0) + 1;
      const newStatus =
        newFlagCount >= FLAG_SUSPEND ? "suspended"
        : newFlagCount >= FLAG_FREEZE ? "frozen"
        : (u?.account_status ?? "active");

      return { u, newFlagCount, newStatus };
    };

    // ── CLIENT CANCELS ─────────────────────────────────────────────────────────
    if (cancelled_by === "client") {
      if (!isLate) {
        // Early — release full hold
        if (piId) {
          try { await stripe.paymentIntents.cancel(piId); } catch (e: any) {
            log("PI cancel error (may already be cancelled)", { msg: e.message });
          }
        }

        await supabase.from("jobs").update({
          status: "cancelled",
          cancellation_requested_by: "client",
          cancellation_requested_at: new Date().toISOString(),
        }).eq("id", job_id);

        if (job.provider_id) {
          await supabase.from("notifications").insert({
            user_id: job.provider_id,
            type: "job_cancelled_by_client",
            title: "Trabajo cancelado",
            message: "El cliente canceló el trabajo. El cargo de visita ha sido liberado.",
            link: "/provider-portal/jobs",
            data: { job_id },
          });
        }

        return respond(200, { is_late: false, cancelled: true });
      }

      // Late — capture $200, release $206 automatically (partial capture)
      if (piId) {
        try {
          await stripe.paymentIntents.capture(piId, { amount_to_capture: CLIENT_PENALTY_CENTS });
          log("Partial capture $200 MXN succeeded", { piId });
        } catch (captureErr: any) {
          log("Partial capture failed, falling back to full capture + refund", { msg: captureErr.message });
          try {
            await stripe.paymentIntents.capture(piId);
            const pi = await stripe.paymentIntents.retrieve(piId);
            if (pi.latest_charge) {
              await stripe.refunds.create({
                charge: pi.latest_charge as string,
                amount: CLIENT_REFUND_CENTS,
              });
              log("Full capture + $206 refund issued", { piId });
            }
          } catch (fallbackErr: any) {
            log("Fallback capture/refund also failed", { msg: fallbackErr.message });
          }
        }
      }

      await supabase.from("jobs").update({
        status: "cancelled",
        cancellation_requested_by: "client",
        cancellation_requested_at: new Date().toISOString(),
        late_cancellation_penalty_applied: true,
      }).eq("id", job_id);

      const { newFlagCount, newStatus } = await applyFlag(job.client_id, "Cancelación tardía");
      await supabase.from("users").update({
        flag_count: newFlagCount,
        account_status: newStatus,
      }).eq("id", job.client_id);

      await supabase.from("account_flags").insert({
        user_id: job.client_id,
        reason: "Cancelación tardía — se cobró penalización de $200 MXN",
        flagged_by: "system",
        booking_id: job_id,
      });

      await supabase.from("admin_notifications").insert({
        type: "late_cancellation",
        booking_id: job_id,
        triggered_by_user_id: user.id,
        message: `Cliente canceló con <2h de anticipación. Se capturaron $200 MXN. Flag count: ${newFlagCount}. Estado: ${newStatus}.`,
        is_read: false,
      });

      if (job.provider_id) {
        await supabase.from("notifications").insert({
          user_id: job.provider_id,
          type: "job_cancelled_by_client_late",
          title: "Trabajo cancelado",
          message: "El cliente canceló con menos de 2 horas de anticipación. Recibirás $200 MXN como compensación.",
          link: "/provider-portal/jobs",
          data: { job_id },
        });
      }

      return respond(200, { is_late: true, cancelled: true, flag_count: newFlagCount, account_status: newStatus });
    }

    // ── PROVIDER CANCELS ───────────────────────────────────────────────────────
    // Always release full hold back to client
    if (piId) {
      try { await stripe.paymentIntents.cancel(piId); } catch (e: any) {
        log("PI cancel error", { msg: e.message });
      }
    }

    await supabase.from("jobs").update({
      status: "cancelled",
      cancellation_requested_by: "provider",
      cancellation_requested_at: new Date().toISOString(),
      ...(isLate ? { late_cancellation_penalty_applied: true } : {}),
    }).eq("id", job_id);

    if (cancel_reason) {
      await supabase.from("messages").insert({
        job_id,
        sender_id: user.id,
        receiver_id: job.client_id,
        message_text: `❌ El proveedor canceló el trabajo.\nMotivo: ${cancel_reason}`,
        is_system_message: true,
        system_event_type: "provider_cancellation",
        read: false,
      });
    }

    await supabase.from("notifications").insert({
      user_id: job.client_id,
      type: isLate ? "job_cancelled_by_provider_late" : "job_cancelled_by_provider",
      title: "Tu proveedor canceló el trabajo",
      message: isLate
        ? "El proveedor canceló con menos de 2 horas de anticipación. Recibirás un reembolso completo de $406 MXN."
        : `El proveedor canceló el servicio${cancel_reason ? `. Motivo: ${cancel_reason}` : ""}. Recibirás un reembolso completo de $406 MXN.`,
      link: `/active-jobs?job_id=${job_id}`,
      data: { job_id, reason: cancel_reason },
    });

    if (!isLate) return respond(200, { is_late: false, cancelled: true });

    // Late provider — flag + penalty balance
    const { newFlagCount, newStatus, u } = await applyFlag(job.provider_id, "Cancelación tardía");
    const newPenaltyBalance = (u?.pending_penalty_balance ?? 0) + PROVIDER_PENALTY_CENTS;

    await supabase.from("users").update({
      flag_count: newFlagCount,
      account_status: newStatus,
      pending_penalty_balance: newPenaltyBalance,
    }).eq("id", job.provider_id);

    await supabase.from("account_flags").insert({
      user_id: job.provider_id,
      reason: "Cancelación tardía — penalización de $100 MXN aplicada",
      flagged_by: "system",
      booking_id: job_id,
    });

    await supabase.from("admin_notifications").insert({
      type: "late_cancellation",
      booking_id: job_id,
      triggered_by_user_id: user.id,
      message: `Proveedor canceló con <2h de anticipación. Penalización $100 MXN. Flag count: ${newFlagCount}. Estado: ${newStatus}.`,
      is_read: false,
    });

    return respond(200, { is_late: true, cancelled: true, flag_count: newFlagCount, account_status: newStatus });

  } catch (e: any) {
    log("Unexpected error", { error: e.message });
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
