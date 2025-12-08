import Stripe from "https://esm.sh/stripe@18.5.0";

export function createStripeClient(): Stripe {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  
  if (!stripeKey) {
    throw new Error("STRIPE_SECRET_KEY not configured");
  }

  console.log("🔴 Using Stripe LIVE mode (production)");
  
  return new Stripe(stripeKey, {
    apiVersion: "2025-08-27.basil",
  });
}

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
