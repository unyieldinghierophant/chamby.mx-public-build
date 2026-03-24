

## Fix: Admin Provider Approval Error Handling

### Problem

Two issues are causing the generic "Edge Function returned a non-2xx status code" error:

1. **Lost error details**: When `supabase.functions.invoke` receives a non-2xx response, it sets `error` with a generic message. The actual response body (e.g., "Faltan documentos: Selfie") is buried in `error.context` and never extracted. Both `AdminProvidersPage.tsx` and `AdminDashboard.tsx` just use `error.message`, losing the useful detail.

2. **Missing document**: The provider in the screenshot has 4 documents but is missing the standalone "Selfie" (separate from "Selfie con INE"). The edge function correctly requires all 5 canonical documents before approving. This is working as designed, but the admin sees a useless error instead of "Faltan documentos: Selfie".

### Fix

**Files to change**: `src/pages/admin/AdminProvidersPage.tsx` and `src/pages/AdminDashboard.tsx`

In both approve/reject handlers, replace the generic error extraction with context-aware parsing:

```typescript
// Before:
if (error) throw new Error(error.message);

// After:
if (error) {
  let msg = error.message;
  try {
    const body = await error.context?.json();
    if (body?.error) msg = body.error;
  } catch {}
  throw new Error(msg);
}
```

This surfaces the actual Spanish error message from the edge function (e.g., "No se puede aprobar. Faltan documentos: Selfie") instead of the generic "non-2xx status code" message.

### What Won't Change
- Edge function logic stays the same (document requirements are correct)
- No database or migration changes
- The 5-document requirement is valid and enforced by both the edge function and the `enforce_verified_has_docs` DB trigger

