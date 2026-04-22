import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const ADMIN_ID = "30c2aa13-4338-44ca-8c74-d60421ed9bfc";
const log = (step: string, d?: Record<string, unknown>) =>
  console.log(`[ADMIN-PAYMENT] ${step}${d ? ` - ${JSON.stringify(d)}` : ""}`);

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const res = (status: number, data: Record<string, unknown>) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "");
    const token = req.headers.get("Authorization")?.replace("Bearer ", "") ?? "";
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user || user.id !== ADMIN_ID) return res(403, { error: "Admin only" });

    const { action, job_id, amount_cents } = await req.json();
    if (!action || !job_id) return res(400, { error: "action and job_id required" });

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) return res(500, { error: "Stripe not configured" });
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { data: job } = await supabase.from("jobs").select("*").eq("id", job_id).single();
    if (!job) return res(404, { error: "Job not found" });

    // ── Find relevant payment record ───────────────────────────────────────
    const { data: visitPay } = await supabase.from("payments").select("*")
      .eq("job_id", job_id).eq("type", "visit_fee").in("status", ["authorized", "succeeded"]).maybeSingle();
    const { data: invoicePay } = await supabase.from("payments").select("*")
      .eq("job_id", job_id).in("type", ["invoice_payment", "invoice"]).eq("status", "succeeded").maybeSingle();

    log("Action", { action, job_id, hasVisitPay: !!visitPay, hasInvoicePay: !!invoicePay });

    if (action === "capture") {
      const piId = visitPay?.stripe_payment_intent_id ?? job.stripe_visit_payment_intent_id;
      if (!piId) return res(400, { error: "No payment intent to capture" });
      const captured = await stripe.paymentIntents.capture(piId);
      await supabase.from("payments").update({ status: "succeeded" }).eq("stripe_payment_intent_id", piId);
      log("Captured", { piId });
      return res(200, { success: true, status: captured.status });
    }

    if (action === "full_refund") {
      const piId = visitPay?.stripe_payment_intent_id ?? invoicePay?.stripe_payment_intent_id ?? job.stripe_visit_payment_intent_id;
      if (!piId) return res(400, { error: "No payment to refund" });
      const pi = await stripe.paymentIntents.retrieve(piId);
      if (pi.status === "requires_capture") {
        await stripe.paymentIntents.cancel(piId);
        await supabase.from("payments").update({ status: "cancelled" }).eq("stripe_payment_intent_id", piId);
      } else if (pi.latest_charge) {
        await stripe.refunds.create({ charge: pi.latest_charge as string });
        await supabase.from("payments").update({ status: "refunded" }).eq("stripe_payment_intent_id", piId);
      }
      await supabase.from("jobs").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", job_id);
      log("Full refund issued", { piId });
      return res(200, { success: true });
    }

    if (action === "partial_refund") {
      if (!amount_cents || amount_cents <= 0) return res(400, { error: "amount_cents required" });
      const piId = invoicePay?.stripe_payment_intent_id;
      if (!piId) return res(400, { error: "No invoice payment to refund" });
      const pi = await stripe.paymentIntents.retrieve(piId);
      if (!pi.latest_charge) return res(400, { error: "No charge found on payment intent" });
      const refund = await stripe.refunds.create({ charge: pi.latest_charge as string, amount: amount_cents });
      log("Partial refund", { amount: amount_cents, refundId: refund.id });
      return res(200, { success: true, refund_id: refund.id, amount_cents });
    }

    if (action === "payout_provider") {
      if (!job.provider_id) return res(400, { error: "No provider on this job" });
      const { data: invoice } = await supabase.from("invoices").select("*").eq("job_id", job_id).maybeSingle();
      const { data: provider } = await supabase.from("providers")
        .select("stripe_account_id, stripe_payouts_enabled").eq("user_id", job.provider_id).maybeSingle();
      if (!provider?.stripe_account_id || !provider.stripe_payouts_enabled) return res(400, { error: "Provider not payout-enabled" });
      const payoutCents = amount_cents ?? (invoice?.total_customer_amount ? Math.round(invoice.total_customer_amount * 100 * 0.9) : 0);
      if (!payoutCents) return res(400, { error: "Cannot determine payout amount" });
      const transfer = await stripe.transfers.create({ amount: payoutCents, currency: "mxn", destination: provider.stripe_account_id, metadata: { job_id, action: "admin_manual_payout" } });
      await supabase.from("payouts").insert({ job_id, provider_id: job.provider_id, amount: payoutCents / 100, status: "paid", stripe_transfer_id: transfer.id, payout_type: "admin_manual", paid_at: new Date().toISOString() });
      log("Provider payout", { transferId: transfer.id, amount: payoutCents });
      return res(200, { success: true, transfer_id: transfer.id });
    }

    return res(400, { error: `Unknown action: ${action}` });
  } catch (e: any) {
    log("ERROR", { message: e.message });
    return new Response(JSON.stringify({ error: e.message }), { status: 500, headers: { ...getCorsHeaders(req), "Content-Type": "application/json" } });
  }
});
