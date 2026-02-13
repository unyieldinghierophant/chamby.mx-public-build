

# Fix: Provider Onboarding FK Violation on `providers_user_id_fkey`

## Root Cause (Confirmed via DB Investigation)

The FK constraint on `providers.user_id` references **`public.users(id)`**, not `auth.users(id)`. The `handle_new_user` database trigger is supposed to create a `public.users` row whenever a new auth user signs up, but it is **silently failing for most users**.

**Evidence from the database:**
- 10 auth users exist, but only **1** has a matching `public.users` row
- 9 out of 10 users have `is_provider: true` in metadata but NO provider record
- The trigger function `handle_new_user` exists and is attached, but its INSERT into `public.users` is failing without surfacing errors

When the onboarding wizard calls `ensureProviderRow()` or `handleFinish()`, the upsert to `providers` fails because `user_id` references a non-existent `public.users` row.

## Solution (2 changes)

### 1. Add `ensurePublicUserRow()` helper in the onboarding wizard

Before any write to `providers`, the wizard must guarantee a `public.users` row exists. This acts as a safety net for the broken trigger:

```typescript
const ensurePublicUserRow = async () => {
  if (!user) return;
  const { error } = await supabase
    .from('users')
    .upsert({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || '',
      phone: user.user_metadata?.phone || null,
    }, { onConflict: 'id' });
  if (error) {
    console.error('[Onboarding] Failed to ensure public.users row:', error);
    throw new Error('No se pudo preparar tu cuenta. Por favor intenta de nuevo.');
  }
};
```

Call this **before** `ensureProviderRow()` in:
- The `checkOnboardingStatus` effect (when user reaches step 3)
- The `handleFinish` function (before the final upsert)

### 2. Add the same safety net in AuthCallback

The `AuthCallback` page also writes to `providers` (line 98-107). Add the same `public.users` ensure logic there before the provider insert.

### 3. Fix existing orphaned auth users (one-time data repair)

Run a one-time SQL to backfill `public.users` rows for all auth users missing them. This fixes the 9 broken accounts.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Add `ensurePublicUserRow()` helper; call it before `ensureProviderRow()` in both `checkOnboardingStatus` and `handleFinish` |
| `src/pages/AuthCallback.tsx` | Add `public.users` upsert before provider record creation (line ~97) |

## Database Migration

Backfill missing `public.users` rows for existing auth users:

```sql
INSERT INTO public.users (id, full_name, phone, email)
SELECT 
  au.id,
  au.raw_user_meta_data->>'full_name',
  au.raw_user_meta_data->>'phone',
  au.email
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.id
WHERE u.id IS NULL
ON CONFLICT (id) DO NOTHING;
```

## Technical Flow After Fix

```text
User signs up (auth.users created)
         |
    handle_new_user trigger fires
         |
    [may silently fail]
         |
    User reaches onboarding step 3
         |
    ensurePublicUserRow() -- guarantees public.users row
         |
    ensureProviderRow() -- now FK is satisfied, providers upsert works
         |
    persistStepToDB() -- incremental saves work
         |
    handleFinish() -- final upsert with verification succeeds
         |
    Navigate to Provider Portal (no redirect loop)
```

## Error Handling

- If `ensurePublicUserRow()` fails: show a persistent error with "Reintentar" button and "Iniciar sesion de nuevo" link
- If the user's auth session is invalid (no `user.id`): redirect to `/provider/login` with a message
- All errors are logged with `[Onboarding]` prefix for diagnostics

