
## Fix: React Error #310 in Provider Portal Job Navigation

### Root Cause

**`useJobRating` hook is called AFTER early returns in `JobTimelinePage.tsx` (line 418), violating React's Rules of Hooks.**

React requires all hooks to be called unconditionally, in the same order, on every render. Currently:

1. First render: `loading = true` -> component returns early at line 390 -> `useJobRating` is **never called**
2. Second render: `loading = false`, `job` exists -> component reaches line 418 -> `useJobRating` **IS called**

This causes React's internal hook state to become corrupted, producing the "Objects are not valid as a React child" (error #310) crash caught by the `ProviderErrorBoundary`.

### Fix

Move `useJobRating` to the top of the component alongside all other hooks, BEFORE any early returns. Pass `job?.status` instead of `job.status` since `job` may be null at that point. The hook already handles undefined inputs gracefully (`if (!jobId || !user)` guard inside).

### Changes

**File: `src/pages/provider-portal/JobTimelinePage.tsx`**

1. Move line 418 (`const { canRate, hasRated, myReview, refetch: refetchRating } = useJobRating(...)`) to right after line 117 (after the last `useState` call), changing `job.status` to `job?.status`.

2. Remove the comment "Rating hook - only active for completed jobs" from line 417 and the hook call from line 418.

That is the only change needed. The hook already short-circuits when `jobId` is undefined or the user isn't loaded, so it's safe to call unconditionally.

### Technical Details

- The `useJobRating` hook (in `src/hooks/useJobRating.ts`) accepts `jobId: string | undefined` and `jobStatus: string | undefined`. When either is missing, it sets `loading: false` and returns defaults (`canRate: false, hasRated: false, myReview: null`). So calling it before the job loads is safe and has no side effects.
- No other hooks in `JobTimelinePage` violate the rules -- all `useState`, `useEffect`, `useRef`, and `useJobStatusTransition` calls are before the early returns.
- No other files need changes for this fix.

### Verification

After the fix, clicking on an active job from either the dashboard ("trabajo activo" card) or the jobs list ("Ver seguimiento" button) will load the `JobTimelinePage` without crashing. The error boundary ("Algo salio mal") will no longer appear.
