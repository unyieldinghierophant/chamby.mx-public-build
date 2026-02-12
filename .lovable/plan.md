

# Fix: Provider Data Not Saving to Supabase Tables

## Root Cause

Two issues prevent data from being stored:

1. **No `providers` row exists**: The `handleFinish` function and `persistStepToDB` both use `.update()` on the `providers` table. If the `handle_new_user` trigger didn't create the row (common with Google OAuth or race conditions), the update silently affects zero rows -- no error is thrown, but nothing is saved.

2. **Data only saved at final step**: Profile data (display name, bio, avatar), skills, and zone are only written to the database when the user clicks "Finish" on the last step. If anything interrupts that final call, all data is lost (only localStorage has it).

## Solution

### 1. Guarantee `providers` row exists before any DB write

Add an `ensureProviderRow` helper that runs an **upsert** (insert-on-conflict-do-nothing) before the first DB write. Call it:
- When the user reaches step 3 (profile) after authentication
- At the start of `handleFinish`

```typescript
const ensureProviderRow = async () => {
  if (!user) return;
  const { error } = await supabase
    .from('providers')
    .upsert(
      { user_id: user.id, display_name: user.user_metadata?.full_name || '' },
      { onConflict: 'user_id' }
    );
  if (error) console.error('[Onboarding] Failed to ensure provider row:', error);
};
```

### 2. Save data incrementally at each step transition

Update `persistStepToDB` to also save the relevant data for the step being completed:

- **After profile step (step 3 to 4)**: Save `display_name`, `avatar_url` to `providers`; save `full_name`, `phone`, `bio` to `users`
- **After skills step (step 4 to 5)**: Save `skills` to `providers`
- **After zone step (step 5 to 6)**: Save `zone_served`, `current_latitude`, `current_longitude` to `providers`

This ensures data survives browser crashes, tab closures, or network hiccups between steps.

### 3. Use upsert in `handleFinish` instead of update

Change the final `.update()` to `.upsert()` with `onConflict: 'user_id'` so the finish step works even if previous saves failed.

### 4. Ensure `provider_details` row is created early

Move the `provider_details` creation from `handleFinish` to `ensureProviderRow`, so it's linked as soon as the provider row exists.

## Files Changed

| File | Change |
|------|--------|
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Add `ensureProviderRow` helper; update `persistStepToDB` to save step data incrementally; change `handleFinish` to use upsert; create `provider_details` early |

## Technical Details

### `persistStepToDB` updated logic

```typescript
const persistStepToDB = useCallback(async (stepNum: number) => {
  if (!user) return;
  const stepName = STEP_NAME_MAP[stepNum] || 'auth';

  // Base update: always persist the step name
  let providerUpdate: Record<string, any> = { onboarding_step: stepName };

  // Attach step-specific data
  if (stepNum === 4) {
    // Leaving profile step
    providerUpdate.display_name = profileData.displayName;
    providerUpdate.avatar_url = profileData.avatarUrl;
  }
  if (stepNum === 5) {
    // Leaving skills step
    providerUpdate.skills = selectedSkills;
  }
  if (stepNum === 6) {
    // Leaving zone step
    providerUpdate.zone_served = workZone || `${workZoneRadius}km radius`;
    providerUpdate.current_latitude = workZoneCoords?.lat || null;
    providerUpdate.current_longitude = workZoneCoords?.lng || null;
  }

  await supabase
    .from('providers')
    .update(providerUpdate)
    .eq('user_id', user.id);

  // Also persist users table data after profile step
  if (stepNum === 4) {
    await supabase
      .from('users')
      .update({ full_name: profileData.displayName, phone: profileData.phone, bio: profileData.bio })
      .eq('id', user.id);
  }
}, [user, profileData, selectedSkills, workZone, workZoneCoords, workZoneRadius]);
```

### `ensureProviderRow` called when user reaches step 3

Inside the `checkOnboardingStatus` effect, after confirming the user is authenticated and moving to step 3, call `ensureProviderRow`. This guarantees the row exists before any `persistStepToDB` call.

### `handleFinish` uses upsert

The final save changes from `.update()` to `.upsert({ ... }, { onConflict: 'user_id' })` as a safety net, ensuring the complete profile is written even if intermediate saves failed.

