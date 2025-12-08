import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-VISIT-AUTHORIZATION] ${step}${detailsStr}`);
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

    // Use service role key to update users table
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
    logStep("User authenticated", { userId: user.id, email: user.email });

    // Parse request body
    const { jobId } = await req.json();
    if (!jobId) {
      throw new Error("jobId is required");
    }
    logStep("Request parsed", { jobId });

    // Fetch job and validate ownership
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("id, title, visit_fee_amount, visit_fee_paid, client_id, stripe_visit_payment_intent_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message || "Unknown error"}`);
    }

    // Validate ownership
    if (job.client_id !== user.id) {
      throw new Error("You do not own this job");
    }

    // Check if already authorized
    if (job.stripe_visit_payment_intent_id) {
      logStep("Job already has PaymentIntent", { paymentIntentId: job.stripe_visit_payment_intent_id });
      
      // Retrieve existing PaymentIntent to return client_secret
      const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
      const existingPI = await stripe.paymentIntents.retrieve(job.stripe_visit_payment_intent_id);
      
      return new Response(
        JSON.stringify({ 
          client_secret: existingPI.client_secret,
          payment_intent_id: existingPI.id,
          already_exists: true
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (job.visit_fee_paid) {
      throw new Error("Visit fee has already been paid for this job");
    }

    const visitFeeAmount = job.visit_fee_amount || 350;
    logStep("Job validated", { jobId: job.id, title: job.title, visitFeeAmount, clientId: job.client_id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Step 1: Ensure Stripe Customer exists
    // First check if user has stripe_customer_id in database
    const { data: userRecord, error: userRecordError } = await supabaseClient
      .from("users")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .single();

    if (userRecordError) {
      logStep("Error fetching user record", { error: userRecordError.message });
    }

    let stripeCustomerId = userRecord?.stripe_customer_id;

    if (!stripeCustomerId) {
      logStep("No Stripe customer ID found, checking Stripe by email");
      
      // Check if customer exists in Stripe by email
      const customerEmail = userRecord?.email || user.email;
      if (customerEmail) {
        const existingCustomers = await stripe.customers.list({ 
          email: customerEmail, 
          limit: 1 
        });
        
        if (existingCustomers.data.length > 0) {
          stripeCustomerId = existingCustomers.data[0].id;
          logStep("Found existing Stripe customer by email", { customerId: stripeCustomerId });
        }
      }

      // If still no customer, create one
      if (!stripeCustomerId) {
        logStep("Creating new Stripe customer");
        const newCustomer = await stripe.customers.create({
          email: customerEmail || undefined,
          name: userRecord?.full_name || undefined,
          metadata: {
            supabase_user_id: user.id
          }
        });
        stripeCustomerId = newCustomer.id;
        logStep("Created new Stripe customer", { customerId: stripeCustomerId });
      }

      // Save customer ID to users table
      const { error: updateError } = await supabaseClient
        .from("users")
        .update({ stripe_customer_id: stripeCustomerId })
        .eq("id", user.id);

      if (updateError) {
        logStep("Warning: Failed to save stripe_customer_id to users table", { error: updateError.message });
        // Don't throw - continue with the payment intent creation
      } else {
        logStep("Saved stripe_customer_id to users table");
      }
    } else {
      logStep("Using existing Stripe customer", { customerId: stripeCustomerId });
    }

    // Step 2: Create PaymentIntent with manual capture
    logStep("Creating PaymentIntent with manual capture", { 
      amount: visitFeeAmount * 100, 
      currency: "usd",
      customerId: stripeCustomerId 
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: visitFeeAmount * 100, // Convert to cents (USD)
      currency: "usd",
      customer: stripeCustomerId,
      capture_method: "manual",
      automatic_payment_methods: { enabled: true },
      description: `Visit fee authorization for job ${jobId}`,
      metadata: {
        jobId,
        userId: user.id,
        type: "visit_fee_authorization"
      }
    });

    logStep("PaymentIntent created", { 
      paymentIntentId: paymentIntent.id, 
      status: paymentIntent.status 
    });

    // Step 3: Save PaymentIntent ID to job record
    const { error: jobUpdateError } = await supabaseClient
      .from("jobs")
      .update({ stripe_visit_payment_intent_id: paymentIntent.id })
      .eq("id", jobId);

    if (jobUpdateError) {
      logStep("Error saving PaymentIntent ID to job", { error: jobUpdateError.message });
      throw new Error(`Failed to save PaymentIntent: ${jobUpdateError.message}`);
    }

    logStep("PaymentIntent ID saved to job record");

    // Return client_secret for frontend to confirm payment
    return new Response(
      JSON.stringify({ 
        client_secret: paymentIntent.client_secret,
        payment_intent_id: paymentIntent.id,
        amount: visitFeeAmount,
        currency: "usd"
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
