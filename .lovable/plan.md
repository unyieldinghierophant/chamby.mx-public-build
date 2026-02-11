
# Fix: Provider Signup "Sent Back to Beginning"

## Root Cause

In `ProviderOnboardingWizard.tsx`, the `renderAuthStep()` function (line 839) calls `goToNext()` during render when a user is already logged in. This triggers a `setState` during render -- a React anti-pattern that causes unpredictable behavior: the state update can be discarded or trigger re-render loops, effectively resetting the wizard to the beginning.

Additionally, the onboarding-check `useEffect` (line 306) includes `currentStep` in its dependency array, which means any step change re-triggers the async check, potentially causing race conditions with the render-time `goToNext()`.

## Fix (2 changes in 1 file)

### Change 1: Fix `renderAuthStep()` (line 838-842)

Instead of calling `goToNext()` during render, return a loading indicator and let the existing `useEffect` handle the step transition (it already advances past step 2 when `user` exists).

**Before:**
```
function renderAuthStep() {
    if (user) {
      goToNext();
      return null;
    }
```

**After:**
```
function renderAuthStep() {
    if (user) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }
```

### Change 2: Remove `currentStep` from useEffect dependency (line 306)

Remove `currentStep` from the dependency array of the onboarding-check effect to prevent it from re-triggering every time the step changes. The effect only needs to run when `user` or `authMode` changes.

**Before:**
```
}, [user, authMode, navigate, currentStep]);
```

**After:**
```
}, [user, authMode, navigate]);
```

### File Changed

| File | Change |
|------|--------|
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Fix setState-during-render bug, remove `currentStep` from effect deps |
