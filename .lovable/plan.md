

# Fix: Email Delivery and Provider Onboarding Cleanup

## Problem Analysis

### Why emails aren't arriving

There are two separate issues:

1. **Repeated signup silently skips email**: When a user tries to sign up with an email that already exists but isn't confirmed, Supabase returns success (HTTP 200, no error) but does NOT send a new confirmation email. The wizard shows "Revisa tu correo" but nothing arrives. The auth logs confirm: `user_repeated_signup` for `asaga2003+4@gmail.com`.

2. **Auth Hook may need re-verification**: The `send-confirmation-email` edge function shows zero logs, meaning it's either not being called by Supabase Auth, or Supabase is using its built-in email sender instead. The function was just redeployed and is responding correctly (returns 401 for unsigned requests, as expected). You may need to verify the Auth Hook is enabled in the Supabase Dashboard under Authentication > Hooks > Send Email.

### What's already working

- Routes are consolidated: `/provider/onboarding` is canonical
- `/auth/provider` and `/provider-onboarding` redirect correctly
- The wizard flow (steps 2-8) works when auth succeeds
- Verification code input, resend button, and "Cambiar correo" already exist

## Changes

### 1. Fix repeated signup email delivery (ProviderOnboardingWizard.tsx)

After a successful signup call, automatically trigger a `resend` to ensure the confirmation email is sent even for repeated signups:

```
// In handleSignup, after successful signUp call (line 390):
// Trigger resend to cover repeated signup case
await supabase.auth.resend({
  type: 'signup',
  email: signupData.email,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/callback?login_context=provider`
  }
});
startResendCooldown(); // Start cooldown so user doesn't spam
```

This ensures that even if Supabase silently ignores a repeated signup, the explicit `resend` call will send the email.

### 2. Better detection of "already registered" users (ProviderOnboardingWizard.tsx)

Supabase with `email confirmation` enabled returns a fake success for already-registered-and-confirmed users (returns a user with empty `identities` array). Detect this case:

```
// In handleSignup, check the signUp response data
// If user has empty identities, the email is already confirmed and registered
if (data?.user?.identities?.length === 0) {
  // Email already confirmed - user should login instead
  toast.error('Este correo ya tiene cuenta verificada', {
    description: 'Inicia sesion con tu contrasena.',
    action: { label: 'Iniciar sesion', onClick: () => switchToLogin() }
  });
  return;
}
```

This requires modifying `AuthContext.signUp` to return `data` along with `error`.

### 3. Update AuthContext.signUp to return data (AuthContext.tsx)

Change the return type to include the signup response data so the wizard can inspect `user.identities`:

```
// Before: return { error };
// After: return { error, data };
```

### 4. Delete dead ProviderOnboarding.tsx

Remove `src/pages/ProviderOnboarding.tsx` -- it's 350 lines of dead code no longer imported anywhere. It was the old standalone onboarding page that has been replaced by `ProviderOnboardingWizard.tsx`.

### 5. Verify Auth Hook configuration (Manual step -- user action needed)

The `send-confirmation-email` edge function has been redeployed. You need to verify it's enabled in the Supabase Dashboard:

1. Go to Supabase Dashboard > Authentication > Hooks
2. Verify "Send Email" hook is enabled and pointing to the `send-confirmation-email` function
3. Verify the `SEND_EMAIL_HOOK_SECRET` matches what's configured in the hook

If the hook is not configured, Supabase uses its built-in email templates instead. The built-in emails will still work for sending confirmation, just without the custom Chamby branding via Postmark.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Auto-resend after signup, detect already-confirmed emails |
| `src/contexts/AuthContext.tsx` | Return signup data from signUp function |
| `src/pages/ProviderOnboarding.tsx` | Delete (dead code) |

## What This Does NOT Change

- Provider portal routes, job feed, notifications -- untouched
- Route consolidation -- already correct
- Verification UI (code input, resend, change email) -- already implemented
- AuthCallback logic -- already correct
- Database writes (providers, provider_details) -- already correct
