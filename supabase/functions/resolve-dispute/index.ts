import { getCorsHeaders } from "../_shared/cors.ts";
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const log = (step: string, details?: Record<string, unknown>) => {
  console.log(`[RESOLVE-DISPUTE] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);
};

const ADMIN_ID = "30c2aa13-4338-44ca-8c74-d60421ed9bfc";

const RULING_LABELS: Record<string, { client: string; provider: string }> = {
  client_wins: {
    client: "El administrador resolvió a tu favor. Recibirás un reembolso completo.",
    provider: "El administrador resolvió a favor del cliente. No se procesará pago.",
  },
  provider_wins: {
    client: "El administrador resolvió a favor del proveedor. No se procesará reembolso.",
    provider: "El administrador resolvió a tu favor. Recibirás el pago completo.",
  },
  split: {
    client: "El administrador resolvió con división de fondos. Recibirás un reembolso parcial.",
    provider: "El administrador resolvió con división de fondos. Recibirás un pago parcial.",
  },
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const respond = (status: number, data: Record<string, unknown>) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return respond(401, { error: "No authorization header" });
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData.user) return respond(401, { error: "Authentication failed" });
    if (userData.user.id !== ADMIN_ID) return respond(403, { error: "Admin only" });

    const { dispute_id, admin_ruling, split_percentage_client, admin_notes } = await req.json();
    if (!dispute_id || !admin_ruling) return respond(400, { error: "dispute_id and admin_ruling are required" });
    if (!["client_wins", "provider_wins", "split"].includes(admin_ruling)) {
      return respond(400, { error: "admin_ruling must be client_wins, provider_wins, or split" });
    }
    if (admin_ruling === "split" && (split_percentage_client == null || split_percentage_client < 0 || split_percentage_client > 100)) {
      return respond(400, { error: "split_percentage_client must be 0–100 for split ruling" });
    }

    const { data: dispute } = await (supabase as any)
      .from("disputes")
      .select("*")
      .eq("id", dispute_id)
      .single();

    if (!dispute) return respond(404, { error: "Dispute not found" });

    const { data: job } = await supabase
      .from("jobs")
      .select("id, client_id, provider_id, title")
      .eq("id", dispute.job_id)
      .single();

    if (!job) return respond(404, { error: "Job not found" });

    log("Resolving", { dispute_id, admin_ruling, job_id: dispute.job_id });

    // ── Stripe actions (best-effort) ───────────────────────────────────────────
    const stripeErrors: string[] = [];
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (stripeKey && dispute.invoice_id) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

        const { data: invoicePayment } = await supabase
          .from("payments")
          .select("stripe_payment_intent_id, total_amount_cents, amount")
          .eq("job_id", dispute.job_id)
          .in("type", ["invoice_payment", "invoice", "checkout"])
          .eq("status", "succeeded")
          .maybeSingle();

        if (invoicePayment?.stripe_payment_intent_id) {
          const pi = await stripe.paymentIntents.retrieve(invoicePayment.stripe_payment_intent_id);
          const totalCents = invoicePayment.total_amount_cents || Math.round((invoicePayment.amount || 0) * 100);

          if (admin_ruling === "client_wins" && pi.latest_charge) {
            await stripe.refunds.create({ charge: pi.latest_charge as string });
            log("Full refund issued to client");

          } else if (admin_ruling === "provider_wins") {
            const { data: provider } = await supabase
              .from("providers").select("stripe_account_id, stripe_payouts_enabled").eq("user_id", job.provider_id).maybeSingle();
            if (provider?.stripe_account_id && provider.stripe_payouts_enabled) {
              await stripe.transfers.create({
                amount: totalCents, currency: "mxn", destination: provider.stripe_account_id,
                metadata: { dispute_id, ruling: admin_ruling },
              });
              log("Full payout to provider");
            } else stripeErrors.push("Provider not payout-enabled");

          } else if (admin_ruling === "split") {
            const clientCents = Math.round(totalCents * (split_percentage_client / 100));
            const providerCents = totalCents - clientCents;
            if (clientCents > 0 && pi.latest_charge) {
              await stripe.refunds.create({ charge: pi.latest_charge as string, amount: clientCents });
            }
            if (providerCents > 0) {
              const { data: provider } = await supabase
                .from("providers").select("stripe_account_id, stripe_payouts_enabled").eq("user_id", job.provider_id).maybeSingle();
              if (provider?.stripe_account_id && provider.stripe_payouts_enabled) {
                await stripe.transfers.create({
                  amount: providerCents, currency: "mxn", destination: provider.stripe_account_id,
                  metadata: { dispute_id, ruling: admin_ruling, split_pct: split_percentage_client },
                });
              } else stripeErrors.push("Provider not payout-enabled for split payout");
            }
          }
        } else {
          stripeErrors.push("No invoice payment record found — manual Stripe action needed");
        }
      } catch (stripeErr: any) {
        log("Stripe error (non-fatal)", { error: stripeErr.message });
        stripeErrors.push(stripeErr.message);
      }
    }

    // ── DB updates ─────────────────────────────────────────────────────────────
    await (supabase as any).from("disputes").update({
      admin_ruling,
      split_percentage_client: admin_ruling === "split" ? split_percentage_client : null,
      admin_notes: admin_notes || null,
      status: "resolved",
      resolved_at: new Date().toISOString(),
      resolved_by_admin_id: ADMIN_ID,
      resolution_notes: admin_notes || null,
    }).eq("id", dispute_id);

    await supabase.from("jobs").update({
      has_open_dispute: false,
      dispute_status: "resolved",
      updated_at: new Date().toISOString(),
    }).eq("id", dispute.job_id);

    // ── Notify both parties ────────────────────────────────────────────────────
    const labels = RULING_LABELS[admin_ruling];
    const short = dispute_id.slice(0, 8);
    const notifs = [
      { user_id: job.client_id, type: "dispute_resolved", title: `Disputa #${short} resuelta`, message: labels.client, link: `/active-jobs`, data: { dispute_id } },
      ...(job.provider_id ? [{
        user_id: job.provider_id, type: "dispute_resolved", title: `Disputa #${short} resuelta`,
        message: labels.provider, link: `/provider-portal/jobs/${dispute.job_id}`, data: { dispute_id },
      }] : []),
    ];
    await supabase.from("notifications").insert(notifs);

    log("Resolved", { dispute_id, admin_ruling, stripeErrors });

    return respond(200, { success: true, dispute_id, admin_ruling, stripe_errors: stripeErrors });
  } catch (e: any) {
    log("ERROR", { message: e.message });
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...getCorsHeaders(req), "Content-Type": "application/json" },
    });
  }
});
