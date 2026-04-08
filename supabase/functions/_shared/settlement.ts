/**
 * _shared/settlement.ts — Shared settlement logic for job completion and visit fee payouts.
 * Used by complete-job and auto-complete-jobs edge functions.
 */
import Stripe from "https://esm.sh/stripe@18.5.0";

const log = (tag: string, step: string, details?: Record<string, unknown>) => {
  console.log(`[${tag}] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

interface SettlementResult {
  visitFeeRefund: string | null;
  providerTransfer: string | null;
  payoutStatus: string | null;
  errors: string[];
}

/**
 * Settle a completed job:
 * 1. Refund the $429 visit fee to the client
 * 2. Transfer provider payout (quote - 10%) to their Express account
 */
export async function settleJobCompletion(
  supabase: any,
  stripe: Stripe,
  jobId: string,
  providerId: string,
  tag = "SETTLEMENT"
): Promise<SettlementResult> {
  const results: SettlementResult = {
    visitFeeRefund: null,
    providerTransfer: null,
    payoutStatus: null,
    errors: [],
  };

  // ── 1. Refund visit fee ──────────────────────────────────
  try {
    const { data: visitFeePayment } = await supabase
      .from("payments")
      .select("stripe_payment_intent_id")
      .eq("job_id", jobId)
      .eq("type", "visit_fee")
      .in("status", ["authorized", "succeeded"])
      .maybeSingle();

    if (visitFeePayment?.stripe_payment_intent_id) {
      // SYNC WITH src/utils/pricingConfig.ts PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS
      const refund = await stripe.refunds.create({
        payment_intent: visitFeePayment.stripe_payment_intent_id,
        amount: 42900,
      });

      await supabase.from("payments").insert({
        job_id: jobId,
        provider_id: null,
        type: "visit_fee_refund",
        amount: 429,
        total_amount_cents: 42900,
        base_amount_cents: 35000,
        vat_amount_cents: 5600,
        currency: "mxn",
        status: "succeeded",
        stripe_payment_intent_id: refund.id,
        pricing_version: "visit_v4_fixed_429",
      });

      results.visitFeeRefund = refund.id;
      log(tag, "Visit fee refunded", { refundId: refund.id, jobId });
    } else {
      log(tag, "No visit fee payment found to refund", { jobId });
    }
  } catch (err: any) {
    const msg = `visit_fee_refund: ${err.message || String(err)}`;
    results.errors.push(msg);
    log(tag, "Visit fee refund failed (continuing)", { error: msg });
    // Don't block provider payment
  }

  // ── 2. Transfer provider share ───────────────────────────
  try {
    const { data: invoice } = await supabase
      .from("invoices")
      .select("id, subtotal_provider, provider_payout_amount, status")
      .eq("job_id", jobId)
      .eq("status", "paid")
      .maybeSingle();

    if (!invoice) {
      log(tag, "No paid invoice found, skipping provider transfer", { jobId });
      return results;
    }

    // Use provider_payout_amount (from E4 quote), fallback to subtotal_provider * 0.9
    const providerPayoutPesos =
      invoice.provider_payout_amount ||
      Math.round(invoice.subtotal_provider * 0.9 * 100) / 100;
    const providerPayoutCents = Math.round(providerPayoutPesos * 100);

    const { data: provider } = await supabase
      .from("providers")
      .select("stripe_account_id, stripe_onboarding_status, stripe_payouts_enabled, stripe_requirements_currently_due")
      .eq("user_id", providerId)
      .single();

    const canPayout =
      provider?.stripe_account_id &&
      provider.stripe_onboarding_status === "enabled" &&
      provider.stripe_payouts_enabled;

    if (canPayout) {
      // Check for existing payout (idempotency)
      const { data: existingPayout } = await supabase
        .from("payouts")
        .select("id")
        .eq("job_id", jobId)
        .eq("payout_type", "job_completion")
        .maybeSingle();

      if (existingPayout) {
        log(tag, "Payout already exists, skipping", { jobId, payoutId: existingPayout.id });
        results.payoutStatus = "already_exists";
        return results;
      }

      const transfer = await stripe.transfers.create({
        amount: providerPayoutCents,
        currency: "mxn",
        destination: provider.stripe_account_id,
        metadata: { job_id: jobId, invoice_id: invoice.id, type: "job_completion" },
      });

      await supabase.from("payouts").insert({
        job_id: jobId,
        invoice_id: invoice.id,
        provider_id: providerId,
        amount: providerPayoutPesos,
        status: "paid",
        stripe_transfer_id: transfer.id,
        payout_type: "job_completion",
        paid_at: new Date().toISOString(),
      });

      // Update invoice status
      await supabase
        .from("invoices")
        .update({ status: "released", updated_at: new Date().toISOString() })
        .eq("id", invoice.id);

      results.providerTransfer = transfer.id;
      results.payoutStatus = "paid";
      log(tag, "Provider transfer created", { transferId: transfer.id, amount: providerPayoutCents });
    } else {
      // Provider not payout-enabled — hold funds
      await supabase.from("payouts").insert({
        job_id: jobId,
        invoice_id: invoice.id,
        provider_id: providerId,
        amount: providerPayoutPesos,
        status: "awaiting_provider_onboarding",
        payout_type: "job_completion",
      });

      await supabase
        .from("invoices")
        .update({ status: "ready_to_release", updated_at: new Date().toISOString() })
        .eq("id", invoice.id);

      results.payoutStatus = "awaiting_provider_onboarding";
      log(tag, "Provider not payout-enabled, holding funds", { providerId });

      // Notify provider
      await supabase.from("notifications").insert({
        user_id: providerId,
        type: "payout_pending_onboarding",
        title: "Pago pendiente",
        message: "Tu pago está listo, pero Stripe requiere verificación para liberarlo.",
        link: "/provider-portal/account",
        data: { job_id: jobId },
      });

      // Notify admins
      const currentlyDue = provider?.stripe_requirements_currently_due ?? [];
      const dueItems = Array.isArray(currentlyDue) ? currentlyDue : [];
      const topItems = dueItems.slice(0, 3).join(", ") || "N/A";

      const { data: admins } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (admins && admins.length > 0) {
        const adminNotifs = admins.map((a: { user_id: string }) => ({
          user_id: a.user_id,
          type: "admin_payout_blocked",
          title: "Pago bloqueado por verificación",
          message: `Proveedor ${providerId} — ${dueItems.length} requisito(s): ${topItems}`,
          link: "/admin/payouts",
          data: { job_id: jobId, provider_id: providerId },
        }));
        await supabase.from("notifications").insert(adminNotifs);
      }
    }
  } catch (err: any) {
    const msg = `provider_transfer: ${err.message || String(err)}`;
    results.errors.push(msg);
    log(tag, "Provider transfer failed", { error: msg });

    // Mark invoice as ready_to_release for admin to handle
    await supabase
      .from("invoices")
      .update({ status: "ready_to_release", updated_at: new Date().toISOString() })
      .eq("job_id", jobId)
      .eq("status", "paid");
  }

  return results;
}

/**
 * Settle visit fee share to provider when quote is rejected.
 * Provider gets $250 (PRICING.VISIT_FEE.PROVIDER_SHARE_CENTS = 25000).
 * Chamby keeps $100 in platform balance.
 */
export async function settleVisitFeeToProvider(
  supabase: any,
  stripe: Stripe,
  jobId: string,
  providerId: string,
  tag = "VISIT-FEE-SETTLEMENT"
): Promise<{ transferId: string | null; status: string; error: string | null }> {
  const PROVIDER_SHARE_CENTS = 25000; // $250.00 — SYNC WITH pricingConfig.ts
  const PROVIDER_SHARE_PESOS = 250;

  try {
    const { data: provider } = await supabase
      .from("providers")
      .select("stripe_account_id, stripe_onboarding_status, stripe_payouts_enabled")
      .eq("user_id", providerId)
      .single();

    const canPayout =
      provider?.stripe_account_id &&
      provider.stripe_onboarding_status === "enabled" &&
      provider.stripe_payouts_enabled;

    if (canPayout) {
      const transfer = await stripe.transfers.create({
        amount: PROVIDER_SHARE_CENTS,
        currency: "mxn",
        destination: provider.stripe_account_id,
        metadata: { job_id: jobId, type: "visit_fee_settlement" },
      });

      await supabase.from("payouts").insert({
        job_id: jobId,
        invoice_id: null,
        provider_id: providerId,
        amount: PROVIDER_SHARE_PESOS,
        status: "paid",
        stripe_transfer_id: transfer.id,
        payout_type: "visit_fee_settlement",
        paid_at: new Date().toISOString(),
      });

      log(tag, "Visit fee share transferred to provider", {
        transferId: transfer.id,
        amount: PROVIDER_SHARE_CENTS,
      });

      return { transferId: transfer.id, status: "paid", error: null };
    } else {
      // Hold for later
      await supabase.from("payouts").insert({
        job_id: jobId,
        invoice_id: null,
        provider_id: providerId,
        amount: PROVIDER_SHARE_PESOS,
        status: "awaiting_provider_onboarding",
        payout_type: "visit_fee_settlement",
      });

      log(tag, "Provider not payout-enabled, holding visit fee share", { providerId });
      return { transferId: null, status: "awaiting_provider_onboarding", error: null };
    }
  } catch (err: any) {
    const msg = err.message || String(err);
    log(tag, "Visit fee settlement failed", { error: msg });
    return { transferId: null, status: "failed", error: msg };
  }
}
