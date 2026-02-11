

# Fix: Email Verification Code and Remove Button

## Root Cause

Two problems:

1. **OTP code doesn't work**: The edge function generates the link/OTP using `type: "magiclink"`, but the client-side verification calls `supabase.auth.verifyOtp()` with `type: "signup"`. These types must match for Supabase to accept the code.

2. **Button redirects wrong**: The "Confirmar mi correo" button in the email template uses `type=signup` in the URL (mismatched again), and the redirect URL points to `/auth/callback` which routes to the provider login instead of resuming onboarding. Per your request, we'll remove this button entirely.

## Changes

### 1. Fix OTP verification type (`ProviderOnboardingWizard.tsx`)

Change the `verifyOtp` call from `type: 'signup'` to `type: 'magiclink'` so it matches what `generateLink` produced.

### 2. Remove button from email template (`send-signup-confirmation/_templates/confirmation.tsx`)

Remove the "Confirmar mi correo electrónico" button and the "Para activar tu cuenta, haz clic en el siguiente botón:" text. Keep only the verification code section.

### 3. Clean up edge function text fallback (`send-signup-confirmation/index.ts`)

Remove the confirmation URL from the plain-text email body since we're removing the button. Keep only the OTP code.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Change `verifyOtp` type from `'signup'` to `'magiclink'` |
| `supabase/functions/send-signup-confirmation/_templates/confirmation.tsx` | Remove button + related text, keep code only |
| `supabase/functions/send-signup-confirmation/index.ts` | Remove confirmation URL from plain-text body |

