

## Fix: Post-Password-Reset 404 Redirect

### Problem
After successfully resetting the password, `ResetPassword.tsx` navigates to `/user-auth` (line 142), but that route doesn't exist. The correct route is `/auth/user` (defined as `ROUTES.USER_AUTH` in `constants/routes.ts`). Same issue on the error state link (line 169).

### Change
**File: `src/pages/ResetPassword.tsx`**

1. Import `ROUTES` from `@/constants/routes`
2. Line 142: Change `navigate('/user-auth')` to `navigate(ROUTES.USER_LANDING)` — after a successful password reset, take the user to the landing page (they're already authenticated from the recovery flow)
3. Line 169: Change `to="/user-auth"` to `to={ROUTES.LOGIN}` — on error, send them to the login page to request a new reset link

