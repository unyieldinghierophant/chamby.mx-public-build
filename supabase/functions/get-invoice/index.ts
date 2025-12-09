import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[GET-INVOICE] ${step}${detailsStr}`);
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
    const { invoiceId } = await req.json();
    if (!invoiceId) {
      throw new Error("invoiceId is required");
    }
    logStep("Request parsed", { invoiceId });

    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabaseClient
      .from("invoices")
      .select("*")
      .eq("id", invoiceId)
      .maybeSingle();

    if (invoiceError) {
      throw new Error(`Error fetching invoice: ${invoiceError.message}`);
    }

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Check if user is the client OR an admin
    const isClient = invoice.user_id === user.id;
    
    // Check if user is admin
    const { data: adminRole } = await supabaseClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    const isAdmin = !!adminRole;

    if (!isClient && !isAdmin) {
      throw new Error("You do not have permission to view this invoice");
    }
    logStep("Permission validated", { isClient, isAdmin });

    // Fetch invoice items
    const { data: invoiceItems, error: itemsError } = await supabaseClient
      .from("invoice_items")
      .select("*")
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: true });

    if (itemsError) {
      logStep("Error fetching invoice items", { error: itemsError.message });
    }

    // Fetch provider info
    const { data: providerUser } = await supabaseClient
      .from("users")
      .select("full_name, email, phone")
      .eq("id", invoice.provider_id)
      .maybeSingle();

    // Get job info
    const { data: job } = await supabaseClient
      .from("jobs")
      .select("title, category, location")
      .eq("id", invoice.job_id)
      .maybeSingle();

    // Retrieve PaymentIntent client_secret if exists
    let clientSecret = null;
    let paymentIntentStatus = null;
    
    if (invoice.stripe_payment_intent_id) {
      try {
        const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
        const paymentIntent = await stripe.paymentIntents.retrieve(invoice.stripe_payment_intent_id);
        clientSecret = paymentIntent.client_secret;
        paymentIntentStatus = paymentIntent.status;
        logStep("PaymentIntent retrieved", { 
          id: paymentIntent.id, 
          status: paymentIntent.status 
        });
      } catch (piError) {
        logStep("Error retrieving PaymentIntent", { error: String(piError) });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice: {
          id: invoice.id,
          job_id: invoice.job_id,
          provider_id: invoice.provider_id,
          user_id: invoice.user_id,
          subtotal_provider: invoice.subtotal_provider,
          chamby_commission_amount: invoice.chamby_commission_amount,
          total_customer_amount: invoice.total_customer_amount,
          status: invoice.status,
          provider_notes: invoice.provider_notes,
          stripe_payment_intent_id: invoice.stripe_payment_intent_id,
          created_at: invoice.created_at,
          updated_at: invoice.updated_at,
        },
        invoice_items: invoiceItems || [],
        provider: providerUser || null,
        job: job || null,
        payment_intent_id: invoice.stripe_payment_intent_id,
        payment_intent_client_secret: clientSecret,
        payment_intent_status: paymentIntentStatus,
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
