import { loadStripe } from "@stripe/stripe-js";

/**
 * Centralized Stripe publishable key configuration.
 * 
 * To switch between TEST and LIVE mode:
 * - TEST: use pk_test_... key
 * - LIVE: use pk_live_... key
 * 
 * IMPORTANT: The backend (edge functions) must use the matching secret key mode.
 * Mismatched keys (e.g., test publishable + live secret) will cause payment failures.
 */

// Current mode: TEST
export const STRIPE_PUBLISHABLE_KEY = "pk_test_51S97FmEZPwoUz41xz8Cg1rUooVh7FS9TvfeXUfvFgPjhAE2gklqVF0kdpZdvByo3XVf76aTfcmHkH39fOQX9yVnQ00801XKEJu";

export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
