import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[COMPLETE-FIRST-VISIT] ${step}${detailsStr}`);
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
    logStep("🔴 Using Stripe LIVE mode");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate provider
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) {
      throw new Error(`Authentication error: ${userError?.message || "User not found"}`);
    }
    const provider = userData.user;
    logStep("Provider authenticated", { providerId: provider.id });

    // Parse request body
    const { jobId, action = "capture" } = await req.json();
    if (!jobId) {
      throw new Error("jobId is required");
    }
    logStep("Request parsed", { jobId, action });

    // Validate action
    if (!["capture", "release"].includes(action)) {
      throw new Error("Invalid action. Must be 'capture' or 'release'");
    }

    // Fetch job and validate provider assignment
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("id, title, provider_id, provider_visited, stripe_visit_payment_intent_id, visit_fee_amount, visit_fee_paid, status")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message || "Unknown error"}`);
    }

    // Verify provider is assigned to this job
    if (job.provider_id !== provider.id) {
      throw new Error("You are not assigned to this job");
    }
    logStep("Job validated", { jobId: job.id, title: job.title, providerId: job.provider_id });

    // Check if first visit already completed
    if (job.provider_visited === true) {
      logStep("First visit already completed for this job");
      return new Response(
        JSON.stringify({ 
          success: true,
          message: "First visit already completed",
          already_completed: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const paymentIntentId = job.stripe_visit_payment_intent_id;
    
    if (!paymentIntentId) {
      logStep("No PaymentIntent found for this job, marking visit complete without payment action");
      
      // Update job to mark first visit complete even without payment
      const { error: updateError } = await supabaseClient
        .from("jobs")
        .update({ provider_visited: true })
        .eq("id", jobId);

      if (updateError) {
        throw new Error(`Failed to update job: ${updateError.message}`);
      }

      return new Response(
        JSON.stringify({ 
          success: true,
          message: "First visit marked complete (no payment authorization existed)",
          payment_action: "none"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Retrieve PaymentIntent to check its current status
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    logStep("PaymentIntent retrieved", { 
      id: paymentIntent.id, 
      status: paymentIntent.status,
      amount: paymentIntent.amount 
    });

    let paymentAction = "";
    let paymentResult;

    if (action === "capture") {
      // Capture the authorized amount
      if (paymentIntent.status === "requires_capture") {
        logStep("Capturing PaymentIntent");
        paymentResult = await stripe.paymentIntents.capture(paymentIntentId);
        paymentAction = "captured";
        logStep("PaymentIntent captured successfully", { 
          id: paymentResult.id, 
          status: paymentResult.status 
        });
      } else if (paymentIntent.status === "succeeded") {
        logStep("PaymentIntent already captured/succeeded");
        paymentAction = "already_captured";
      } else {
        throw new Error(`Cannot capture PaymentIntent with status: ${paymentIntent.status}`);
      }
    } else if (action === "release") {
      // Cancel/release the authorization
      if (["requires_capture", "requires_payment_method", "requires_confirmation"].includes(paymentIntent.status)) {
        logStep("Releasing (canceling) PaymentIntent");
        paymentResult = await stripe.paymentIntents.cancel(paymentIntentId);
        paymentAction = "released";
        logStep("PaymentIntent released successfully", { 
          id: paymentResult.id, 
          status: paymentResult.status 
        });
      } else if (paymentIntent.status === "canceled") {
        logStep("PaymentIntent already canceled");
        paymentAction = "already_released";
      } else {
        throw new Error(`Cannot release PaymentIntent with status: ${paymentIntent.status}`);
      }
    }

    // Update job record to mark first visit complete
    const updateData: Record<string, unknown> = { 
      provider_visited: true 
    };

    // If captured, also mark visit fee as paid
    if (paymentAction === "captured" || paymentAction === "already_captured") {
      updateData.visit_fee_paid = true;
    }

    const { error: jobUpdateError } = await supabaseClient
      .from("jobs")
      .update(updateData)
      .eq("id", jobId);

    if (jobUpdateError) {
      logStep("Error updating job record", { error: jobUpdateError.message });
      throw new Error(`Failed to update job: ${jobUpdateError.message}`);
    }

    logStep("Job updated successfully", { provider_visited: true, visit_fee_paid: updateData.visit_fee_paid });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `First visit completed. Payment ${paymentAction}.`,
        payment_action: paymentAction,
        payment_intent_id: paymentIntentId,
        payment_intent_status: paymentResult?.status || paymentIntent.status
      }),
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
