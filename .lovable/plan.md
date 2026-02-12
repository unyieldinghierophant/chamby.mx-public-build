

# Fix: Provider Onboarding Data Not Persisting to Supabase

## Root Cause

After thorough investigation, the DB shows partial data saved (skills, zone_served, avatar_url) but `onboarding_complete` remains `false` and `onboarding_step` remains `auth`. This means:

1. **`persistStepToDB` partially works** -- it saves step-specific data (skills, zone) but the `onboarding_step` field is not being reliably updated alongside it, OR a subsequent operation resets it.
2. **`handleFinish` silently fails** -- the upsert that sets `onboarding_complete: true` either errors out or never executes. The error toast is easy to miss, so the user sees the completion screen (step 8) but the DB was never updated.
3. **Redirect loop** -- When the user next visits, `ProviderPortal` or the wizard checks DB, finds `onboarding_complete: false`, and sends them back to step 3.

The core problem is that there is **no verification that writes actually succeeded** and **no unmissable error feedback**.

## Solution (3 changes, 1 file)

All changes are in `src/pages/provider-portal/ProviderOnboardingWizard.tsx`.

### 1. Bulletproof `handleFinish` with write verification

- After the upsert, **SELECT the row back** to confirm `onboarding_complete = true` is actually in the DB.
- If the read-back shows the flag is still `false`, fall back to a direct `.update()` call as a retry.
- If that also fails, show a **full-screen error overlay** (not just a toast) so the user cannot miss it.
- Only navigate to the portal after verified success.

### 2. Make `persistStepToDB` more robust

- Wrap in try/catch with error logging.
- After the `.update()`, check the response for errors and show a warning toast if the step save fails (non-blocking, but visible).
- Log the exact payload being sent for debugging.

### 3. Fix `ProviderPortal` redirect as a safety net

In `src/pages/ProviderPortal.tsx`:
- Also accept `skills.length > 0` as sufficient to consider onboarding complete (current behavior), BUT also set `onboarding_complete = true` in the DB when this condition is met. This self-heals the inconsistency.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Add write verification in `handleFinish`; add error handling in `persistStepToDB`; show unmissable errors |
| `src/pages/ProviderPortal.tsx` | Self-heal: if skills exist but `onboarding_complete` is false, update it to true |

## Technical Details

### `handleFinish` -- verified write pattern

```typescript
// After upsert
const { data: verification } = await supabase
  .from('providers')
  .select('onboarding_complete')
  .eq('user_id', user.id)
  .single();

if (!verification?.onboarding_complete) {
  // Upsert didn't stick -- retry with direct update
  console.error('[handleFinish] Upsert did not persist, retrying with update...');
  const { error: retryError } = await supabase
    .from('providers')
    .update({ onboarding_complete: true, onboarding_step: 'completed', skills: selectedSkills, ... })
    .eq('user_id', user.id);
  if (retryError) throw retryError;

  // Verify again
  const { data: secondCheck } = await supabase
    .from('providers')
    .select('onboarding_complete')
    .eq('user_id', user.id)
    .single();
  if (!secondCheck?.onboarding_complete) {
    throw new Error('Data verification failed after retry');
  }
}
```

### `ProviderPortal` self-healing

```typescript
if (providerData?.skills?.length > 0 && !providerData.onboarding_complete) {
  // Self-heal: mark onboarding as complete since data exists
  await supabase
    .from('providers')
    .update({ onboarding_complete: true, onboarding_step: 'completed' })
    .eq('user_id', user.id);
}
```

### Error display upgrade

Replace the toast-only error with a persistent error state that renders a retry UI on the completion step, making it impossible for the user to miss a save failure.

