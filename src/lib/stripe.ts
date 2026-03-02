import { loadStripe } from "@stripe/stripe-js";

/**
 * Centralized Stripe publishable key configuration.
 * 
 * Set VITE_STRIPE_PUBLISHABLE_KEY in .env to match the backend mode:
 * - TEST: pk_test_* + sk_test_* (Supabase secret)
 * - LIVE: pk_live_* + sk_live_* (Supabase secret)
 * 
 * IMPORTANT: Frontend and backend keys MUST be in the same mode.
 */

export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string;

if (!STRIPE_PUBLISHABLE_KEY) {
  console.error("⚠️ VITE_STRIPE_PUBLISHABLE_KEY is not set. Stripe will not work.");
}

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY || "");
