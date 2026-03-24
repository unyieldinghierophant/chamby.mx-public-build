

## Add OTP Code Input Flow for Password Reset

### Problem
The password reset email includes both a clickable link and a 6-digit OTP code. The link works (redirects to `/reset-password`), but there's no way to input the OTP code in the UI. Users who copy the code have nowhere to enter it.

### Solution
After the user submits their email in the "Recuperar Contraseña" form and the email is sent, show a two-step inline flow:

1. **Step 1 — OTP Input**: Show a 6-digit code input field where the user enters the code from the email
2. **Step 2 — New Password**: After successful OTP verification, show the new password form (password + confirm + strength bar)

All within the existing `UserAuth.tsx` page — no new pages or routes needed.

### Changes

**Single file: `src/pages/UserAuth.tsx`**

1. Add new state variables:
   - `resetStep`: `'email' | 'otp' | 'newPassword'` (tracks which step is showing)
   - `otpCode`: string for the 6-digit input
   - `newPassword` / `confirmPassword`: for the password form
   
2. After successful `resetPassword()` call, instead of closing the form, transition to `resetStep = 'otp'`

3. **OTP step UI**: 6 individual digit inputs (using the existing `InputOTP` component), a "Verificar código" button that calls:
   ```typescript
   supabase.auth.verifyOtp({ email: resetEmail, token: otpCode, type: 'recovery' })
   ```

4. **New password step UI**: Two password fields + `PasswordStrengthBar` (already exists in project), a "Actualizar contraseña" button that calls:
   ```typescript
   supabase.auth.updateUser({ password: newPassword })
   ```

5. On success, show toast, sign out the recovery session, and return to login view.

### What Won't Change
- The `/reset-password` page continues to work for users who click the email link
- The email template stays the same
- No database or edge function changes

