

# Fix: Email Confirmation Delivery

## Root Cause

The `send-confirmation-email` edge function has **zero logs ever**. This confirms the Supabase Auth Hook ("Send Email") is not configured in the Dashboard, so neither Supabase's built-in email nor the custom Postmark template is being sent. The signup and resend API calls return 200, but no email is actually delivered.

## Solution

Create a new edge function (`send-signup-confirmation`) that the wizard calls **directly** after a successful signup, bypassing the Auth Hook mechanism entirely. This function will:

1. Use `supabase.auth.admin.generateLink()` (with the service role key) to generate a valid confirmation URL and OTP token
2. Render the existing Chamby-branded email template
3. Send it via Postmark

This approach is reliable because it doesn't depend on the Auth Hook being enabled in the Dashboard.

## Changes

### 1. New Edge Function: `supabase/functions/send-signup-confirmation/index.ts`

- Accepts `{ email, redirectTo }` in the POST body
- Uses `SUPABASE_SERVICE_ROLE_KEY` to call `auth.admin.generateLink({ type: 'signup', email, options: { redirectTo } })`
- Extracts the `token_hash`, `token` (OTP), and builds the confirmation URL
- Renders the existing `ConfirmationEmail` React template
- Sends via Postmark using the existing `POSTMARK_API_KEY`
- Returns success/failure
- Protected by checking the request has a valid `apikey` header (anon key) -- no JWT required since the user just signed up and isn't authenticated yet

### 2. Copy email templates to new function

Copy `_templates/confirmation.tsx` into `supabase/functions/send-signup-confirmation/_templates/` so the new function can render it.

### 3. Update `ProviderOnboardingWizard.tsx`

Replace the `supabase.auth.resend()` call (lines 460-470) with a direct invocation of the new edge function:

```typescript
await supabase.functions.invoke('send-signup-confirmation', {
  body: {
    email: signupData.email,
    redirectTo: `${window.location.origin}/auth/callback?login_context=provider`
  }
});
```

### 4. Update `supabase/config.toml`

Add the new function with `verify_jwt = false` (user isn't authenticated at signup time).

### 5. Resend button

Update the resend handler in the verification screen to also call this new edge function instead of `supabase.auth.resend()`.

## Files Changed

| File | Change |
|------|--------|
| `supabase/functions/send-signup-confirmation/index.ts` | New -- direct email sender |
| `supabase/functions/send-signup-confirmation/_templates/confirmation.tsx` | Copy of existing template |
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Call new function after signup and on resend |
| `supabase/config.toml` | Add new function config |

## What This Does NOT Change

- Auth Hook (`send-confirmation-email`) remains for future Dashboard configuration
- Login, password reset, payment flows -- untouched
- Onboarding persistence and step resumption -- untouched
- Database schema -- no changes

