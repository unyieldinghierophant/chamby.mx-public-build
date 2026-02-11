

# Fix: Provider Onboarding and Auth Flows

## Current Problems Summary

1. **Three duplicate routes** for provider onboarding:
   - `/auth/provider` -- ProviderOnboardingWizard (signup + onboarding combined)
   - `/provider-portal/onboarding` -- same ProviderOnboardingWizard component
   - `/provider-onboarding` -- old ProviderOnboarding page (completely separate, outdated)

2. **Post-signup redirect loop**: After email verification, AuthCallback redirects to `/provider-portal/onboarding`, which re-checks onboarding status and may loop back or show a spinner indefinitely because `renderAuthStep()` returns a spinner when user exists but the `useEffect` that advances to step 3 has `hasCheckedOnboarding.current` already set to true from a previous run.

3. **"Revisar correo" screen** lacks resend cooldown timer, "Cambiar correo", help microcopy, and clear exit path.

4. **Existing email errors** are not surfaced clearly enough.

5. **ProviderLogin** redirects incomplete providers to `/auth/provider` which shows signup UI instead of continuing onboarding.

## Plan

### Step 1: Consolidate Routes

**Canonical route**: `/auth/provider` (already the main entry point)

Changes in `src/App.tsx`:
- Remove the `/provider-portal/onboarding` route (line 203) -- it's redundant
- Replace the `/provider-onboarding` import with a `Navigate` redirect to `/auth/provider`
- Remove the `ProviderOnboarding` import (line 23)

Changes in `src/constants/routes.ts`:
- Update `PROVIDER_ONBOARDING_WIZARD` to point to `/auth/provider` instead of `/provider-portal/onboarding`
- Keep `PROVIDER_ONBOARDING` pointing to `/provider-onboarding` (used by redirect)

### Step 2: Fix Redirect References

Update files that reference `/provider-onboarding` to use `ROUTES.PROVIDER_AUTH`:
- `src/pages/ProviderVerification.tsx` (line 180)
- `src/pages/provider-portal/ProviderVerification.tsx` (line 149)
- `src/components/VerificationOverlay.tsx` (line 137)

Update `src/pages/ProviderLogin.tsx` (line 134): Change redirect from `/auth/provider` to `ROUTES.PROVIDER_AUTH` (same value, but use the constant).

### Step 3: Fix the Post-Auth Step Advancement Bug

In `src/pages/provider-portal/ProviderOnboardingWizard.tsx`:

The core bug: when a user arrives authenticated (e.g., after email verification redirect), `hasCheckedOnboarding.current` may prevent the `useEffect` from running, leaving the user stuck on step 2's spinner.

Fix:
- Reset `hasCheckedOnboarding.current = false` when the `user` value changes (new user session)
- In the `useEffect`, remove the early return for `hasCheckedOnboarding.current` when `currentStep === 2` (auth step) -- always re-check if we're on the auth step to ensure advancement
- After checking status and determining user needs onboarding, reliably set step to 3

### Step 4: Fix "Onboarding Complete" Re-entry

In `ProviderOnboardingWizard.tsx`, the `useEffect` already redirects to portal if onboarding is complete. This is correct. No change needed here.

Add a guard: if user visits `/auth/provider` while already having a complete profile, redirect immediately (already handled by the existing useEffect).

### Step 5: Improve "Revisar correo" Screen (Email Verification UX)

In `ProviderOnboardingWizard.tsx`, update the `showVerificationPending` overlay (lines 1449-1506):

1. Add a **cooldown timer** (60s) on the "Reenviar correo" button
2. Add **"Cambiar correo"** button that closes the overlay and returns to the signup form
3. Add **microcopy**: "Revisa tu carpeta de spam o promociones" and "Verifica que el email sea correcto"
4. Add a **"Volver"** exit button to return to the auth step
5. Add **help link** text: "Si sigues sin recibir el correo, contacta soporte"

### Step 6: Improve Error Handling for Existing Emails

In `ProviderOnboardingWizard.tsx`, update `handleSignup` (lines 347-363):

- When error contains "already registered" or "already exists", show a clear message with two CTAs:
  - "Iniciar sesion" -- switches to login mode with email pre-filled
  - "Reenviar codigo" -- triggers resend verification

Update the error display to show inline action buttons rather than just a toast.

### Step 7: Fix ProviderLogin Post-Success Routing

In `src/pages/ProviderLogin.tsx`, update `handleSuccessComplete` (line 123-139):
- Use `ROUTES.PROVIDER_AUTH` constant instead of hardcoded `/auth/provider`
- This ensures incomplete providers land on the canonical onboarding wizard

## Files Changed

| File | Change |
|------|--------|
| `src/App.tsx` | Remove duplicate routes, add redirect for `/provider-onboarding` |
| `src/constants/routes.ts` | Update `PROVIDER_ONBOARDING_WIZARD` to `/auth/provider` |
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Fix step advancement bug, improve email verification UX, better error handling |
| `src/pages/ProviderLogin.tsx` | Use route constant for redirect |
| `src/pages/ProviderVerification.tsx` | Update link to use canonical route |
| `src/pages/provider-portal/ProviderVerification.tsx` | Update link to use canonical route |
| `src/components/VerificationOverlay.tsx` | Update link to use canonical route |

## Non-Regression Guarantees

- Provider portal routes (`/provider-portal/*`) are untouched
- ProtectedRoute logic unchanged
- Job notifications, available jobs feed, provider data fields unchanged
- AuthCallback routing logic preserved (it already uses `ROUTES.PROVIDER_ONBOARDING_WIZARD` which will now point to `/auth/provider`)
- Form persistence via localStorage preserved
- Provider role creation logic in `handleFinish` and `AuthCallback` unchanged

