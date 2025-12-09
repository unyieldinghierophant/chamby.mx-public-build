import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-OR-GET-INVOICE] ${step}${detailsStr}`);
};

const PROVIDER_FEE_RATE = 0.10; // 10% from provider
const CUSTOMER_FEE_RATE = 0.10; // 10% from customer
// Total Chamby commission = 20% (10% + 10%)

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
    const { jobId, lineItems, description } = await req.json();
    if (!jobId) {
      throw new Error("jobId is required");
    }
    logStep("Request parsed", { jobId, lineItemsCount: lineItems?.length || 0 });

    // Fetch job and validate provider assignment
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("id, title, client_id, provider_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message || "Unknown error"}`);
    }

    // Verify provider is assigned to this job
    if (job.provider_id !== provider.id) {
      throw new Error("You are not assigned to this job");
    }
    logStep("Job validated", { jobId: job.id, title: job.title, clientId: job.client_id });

    // Check if invoice already exists for this job (idempotent)
    const { data: existingInvoice, error: existingError } = await supabaseClient
      .from("invoices")
      .select("*")
      .eq("job_id", jobId)
      .eq("provider_id", provider.id)
      .maybeSingle();

    if (existingError) {
      logStep("Error checking existing invoice", { error: existingError.message });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // If invoice exists, return it with existing PaymentIntent
    if (existingInvoice) {
      logStep("Existing invoice found", { invoiceId: existingInvoice.id });

      // Fetch existing invoice items
      const { data: existingItems } = await supabaseClient
        .from("invoice_items")
        .select("*")
        .eq("invoice_id", existingInvoice.id)
        .order("created_at", { ascending: true });

      // If PaymentIntent exists, retrieve it to get client_secret
      let clientSecret = null;
      if (existingInvoice.stripe_payment_intent_id) {
        try {
          const existingPI = await stripe.paymentIntents.retrieve(existingInvoice.stripe_payment_intent_id);
          clientSecret = existingPI.client_secret;
          logStep("Retrieved existing PaymentIntent", { 
            id: existingPI.id, 
            status: existingPI.status 
          });
        } catch (piError) {
          logStep("Error retrieving existing PaymentIntent", { error: String(piError) });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          already_exists: true,
          invoice: {
            id: existingInvoice.id,
            job_id: existingInvoice.job_id,
            provider_id: existingInvoice.provider_id,
            user_id: existingInvoice.user_id,
            subtotal_provider: existingInvoice.subtotal_provider,
            chamby_commission_amount: existingInvoice.chamby_commission_amount,
            total_customer_amount: existingInvoice.total_customer_amount,
            status: existingInvoice.status,
            provider_notes: existingInvoice.provider_notes,
            stripe_payment_intent_id: existingInvoice.stripe_payment_intent_id,
            created_at: existingInvoice.created_at,
          },
          invoice_items: existingItems || [],
          payment_intent_client_secret: clientSecret,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // No existing invoice - create new one
    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error("lineItems are required when creating a new invoice");
    }

    // Calculate totals
    const subtotalProvider = lineItems.reduce((sum: number, item: { amount: number; quantity: number }) => {
      return sum + (item.amount * item.quantity);
    }, 0);

    if (subtotalProvider <= 0) {
      throw new Error("Invoice total must be greater than zero");
    }

    // Commission model: Provider pays 10%, Customer pays 10%, Chamby keeps 20% total
    const subtotal = subtotalProvider; // The raw line item total
    const providerFee = Math.round(subtotal * PROVIDER_FEE_RATE * 100) / 100;
    const customerFee = Math.round(subtotal * CUSTOMER_FEE_RATE * 100) / 100;
    
    const chambyCommission = providerFee + customerFee; // Total 20%
    const totalCustomerAmount = subtotal + customerFee; // Customer pays subtotal + 10%
    const subtotalProviderNet = subtotal - providerFee; // Provider receives subtotal - 10%

    logStep("Totals calculated", { 
      subtotal, 
      providerFee, 
      customerFee, 
      chambyCommission, 
      totalCustomerAmount, 
      subtotalProviderNet 
    });

    // Create invoice record
    const { data: newInvoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .insert({
        job_id: jobId,
        provider_id: provider.id,
        user_id: job.client_id,
        subtotal_provider: subtotalProviderNet,
        chamby_commission_amount: chambyCommission,
        total_customer_amount: totalCustomerAmount,
        status: "pending_payment",
        provider_notes: description || null,
      })
      .select()
      .single();

    if (invoiceError || !newInvoice) {
      throw new Error(`Failed to create invoice: ${invoiceError?.message || "Unknown error"}`);
    }
    logStep("Invoice created", { invoiceId: newInvoice.id });

    // Create invoice items
    const invoiceItemsToInsert = lineItems.map((item: { description: string; amount: number; quantity: number }) => ({
      invoice_id: newInvoice.id,
      description: item.description,
      unit_price: item.amount,
      quantity: item.quantity,
      total: item.amount * item.quantity,
    }));

    const { data: insertedItems, error: itemsError } = await supabaseClient
      .from("invoice_items")
      .insert(invoiceItemsToInsert)
      .select();

    if (itemsError) {
      logStep("Error creating invoice items", { error: itemsError.message });
      throw new Error(`Failed to create invoice items: ${itemsError.message}`);
    }
    logStep("Invoice items created", { count: insertedItems?.length || 0 });

    // Get customer info for Stripe
    const { data: clientUser } = await supabaseClient
      .from("users")
      .select("email, stripe_customer_id")
      .eq("id", job.client_id)
      .maybeSingle();

    let stripeCustomerId = clientUser?.stripe_customer_id;

    // Look up or create Stripe customer
    if (!stripeCustomerId && clientUser?.email) {
      const customers = await stripe.customers.list({ email: clientUser.email, limit: 1 });
      if (customers.data.length > 0) {
        stripeCustomerId = customers.data[0].id;
        logStep("Found existing Stripe customer", { customerId: stripeCustomerId });
        
        // Save customer ID for future use
        await supabaseClient
          .from("users")
          .update({ stripe_customer_id: stripeCustomerId })
          .eq("id", job.client_id);
      }
    }

    // Create PaymentIntent with USD currency and transfer_group
    const paymentIntentData: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(totalCustomerAmount * 100), // Convert to cents (USD)
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        invoice_id: newInvoice.id,
        job_id: jobId,
        provider_id: provider.id,
        user_id: job.client_id,
        type: "invoice_payment",
      },
      transfer_group: newInvoice.id,
      description: `Invoice for job: ${job.title}`,
    };

    // Add customer if we have one
    if (stripeCustomerId) {
      paymentIntentData.customer = stripeCustomerId;
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentData);
    logStep("PaymentIntent created", { 
      id: paymentIntent.id, 
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });

    // Update invoice with PaymentIntent ID
    const { error: updateError } = await supabaseClient
      .from("invoices")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", newInvoice.id);

    if (updateError) {
      logStep("Warning: Failed to save PaymentIntent ID to invoice", { error: updateError.message });
    }

    // Create notification for client
    await supabaseClient
      .from("notifications")
      .insert({
        user_id: job.client_id,
        type: "invoice_created",
        title: "Nueva factura recibida",
        message: `Has recibido una factura por $${totalCustomerAmount.toFixed(2)} USD`,
        link: `/invoices/${newInvoice.id}`,
        data: { 
          invoiceId: newInvoice.id, 
          jobId, 
          amount: totalCustomerAmount 
        },
      });
    logStep("Notification created for client");

    return new Response(
      JSON.stringify({
        success: true,
        already_exists: false,
        invoice: {
          id: newInvoice.id,
          job_id: newInvoice.job_id,
          provider_id: newInvoice.provider_id,
          user_id: newInvoice.user_id,
          subtotal_provider: subtotalProviderNet,
          chamby_commission_amount: chambyCommission,
          total_customer_amount: totalCustomerAmount,
          status: "pending_payment",
          provider_notes: description || null,
          stripe_payment_intent_id: paymentIntent.id,
          created_at: newInvoice.created_at,
        },
        invoice_items: insertedItems || [],
        payment_intent_client_secret: paymentIntent.client_secret,
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
