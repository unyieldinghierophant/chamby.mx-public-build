import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CONNECT-ACCOUNT] ${step}${detailsStr}`);
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

    // Check if user is a provider
    const { data: provider, error: providerError } = await supabaseClient
      .from("providers")
      .select("id, stripe_account_id, display_name, business_email")
      .eq("user_id", user.id)
      .single();

    if (providerError || !provider) {
      throw new Error("User is not a registered provider");
    }
    logStep("Provider found", { providerId: provider.id });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Check if provider already has a Stripe account
    if (provider.stripe_account_id) {
      // Create new account link for existing account
      const accountLink = await stripe.accountLinks.create({
        account: provider.stripe_account_id,
        refresh_url: `${req.headers.get("origin")}/provider-portal/profile`,
        return_url: `${req.headers.get("origin")}/provider-portal/profile?stripe_connected=true`,
        type: "account_onboarding",
      });

      logStep("Account link created for existing account", { 
        accountId: provider.stripe_account_id,
        url: accountLink.url 
      });

      return new Response(
        JSON.stringify({ 
          url: accountLink.url,
          accountId: provider.stripe_account_id,
          isExisting: true 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    // Create new Express account
    const account = await stripe.accounts.create({
      type: "express",
      country: "MX",
      email: provider.business_email || user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: "individual",
      metadata: {
        providerId: provider.id,
        userId: user.id,
      },
    });

    logStep("Stripe Connect account created", { accountId: account.id });

    // Save account ID and set onboarding status
    const { error: updateError } = await supabaseClient
      .from("providers")
      .update({ 
        stripe_account_id: account.id,
        stripe_onboarding_status: "onboarding",
      })
      .eq("id", provider.id);

    if (updateError) {
      logStep("Failed to save Stripe account ID", { error: updateError.message });
    }

    // Create account onboarding link
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${req.headers.get("origin")}/provider-portal/profile`,
      return_url: `${req.headers.get("origin")}/provider-portal/profile?stripe_connected=true`,
      type: "account_onboarding",
    });

    logStep("Account onboarding link created", { url: accountLink.url });

    return new Response(
      JSON.stringify({ 
        url: accountLink.url,
        accountId: account.id,
        isExisting: false 
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
