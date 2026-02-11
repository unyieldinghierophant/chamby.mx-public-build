

# Fix: Stripe Key Mismatch (Live vs Test Mode)

## Problem Identified

The payment is failing because of a **key mode mismatch**:

- **Backend** (edge function `create-visit-authorization`): Uses `STRIPE_SECRET_KEY` which is a **test** key (`sk_test_...`). The PaymentIntent is created successfully in test mode.
- **Frontend** (`VisitFeePaymentPage.tsx` and `VisitFeeAuthorizationSection.tsx`): Uses a **hardcoded live publishable key** (`pk_live_...`).

When the frontend tries to confirm a test-mode PaymentIntent using a live-mode publishable key, Stripe rejects it because the keys belong to different environments.

## Files to Fix

Three files have hardcoded Stripe publishable keys:

| File | Current Key | Needs Change |
|------|------------|--------------|
| `src/pages/VisitFeePaymentPage.tsx` (line 29) | `pk_live_...` | Yes - change to `pk_test_...` |
| `src/components/payments/VisitFeeAuthorizationSection.tsx` (line 12) | `pk_live_...` | Yes - change to `pk_test_...` |
| `src/utils/confirmVisitAuthorizationPayment.ts` (line 4) | `pk_test_...` | Already correct |

## Plan

### Step 1: Centralize the Stripe publishable key

Create a single shared constant so the key only needs to be updated in one place when switching between test and live modes.

- Create `src/lib/stripe.ts` with:
  - The publishable key constant (set to `pk_test_...` for now)
  - A shared `stripePromise` using `loadStripe`
  - A comment explaining how to switch modes

### Step 2: Update all three files to import from the shared module

- `src/pages/VisitFeePaymentPage.tsx` -- remove local key + `loadStripe`, import from `src/lib/stripe.ts`
- `src/components/payments/VisitFeeAuthorizationSection.tsx` -- same
- `src/utils/confirmVisitAuthorizationPayment.ts` -- same

### Step 3: Deploy and verify

- No edge function changes needed (backend is already correct in test mode)
- Test the payment flow end-to-end

## Technical Details

The centralized module (`src/lib/stripe.ts`) will look like:

```text
// Current mode: TEST
const STRIPE_PUBLISHABLE_KEY = "pk_test_51S97Fm...";
export const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
export { STRIPE_PUBLISHABLE_KEY };
```

This prevents future mode mismatches by having a single source of truth for the Stripe publishable key across the entire frontend.

