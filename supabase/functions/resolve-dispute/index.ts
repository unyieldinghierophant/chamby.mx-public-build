import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[RESOLVE-DISPUTE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
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

    const adminId = userData.user.id;

    // Verify admin role
    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: adminId });
    if (!isAdmin) throw new Error("Admin access required");

    const { dispute_id, resolution_action, resolution_notes } = await req.json();

    if (!dispute_id) throw new Error("dispute_id is required");
    if (!resolution_action || !["release", "refund", "cancel"].includes(resolution_action)) {
      throw new Error("resolution_action must be 'release', 'refund', or 'cancel'");
    }

    log("Request", { dispute_id, resolution_action, adminId });

    // Fetch dispute
    const { data: dispute, error: disputeErr } = await supabase
      .from("disputes")
      .select("*")
      .eq("id", dispute_id)
      .single();

    if (disputeErr || !dispute) throw new Error("Dispute not found");
    if (dispute.status !== "open") throw new Error("Dispute is not open");

    // Fetch job
    const { data: job } = await supabase
      .from("jobs")
      .select("id, client_id, provider_id")
      .eq("id", dispute.job_id)
      .single();

    if (!job) throw new Error("Job not found");

    // Fetch invoice only if dispute has one
    let invoice: { id: string; subtotal_provider: number; status: string; stripe_payment_intent_id: string | null } | null = null;
    if (dispute.invoice_id) {
      const { data: inv } = await supabase
        .from("invoices")
        .select("id, subtotal_provider, status, stripe_payment_intent_id")
        .eq("id", dispute.invoice_id)
        .single();
      invoice = inv;
    }

    const now = new Date().toISOString();
    let disputeStatus: string;

    if (resolution_action === "release") {
      if (!invoice) throw new Error("Cannot release: no invoice associated with this dispute");
      disputeStatus = "resolved_release";

      // Perform escrow release (same logic as complete-job)
      await performEscrowRelease(supabase, job.id, job.provider_id!, invoice);

      log("Escrow released via dispute resolution");

    } else if (resolution_action === "refund") {
      disputeStatus = "resolved_refund";

      // Find the payment intent to refund
      let paymentIntentId = invoice?.stripe_payment_intent_id || null;

      if (!paymentIntentId) {
        // Look in payments ledger for any succeeded payment on this job
        const { data: payment } = await supabase
          .from("payments")
          .select("stripe_payment_intent_id, stripe_checkout_session_id")
          .eq("job_id", job.id)
          .in("type", ["job_invoice", "visit_fee", "visit_fee_authorization"])
          .eq("status", "succeeded")
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (payment?.stripe_payment_intent_id) {
          paymentIntentId = payment.stripe_payment_intent_id;
        } else if (payment?.stripe_checkout_session_id) {
          const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
          if (stripeKey) {
            const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
            const session = await stripe.checkout.sessions.retrieve(payment.stripe_checkout_session_id);
            paymentIntentId = session.payment_intent as string;
          }
        }
      }

      if (!paymentIntentId) {
        // No payments found — just close the dispute without refunding
        log("No payments found to refund, closing dispute as cancelled instead");
        disputeStatus = "resolved_cancelled";
      } else {
        // Create Stripe refund
        const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
        if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const refund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
        });

        log("Stripe refund created", { refundId: refund.id });

        // Update invoice if exists
        if (invoice) {
          await supabase
            .from("invoices")
            .update({ status: "refunded", updated_at: now })
            .eq("id", invoice.id);
        }

        // Update payments ledger
        await supabase
          .from("payments")
          .update({ status: "refunded" })
          .eq("stripe_payment_intent_id", paymentIntentId);
      }

    } else {
      // cancel — close dispute, allow normal flow
      disputeStatus = "resolved_cancelled";
    }

    // Update dispute
    await supabase
      .from("disputes")
      .update({
        status: disputeStatus,
        resolution_notes: resolution_notes || null,
        resolved_by_admin_id: adminId,
        resolved_at: now,
      })
      .eq("id", dispute_id);

    // Update job
    await supabase
      .from("jobs")
      .update({
        has_open_dispute: false,
        dispute_status: disputeStatus,
        updated_at: now,
      })
      .eq("id", job.id);

    // Notify both parties
    const outcomeLabels: Record<string, string> = {
      resolved_release: "Pago liberado al proveedor",
      resolved_refund: "Reembolso procesado al cliente",
      resolved_cancelled: "Disputa cerrada sin acción",
    };
    const outcomeMsg = outcomeLabels[disputeStatus] || "Disputa resuelta";

    for (const uid of [job.client_id, job.provider_id].filter(Boolean)) {
      await supabase.from("notifications").insert({
        user_id: uid!,
        type: "dispute_resolved",
        title: "Disputa resuelta",
        message: outcomeMsg,
        link: uid === job.client_id ? "/active-jobs" : "/provider-portal/jobs",
        data: { job_id: job.id, dispute_id, resolution: disputeStatus },
      });
    }

    log("Dispute resolved", { dispute_id, disputeStatus });

    return new Response(
      JSON.stringify({ success: true, status: disputeStatus }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    log("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
    );
  }
});

async function performEscrowRelease(
  supabase: ReturnType<typeof createClient>,
  jobId: string,
  providerId: string,
  invoice: { id: string; subtotal_provider: number; status: string }
) {
  const { data: provider } = await supabase
    .from("providers")
    .select("stripe_account_id, stripe_onboarding_status")
    .eq("user_id", providerId)
    .single();

  if (!provider?.stripe_account_id || provider.stripe_onboarding_status !== "enabled") {
    await supabase
      .from("invoices")
      .update({ status: "ready_to_release", updated_at: new Date().toISOString() })
      .eq("id", invoice.id);
    return;
  }

  const { data: payout } = await supabase
    .from("payouts")
    .insert({
      invoice_id: invoice.id,
      provider_id: providerId,
      amount: invoice.subtotal_provider,
      status: "pending",
    })
    .select("id")
    .single();

  if (!payout) return;

  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  if (!stripeKey) return;

  const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
  const amountCentavos = Math.round(invoice.provider_payout_amount * 100);

  const transfer = await stripe.transfers.create({
    amount: amountCentavos,
    currency: "mxn",
    destination: provider.stripe_account_id,
    metadata: { payout_id: payout.id, job_id: jobId, provider_id: providerId },
  });

  await supabase
    .from("payouts")
    .update({ stripe_transfer_id: transfer.id, status: "paid", paid_at: new Date().toISOString() })
    .eq("id", payout.id);

  await supabase
    .from("invoices")
    .update({ status: "released", updated_at: new Date().toISOString() })
    .eq("id", invoice.id);

  // Update job to completed
  await supabase
    .from("jobs")
    .update({
      status: "completed",
      completion_status: "completed",
      completion_confirmed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", jobId);

  await supabase.from("notifications").insert({
    user_id: providerId,
    type: "payout_released",
    title: "¡Pago liberado!",
    message: `Se depositaron $${invoice.subtotal_provider} MXN a tu cuenta (disputa resuelta).`,
    link: "/provider-portal/account",
    data: { job_id: jobId, payout_id: payout.id },
  });
}
