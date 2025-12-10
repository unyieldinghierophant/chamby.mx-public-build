import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GET-VISIT-AUTHORIZATION-STATUS] ${step}${detailsStr}`);
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

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Authenticate user
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
    logStep("User authenticated", { userId: user.id });

    // Parse request body
    const { jobId } = await req.json();
    if (!jobId) {
      throw new Error("jobId is required");
    }
    logStep("Request parsed", { jobId });

    // Fetch job details
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select(`
        id,
        title,
        client_id,
        provider_id,
        stripe_visit_payment_intent_id,
        visit_fee_amount,
        visit_fee_paid,
        scheduled_at,
        status
      `)
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message || "Unknown error"}`);
    }

    // Only the job's client can request this
    if (job.client_id !== user.id) {
      throw new Error("You do not have permission to view this job's payment status");
    }

    logStep("Job fetched", { 
      jobId: job.id, 
      hasPaymentIntent: !!job.stripe_visit_payment_intent_id,
      visitFeePaid: job.visit_fee_paid 
    });

    // If visit fee already paid, return that status
    if (job.visit_fee_paid) {
      return new Response(
        JSON.stringify({
          status: "paid",
          paymentIntentId: job.stripe_visit_payment_intent_id,
          clientSecret: null,
          needsCreation: false,
          amount: job.visit_fee_amount || 350,
          job: {
            id: job.id,
            title: job.title,
            scheduledAt: job.scheduled_at,
            status: job.status
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // If no PaymentIntent exists, we need to create one
    if (!job.stripe_visit_payment_intent_id) {
      logStep("No PaymentIntent exists, needs creation");
      return new Response(
        JSON.stringify({
          status: "needs_creation",
          paymentIntentId: null,
          clientSecret: null,
          needsCreation: true,
          amount: job.visit_fee_amount || 350,
          job: {
            id: job.id,
            title: job.title,
            scheduledAt: job.scheduled_at,
            status: job.status
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Retrieve PaymentIntent from Stripe to get current status
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const paymentIntent = await stripe.paymentIntents.retrieve(job.stripe_visit_payment_intent_id);

    logStep("PaymentIntent retrieved", { 
      id: paymentIntent.id, 
      status: paymentIntent.status 
    });

    // Determine if we need to return client_secret for completion
    let clientSecret: string | null = null;
    let needsCreation = false;
    let mappedStatus = "unknown";

    switch (paymentIntent.status) {
      case "requires_payment_method":
        // User needs to add a payment method
        clientSecret = paymentIntent.client_secret;
        mappedStatus = "requires_payment_method";
        break;
      case "requires_confirmation":
        // User needs to confirm the payment
        clientSecret = paymentIntent.client_secret;
        mappedStatus = "requires_confirmation";
        break;
      case "requires_action":
        // 3D Secure or other action required
        clientSecret = paymentIntent.client_secret;
        mappedStatus = "requires_action";
        break;
      case "processing":
        mappedStatus = "processing";
        break;
      case "requires_capture":
        // Authorization successful, waiting for capture
        mappedStatus = "authorized";
        break;
      case "succeeded":
        mappedStatus = "paid";
        break;
      case "canceled":
        // PI was canceled, need to create a new one
        needsCreation = true;
        mappedStatus = "canceled";
        break;
      default:
        mappedStatus = paymentIntent.status;
    }

    // Fetch provider info if assigned
    let provider = null;
    if (job.provider_id) {
      const { data: providerData } = await supabaseClient
        .from("providers")
        .select("display_name, avatar_url")
        .eq("user_id", job.provider_id)
        .single();
      
      if (providerData) {
        provider = {
          displayName: providerData.display_name,
          avatarUrl: providerData.avatar_url
        };
      }
    }

    return new Response(
      JSON.stringify({
        status: mappedStatus,
        paymentIntentId: paymentIntent.id,
        clientSecret,
        needsCreation,
        amount: job.visit_fee_amount || 350,
        job: {
          id: job.id,
          title: job.title,
          scheduledAt: job.scheduled_at,
          status: job.status
        },
        provider
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
