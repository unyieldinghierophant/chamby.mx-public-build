import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[RELEASE-PROVIDER-PAYOUT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Admin-only: verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) throw new Error("Admin access required");

    logStep("Admin verified", { userId: userData.user.id });

    const { job_id, payout_id } = await req.json();
    if (!job_id && !payout_id) throw new Error("job_id or payout_id is required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let targetPayoutId = payout_id;
    let targetJobId = job_id;

    // If payout_id provided, get payout details
    if (payout_id) {
      const { data: payout, error: payoutErr } = await supabase
        .from("payouts")
        .select("id, provider_id, invoice_id, amount, status, stripe_transfer_id")
        .eq("id", payout_id)
        .single();

      if (payoutErr || !payout) throw new Error("Payout not found");
      if (payout.stripe_transfer_id) throw new Error("Payout already transferred");
      if (payout.status === "paid") throw new Error("Payout already paid");

      // Get job_id from invoice
      const { data: invoice } = await supabase
        .from("invoices")
        .select("job_id")
        .eq("id", payout.invoice_id)
        .single();

      targetJobId = invoice?.job_id;

      // Get provider's stripe account
      const { data: provider } = await supabase
        .from("providers")
        .select("stripe_account_id, stripe_onboarding_status")
        .eq("user_id", payout.provider_id)
        .single();

      if (!provider?.stripe_account_id) {
        throw new Error("Provider has no Stripe connected account");
      }
      if (provider.stripe_onboarding_status !== "enabled") {
        throw new Error(`Provider onboarding status is '${provider.stripe_onboarding_status}', must be 'enabled'`);
      }

      logStep("Creating transfer", {
        amount: payout.amount,
        destination: provider.stripe_account_id,
      });

      // Create transfer to connected account
      const transfer = await stripe.transfers.create({
        amount: Math.round(payout.amount * 100), // Convert pesos to centavos
        currency: "mxn",
        destination: provider.stripe_account_id,
        metadata: {
          payout_id: payout.id,
          job_id: targetJobId || "",
          provider_id: payout.provider_id,
        },
      });

      logStep("Transfer created", { transferId: transfer.id });

      // Update payout record
      await supabase
        .from("payouts")
        .update({
          stripe_transfer_id: transfer.id,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", payout.id);

      return new Response(
        JSON.stringify({
          success: true,
          transfer_id: transfer.id,
          payout_id: payout.id,
          amount: payout.amount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // If job_id provided, find related payout or create one
    if (job_id) {
      // Get job with provider
      const { data: job, error: jobErr } = await supabase
        .from("jobs")
        .select("id, provider_id, status")
        .eq("id", job_id)
        .single();

      if (jobErr || !job) throw new Error("Job not found");
      if (!job.provider_id) throw new Error("Job has no assigned provider");

      // Get provider's stripe account
      const { data: provider } = await supabase
        .from("providers")
        .select("stripe_account_id, stripe_onboarding_status, user_id")
        .eq("user_id", job.provider_id)
        .single();

      if (!provider?.stripe_account_id) {
        throw new Error("Provider has no Stripe connected account");
      }
      if (provider.stripe_onboarding_status !== "enabled") {
        throw new Error(`Provider onboarding not complete: ${provider.stripe_onboarding_status}`);
      }

      // Find unpaid payout for this job
      const { data: existingPayout } = await supabase
        .from("payouts")
        .select("id, amount, stripe_transfer_id, invoice_id")
        .eq("provider_id", job.provider_id)
        .is("stripe_transfer_id", null)
        .neq("status", "paid")
        .limit(1)
        .maybeSingle();

      if (!existingPayout) {
        throw new Error("No pending payout found for this job. Create a payout first.");
      }

      const transfer = await stripe.transfers.create({
        amount: Math.round(existingPayout.amount * 100),
        currency: "mxn",
        destination: provider.stripe_account_id,
        metadata: {
          payout_id: existingPayout.id,
          job_id: job.id,
          provider_id: job.provider_id,
        },
      });

      logStep("Transfer created via job_id", { transferId: transfer.id });

      await supabase
        .from("payouts")
        .update({
          stripe_transfer_id: transfer.id,
          status: "paid",
          paid_at: new Date().toISOString(),
        })
        .eq("id", existingPayout.id);

      return new Response(
        JSON.stringify({
          success: true,
          transfer_id: transfer.id,
          payout_id: existingPayout.id,
          amount: existingPayout.amount,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    throw new Error("No valid input provided");
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
