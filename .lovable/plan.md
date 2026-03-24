

## Fix: Re-add Standalone Selfie Requirement + Add to Onboarding

### Problem
The standalone "Selfie" was removed from the edge function's required documents list in the last change. The user wants it to remain mandatory. Additionally, the onboarding wizard (`DocumentsStep.tsx`) never included a standalone selfie — only "Selfie con INE" — so providers going through onboarding can't upload it there.

The admin dashboard already supports displaying and approving selfie documents (the `DOC_TYPE_LABELS` map and document query are correct). The issue is only that:
1. The edge function no longer requires it (incorrectly removed)
2. The onboarding wizard doesn't let providers upload it

### Changes

**1. Re-add selfie to edge function (`supabase/functions/admin-verify-provider/index.ts`)**

Add `{ key: 'selfie', label: 'Selfie', docTypes: ['selfie', 'face_photo', 'face'] }` back to `CANONICAL_DOCS`. This restores the 5-document requirement matching the DB trigger.

**2. Add standalone selfie to onboarding (`src/components/provider-portal/DocumentsStep.tsx`)**

Add a new entry to `REQUIRED_DOCUMENTS`:
```typescript
{
  type: 'selfie',
  name: 'Selfie',
  description: 'Foto clara de tu rostro para identificación',
  icon: User,
  required: true
}
```

Also update `fetchUploadedDocuments` to check for `selfie_url` in `provider_details`.

**3. No admin dashboard changes needed**

`AdminProvidersPage.tsx` already has `selfie: 'Selfie'` in `DOC_TYPE_LABELS` and fetches all documents from the `documents` table. If the selfie exists, it will display correctly with the approve/reject controls.

### Risk Assessment
- **Low risk**: Re-adding what was incorrectly removed, and adding the upload path that was missing from onboarding.
