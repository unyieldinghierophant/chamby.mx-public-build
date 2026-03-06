

## Problem

Two issues:

1. **"Comenzar Ahora" skips Step 1**: When a logged-in non-provider clicks the CTA, they go to `/provider/onboarding`. The `checkOnboardingStatus` effect (line 263-268) resumes from the DB step. If the provider row already exists with `onboarding_step = 'profile'`, it jumps to step 2. Even for new users, the form persistence (line 149) restores `currentStep > 1` from localStorage.

2. **X button goes to `/` instead of `/provider-landing`**: The close buttons (lines 959, 997, 1064) navigate to `ROUTES.HOME` (`/`) when `hasProviderRole` is false, instead of `ROUTES.PROVIDER_LANDING`.

## Plan

### Fix 1: Close button → Provider Landing
In `ProviderOnboardingWizard.tsx`, change all three close button navigations from:
```
navigate(hasProviderRole ? ROUTES.PROVIDER_PORTAL : ROUTES.HOME)
```
to:
```
navigate(hasProviderRole ? ROUTES.PROVIDER_PORTAL : ROUTES.PROVIDER_LANDING)
```
(Lines ~959, ~997, ~1064)

### Fix 2: Always start at Step 1
- **Line 149**: Remove the localStorage restoration of `currentStep` — the wizard should always open at step 1 and let the DB check handle resumption only for authenticated users mid-onboarding.
- **Line 186-188**: Remove `setCurrentStep(2)` when `tab=login` — just set `authMode` to login, the auth step (step 1) handles both signup and login modes.
- **Line 264-268**: Change the resume logic so it only auto-advances past step 1 if the user has already completed step 1 (i.e., `resumeStep >= 2` AND user is authenticated). For fresh arrivals, always show step 1 first. Specifically, only resume if `resumeStep > 1`:
  ```
  if (currentStep <= 1 && resumeStep > 1) {
    setCurrentStep(resumeStep);
  }
  ```
  This still shows step 1 (welcome) before advancing, since the welcome screen has a "Siguiente" button.

Actually, looking more carefully: the welcome step IS step 1 and the user needs to click "Siguiente" to proceed. The issue is the resume logic jumps past it. The fix is to NOT auto-advance from step 1 — let the user click through. We should only auto-resume to a step > 1 if the user explicitly navigated away and came back mid-session.

Simplest fix: remove the auto-advance from the `checkOnboardingStatus` effect entirely (lines 264-268). The user will always see step 1 (welcome), click "Siguiente", and proceed. The localStorage persistence already handles restoring form data without jumping steps.

Wait — that would break returning users who were on step 4. Better approach: only auto-resume if `resumeStep > 2` (past the welcome+auth step). Actually the cleanest: add a query param `?force_step=1` or simply always start at 1 and let the welcome screen be quick to pass.

**Final approach**: Keep resume logic but gate it — only resume if the user has been on the page for the current session already (use a ref). On first mount, always show step 1. The localStorage `currentStep` restoration at line 149 is the main culprit for skipping.

Simplest correct fix:
- Remove `currentStep` restoration from localStorage (line 149)
- Remove `setCurrentStep(2)` on `tab=login` (line 187)  
- Keep the DB resume logic but it already does `Math.max(1, resumeStep)` which is fine — the issue is the localStorage overriding it before the DB check runs.

