import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-INVOICE-PAYMENT] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");
    const user = userData.user;
    logStep("User authenticated", { userId: user.id });

    // Get invoice_id from body
    const body = await req.json();
    const { invoice_id } = body;
    if (!invoice_id) throw new Error("invoice_id is required");

    // Fetch invoice
    const { data: invoice, error: invError } = await supabaseClient
      .from("invoices")
      .select("*")
      .eq("id", invoice_id)
      .single();

    if (invError || !invoice) throw new Error("Invoice not found");
    logStep("Invoice fetched", { invoiceId: invoice.id, status: invoice.status });

    // Verify caller is the client
    if (invoice.user_id !== user.id) {
      throw new Error("Unauthorized: you are not the client for this invoice");
    }

    // Verify invoice is accepted
    if (invoice.status !== "accepted") {
      throw new Error(`Invoice status must be 'accepted', got '${invoice.status}'`);
    }

    // Calculate amount in centavos for Stripe (total_customer_amount is in pesos)
    const amountCentavos = Math.round(invoice.total_customer_amount * 100);
    if (amountCentavos <= 0) throw new Error("Invalid invoice amount");

    logStep("Creating checkout session", { amountCentavos, currency: "mxn" });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check/create Stripe customer
    const { data: userRow } = await supabaseClient
      .from("users")
      .select("stripe_customer_id, email, full_name")
      .eq("id", user.id)
      .single();

    let customerId = userRow?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email || userRow?.email || undefined,
        name: userRow?.full_name || undefined,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;

      await supabaseClient
        .from("users")
        .update({ stripe_customer_id: customerId })
        .eq("id", user.id);

      logStep("Stripe customer created", { customerId });
    }

    // Create Checkout Session
    const origin = req.headers.get("origin") || "https://chambymk1.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "mxn",
            unit_amount: amountCentavos,
            product_data: {
              name: `Factura del trabajo`,
              description: `Pago de factura #${invoice.id.slice(0, 8)}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/active-jobs?invoice_paid=true`,
      cancel_url: `${origin}/active-jobs?invoice_cancelled=true`,
      metadata: {
        type: "invoice_payment",
        invoiceId: invoice.id,
        jobId: invoice.job_id,
        providerId: invoice.provider_id,
        userId: user.id,
      },
    });

    logStep("Checkout session created", { sessionId: session.id });

    // Save payment intent reference (will be available after checkout)
    if (session.payment_intent) {
      await supabaseClient
        .from("invoices")
        .update({ stripe_payment_intent_id: session.payment_intent as string })
        .eq("id", invoice.id);
    }

    // Record in payments ledger
    await supabaseClient
      .from("payments")
      .insert({
        job_id: invoice.job_id,
        provider_id: invoice.provider_id,
        stripe_checkout_session_id: session.id,
        stripe_payment_intent_id: (session.payment_intent as string) || null,
        amount: amountCentavos,
        currency: "mxn",
        type: "job_invoice",
        status: "pending",
        metadata: {
          invoice_id: invoice.id,
          client_id: user.id,
        },
      });

    logStep("Payment ledger entry created");

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
