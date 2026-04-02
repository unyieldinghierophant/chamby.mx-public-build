import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-VISIT-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY not configured");
    }
    const isTestMode = stripeKey.startsWith('sk_test_');
    logStep(isTestMode ? "🟢 Using Stripe TEST mode" : "🔴 Using Stripe LIVE mode");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error(`Authentication error: ${userError?.message || "User not found"}`);
    }
    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const { jobId } = await req.json();
    if (!jobId) {
      throw new Error("jobId is required");
    }
    logStep("Request parsed", { jobId });

    // Fetch the job — verify ownership and status
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("id, title, visit_fee_paid, status")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message || "Unknown error"}`);
    }

    if (job.visit_fee_paid) {
      throw new Error("Visit fee has already been paid for this job");
    }

    if (job.status !== "draft" && job.status !== "pending") {
      throw new Error(`Job is not in a payable status (current: ${job.status})`);
    }

    // Fixed visit fee — $406.00 MXN ($350 base + $56 IVA 16%)
    // SYNC WITH src/utils/pricingConfig.ts PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS
    const VISIT_FEE_CENTS = 40600;

    logStep("Job found", { jobId: job.id, title: job.title, amountCents: VISIT_FEE_CENTS });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if customer exists
    let customerId: string | undefined;
    if (user.email) {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId });
      }
    }

    const origin = req.headers.get("origin") || "https://chambymk1.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{
        price_data: {
          currency: "mxn",
          product_data: { name: "Diagnóstico a domicilio — Chamby" },
          unit_amount: VISIT_FEE_CENTS,
        },
        quantity: 1,
      }],
      mode: "payment",
      payment_intent_data: {
        capture_method: "manual",  // Hold only — captured after job completion
      },
      success_url: `${origin}/active-jobs?visit_fee_paid=true&job_id=${jobId}`,
      cancel_url: `${origin}/book-job?cancelled=true&job_id=${jobId}`,
      metadata: {
        jobId,
        userId: user.id,
        type: "visit_fee",
        pricing_version: "visit_v5_406_hold",
      },
    });

    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(
      JSON.stringify({ url: session.url, sessionId: session.id }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
