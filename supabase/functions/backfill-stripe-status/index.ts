import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[BACKFILL-STRIPE-STATUS] ${step}${detailsStr}`);
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

    // Admin-only
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) throw new Error("Authentication failed");

    const { data: isAdmin } = await supabase.rpc("is_admin", { _user_id: userData.user.id });
    if (!isAdmin) throw new Error("Admin access required");

    logStep("Admin verified", { userId: userData.user.id });

    // Find providers needing sync: have stripe_account_id but stale fields
    const { data: providers, error: provErr } = await supabase
      .from("providers")
      .select("id, user_id, stripe_account_id")
      .not("stripe_account_id", "is", null);

    if (provErr) throw new Error(`Failed to fetch providers: ${provErr.message}`);
    if (!providers || providers.length === 0) {
      return new Response(
        JSON.stringify({ synced: 0, errors: 0, message: "No providers with Stripe accounts found" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    logStep("Providers to sync", { count: providers.length });

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    let synced = 0;
    let errors = 0;

    // Process sequentially to respect Stripe rate limits
    for (const provider of providers) {
      try {
        const account = await stripe.accounts.retrieve(provider.stripe_account_id!);

        const chargesEnabled = account.charges_enabled ?? false;
        const payoutsEnabled = account.payouts_enabled ?? false;
        const detailsSubmitted = account.details_submitted ?? false;
        const requirements = account.requirements ?? {};
        const currentlyDue: string[] = requirements.currently_due ?? [];
        const eventuallyDue: string[] = requirements.eventually_due ?? [];
        const disabledReason: string | null = requirements.disabled_reason ?? null;

        let onboardingStatus = "onboarding";
        if (payoutsEnabled && chargesEnabled) {
          onboardingStatus = "enabled";
        }

        await supabase
          .from("providers")
          .update({
            stripe_onboarding_status: onboardingStatus,
            stripe_charges_enabled: chargesEnabled,
            stripe_payouts_enabled: payoutsEnabled,
            stripe_details_submitted: detailsSubmitted,
            stripe_requirements_currently_due: currentlyDue,
            stripe_requirements_eventually_due: eventuallyDue,
            stripe_disabled_reason: disabledReason,
          })
          .eq("id", provider.id);

        // Log success
        await supabase.from("stripe_sync_logs").insert({
          provider_id: provider.user_id,
          stripe_account_id: provider.stripe_account_id!,
          status: "success",
        });

        synced++;
        logStep("Synced provider", { providerId: provider.id, status: onboardingStatus });

        // Small delay between calls (100ms)
        await new Promise((r) => setTimeout(r, 100));
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        errors++;
        logStep("Failed to sync provider", { providerId: provider.id, error: errMsg });

        await supabase.from("stripe_sync_logs").insert({
          provider_id: provider.user_id,
          stripe_account_id: provider.stripe_account_id || "unknown",
          status: "error",
          error: errMsg,
        });
      }
    }

    logStep("Backfill complete", { synced, errors, total: providers.length });

    return new Response(
      JSON.stringify({ synced, errors, total: providers.length }),
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
