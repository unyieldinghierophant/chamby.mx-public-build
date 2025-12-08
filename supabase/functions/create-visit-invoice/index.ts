import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-VISIT-INVOICE] ${step}${detailsStr}`);
};

const CHAMBY_COMMISSION_RATE = 0.15; // 15% commission

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
    const provider = userData.user;
    logStep("Provider authenticated", { providerId: provider.id });

    const { jobId, lineItems, description } = await req.json();
    if (!jobId || !lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error("jobId and lineItems are required");
    }
    logStep("Request parsed", { jobId, itemCount: lineItems.length });

    // Fetch the job to get client info
    const { data: job, error: jobError } = await supabaseClient
      .from("jobs")
      .select("id, title, client_id, provider_id")
      .eq("id", jobId)
      .single();

    if (jobError || !job) {
      throw new Error(`Job not found: ${jobError?.message || "Unknown error"}`);
    }

    if (job.provider_id !== provider.id) {
      throw new Error("You are not the provider for this job");
    }
    logStep("Job verified", { jobId: job.id, clientId: job.client_id });

    // Calculate totals
    const subtotalProvider = lineItems.reduce((sum: number, item: { amount: number; quantity: number }) => {
      return sum + (item.amount * item.quantity);
    }, 0);
    
    const chambyCommission = Math.round(subtotalProvider * CHAMBY_COMMISSION_RATE);
    const totalCustomerAmount = subtotalProvider + chambyCommission;

    logStep("Totals calculated", { subtotalProvider, chambyCommission, totalCustomerAmount });

    // Create invoice in database
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .insert({
        job_id: jobId,
        provider_id: provider.id,
        user_id: job.client_id,
        subtotal_provider: subtotalProvider,
        chamby_commission_amount: chambyCommission,
        total_customer_amount: totalCustomerAmount,
        status: "pending_payment",
        provider_notes: description || null,
      })
      .select()
      .single();

    if (invoiceError || !invoice) {
      throw new Error(`Failed to create invoice: ${invoiceError?.message || "Unknown error"}`);
    }
    logStep("Invoice created", { invoiceId: invoice.id });

    // Create invoice items
    const invoiceItems = lineItems.map((item: { description: string; amount: number; quantity: number }) => ({
      invoice_id: invoice.id,
      description: item.description,
      unit_price: item.amount,
      quantity: item.quantity,
      total: item.amount * item.quantity,
    }));

    const { error: itemsError } = await supabaseClient
      .from("invoice_items")
      .insert(invoiceItems);

    if (itemsError) {
      throw new Error(`Failed to create invoice items: ${itemsError.message}`);
    }
    logStep("Invoice items created", { count: invoiceItems.length });

    // Create Stripe Payment Intent
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Get customer email
    const { data: clientUser } = await supabaseClient
      .from("users")
      .select("email, stripe_customer_id")
      .eq("id", job.client_id)
      .single();

    let customerId = clientUser?.stripe_customer_id;
    
    if (!customerId && clientUser?.email) {
      const customers = await stripe.customers.list({ email: clientUser.email, limit: 1 });
      if (customers.data.length > 0) {
        customerId = customers.data[0].id;
        // Save customer ID for future use
        await supabaseClient
          .from("users")
          .update({ stripe_customer_id: customerId })
          .eq("id", job.client_id);
      }
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: totalCustomerAmount * 100, // Convert to centavos
      currency: "mxn",
      customer: customerId,
      metadata: {
        invoiceId: invoice.id,
        jobId,
        providerId: provider.id,
        userId: job.client_id,
        type: "invoice_payment",
      },
      description: `Factura Chamby - ${job.title}`,
    });

    logStep("Payment intent created", { paymentIntentId: paymentIntent.id });

    // Update invoice with payment intent ID
    await supabaseClient
      .from("invoices")
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq("id", invoice.id);

    // Create notification for client
    await supabaseClient
      .from("notifications")
      .insert({
        user_id: job.client_id,
        type: "invoice_created",
        title: "Nueva factura",
        message: `El proveedor ha enviado una factura por $${totalCustomerAmount} MXN`,
        link: `/invoices/${invoice.id}`,
        data: { invoiceId: invoice.id, jobId, amount: totalCustomerAmount },
      });

    logStep("Notification created for client");

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoice.id,
          subtotal_provider: subtotalProvider,
          chamby_commission_amount: chambyCommission,
          total_customer_amount: totalCustomerAmount,
        },
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
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
