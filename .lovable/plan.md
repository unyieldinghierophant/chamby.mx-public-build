
# Plan: Fix Document Upload Error in Provider Onboarding

## Problem Analysis

After investigating the codebase and database configuration, I found that:

1. **The storage bucket `user-documents` exists** - It was created as a private bucket (correct for sensitive documents like IDs)
2. **RLS policies exist** for upload, view, update, and delete operations
3. **The upload code looks correct** - Uses proper file path structure `${user.id}/verification/${docType}_${Date.now()}.jpg`

The error "Error al subir documento" is a generic catch-all message that doesn't show the specific error. The most likely causes are:

### Root Causes (in order of likelihood)
1. **Authentication context issue** - The user may not be properly authenticated when trying to upload
2. **RLS policy mismatch** - The storage policy might not be matching correctly
3. **Bucket access issue** - There could be an issue with how the bucket is configured

---

## Solution

### Step 1: Improve Error Logging and Messaging
Show the actual error message from Supabase so we can diagnose issues better:

**File: `src/components/provider-portal/DocumentCaptureDialog.tsx`**
- Update the catch block to display the actual error message from Supabase
- Add specific handling for common storage errors (auth, policy, size limits)

### Step 2: Add Authentication Check
Before attempting upload, verify the user is authenticated:
- Add a check for `user?.id` before uploading
- Show clear message if user session has expired

### Step 3: Add Retry Logic with Better UX
- If the upload fails due to auth issues, suggest re-authenticating
- Add a loading state indicator during upload

### Step 4: Fix DocumentUploadDialog (secondary component)
The `DocumentUploadDialog.tsx` component also needs the same improvements for consistency.

---

## Technical Details

### Changes to `DocumentCaptureDialog.tsx` (lines 279-284)

```typescript
} catch (error: any) {
  console.error("Error uploading document:", error);
  
  // Provide specific error messages based on error type
  let errorMessage = "Error al subir documento";
  
  if (error?.message?.includes('Unauthorized') || error?.message?.includes('JWT')) {
    errorMessage = "Tu sesión ha expirado. Por favor recarga la página e inicia sesión nuevamente.";
  } else if (error?.message?.includes('exceeded') || error?.message?.includes('size')) {
    errorMessage = "El archivo es demasiado grande. Máximo 5MB permitido.";
  } else if (error?.message?.includes('policy') || error?.statusCode === '403') {
    errorMessage = "No tienes permiso para subir este archivo. Intenta cerrar sesión y volver a iniciar.";
  } else if (error?.message) {
    errorMessage = error.message;
  }
  
  toast.error("Error al subir documento", {
    description: errorMessage
  });
}
```

### Changes to `DocumentUploadDialog.tsx` (lines 89-92)

Apply the same error handling pattern for consistency.

### Add User Verification Before Upload

In both components, add at the start of `handleUpload`:

```typescript
const handleUpload = async () => {
  if (!capturedImage || !user) {
    toast.error("Error de sesión", {
      description: "Por favor inicia sesión nuevamente"
    });
    return;
  }
  
  // Verify we have a valid session
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    toast.error("Sesión expirada", {
      description: "Por favor recarga la página e inicia sesión nuevamente"
    });
    return;
  }
  // ... rest of upload logic
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/provider-portal/DocumentCaptureDialog.tsx` | Better error messages, session verification |
| `src/components/provider-portal/DocumentUploadDialog.tsx` | Same improvements for consistency |

---

## Expected Outcome

After these changes:
1. Users will see clear, actionable error messages explaining what went wrong
2. If there's a session issue, users will know to re-authenticate
3. The actual Supabase error will be logged for debugging
4. Both upload components will have consistent error handling

---

## Testing Recommendation

After implementation:
1. Go to the provider onboarding wizard step for documents
2. Try uploading a document using "Tomar Foto" or "Subir Imagen"
3. Verify the upload succeeds or shows a clear error message
4. Check browser console for detailed error logs if issues persist
