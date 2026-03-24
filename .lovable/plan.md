

## Fix: Document Approval UI State + Selfie Requirement Alignment

### Problems Found

1. **Badge shows wrong status**: The UI checks `doc.verification_status === 'verified'` but the database constraint only allows `'pending'`, `'approved'`, or `'rejected'`. After approving a document, the status becomes `'approved'` but the UI only recognizes `'verified'` — so it stays showing "Pendiente" and keeps the red X button visible.

2. **Standalone selfie mismatch**: The `admin-verify-provider` edge function requires 5 canonical documents including a standalone `selfie`, but `DocumentsStep.tsx` (provider onboarding) only collects 4 documents — no standalone selfie. The provider can never upload a standalone selfie, so approval always fails with "Faltan documentos: Selfie".

### Changes

**1. Fix badge status checks in `AdminDashboard.tsx` (lines 970-988)**

Replace all `'verified'` comparisons with `'approved'` to match the DB constraint:
```typescript
// Badge display
doc.verification_status === 'approved' ? '✓ Aprobado' : ...
// Hide approve button
doc.verification_status !== 'approved' && (...)
```

**2. Fix badge status check in `AdminProvidersPage.tsx` (line 428)**

Same fix — change `'verified'` to `'approved'`.

**3. Remove standalone selfie from edge function requirements**

In `admin-verify-provider/index.ts`, remove the `selfie` entry from `CANONICAL_DOCS`. The provider already uploads `selfie_with_id` which serves the same identity verification purpose. This aligns the edge function with what providers can actually upload. The `CANONICAL_DOCS` array becomes 4 items: `ine_front`, `ine_back`, `selfie_with_id`, `proof_of_address`.

### Risk Assessment
- **Low risk**: Only fixing a status string mismatch and removing an impossible-to-satisfy requirement. No schema changes, no new policies.

