import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-STRIPE-STATUS] ${step}${detailsStr}`);
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

    // Authenticate caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const userId = userData.user.id;

    const body = await req.json().catch(() => ({}));
    const { provider_id, stripe_account_id } = body;

    // Determine the target provider
    let targetProvider: any = null;

    if (provider_id || stripe_account_id) {
      // Admin or self-sync with explicit target
      const query = supabase
        .from("providers")
        .select("id, user_id, stripe_account_id")
        .limit(1)
        .single();

      if (provider_id) {
        query.eq("id", provider_id);
      } else {
        query.eq("stripe_account_id", stripe_account_id);
      }

      // For non-admin, ensure they can only sync their own
      const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userId });

      const { data, error } = await query;
      if (error || !data) throw new Error("Provider not found");

      if (!isAdmin && data.user_id !== userId) {
        throw new Error("Not authorized to sync this provider");
      }
      targetProvider = data;
    } else {
      // Self-sync: find provider for current user
      const { data, error } = await supabase
        .from("providers")
        .select("id, user_id, stripe_account_id")
        .eq("user_id", userId)
        .single();

      if (error || !data) throw new Error("Provider not found for current user");
      targetProvider = data;
    }

    if (!targetProvider.stripe_account_id) {
      return new Response(
        JSON.stringify({ synced: false, reason: "no_stripe_account" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Syncing provider", {
      providerId: targetProvider.id,
      stripeAccountId: targetProvider.stripe_account_id,
    });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const account = await stripe.accounts.retrieve(targetProvider.stripe_account_id);

    const chargesEnabled = account.charges_enabled ?? false;
    const payoutsEnabled = account.payouts_enabled ?? false;
    const detailsSubmitted = account.details_submitted ?? false;
    const requirements = account.requirements ?? {};
    const currentlyDue: string[] = requirements.currently_due ?? [];
    const eventuallyDue: string[] = requirements.eventually_due ?? [];
    const disabledReason: string | null = requirements.disabled_reason ?? null;

    let onboardingStatus = "not_started";
    if (payoutsEnabled && chargesEnabled) {
      onboardingStatus = "enabled";
    } else if (targetProvider.stripe_account_id) {
      onboardingStatus = "onboarding";
    }

    const updatePayload = {
      stripe_onboarding_status: onboardingStatus,
      stripe_charges_enabled: chargesEnabled,
      stripe_payouts_enabled: payoutsEnabled,
      stripe_details_submitted: detailsSubmitted,
      stripe_requirements_currently_due: currentlyDue,
      stripe_requirements_eventually_due: eventuallyDue,
      stripe_disabled_reason: disabledReason,
    };

    const { error: updateErr } = await supabase
      .from("providers")
      .update(updatePayload)
      .eq("id", targetProvider.id);

    if (updateErr) throw new Error(`DB update failed: ${updateErr.message}`);

    logStep("Sync complete", {
      providerId: targetProvider.id,
      status: onboardingStatus,
      currentlyDue,
    });

    return new Response(
      JSON.stringify({
        synced: true,
        status: onboardingStatus,
        charges_enabled: chargesEnabled,
        payouts_enabled: payoutsEnabled,
        currently_due: currentlyDue,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: msg });
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
