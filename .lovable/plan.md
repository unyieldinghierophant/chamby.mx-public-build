

## Diagnosis

The `resolve-dispute` edge function fails with "Invoice not found" because disputes opened from `/esperando-proveedor` (refund requests when no provider is found) have `invoice_id = null`. The function unconditionally queries the invoice and throws if not found (line 75).

From the logs, every attempt (release, refund, cancel) fails at this same point because the invoice fetch happens before the resolution action branching.

## Fix

Update `resolve-dispute/index.ts` to handle disputes without an invoice:

1. **Make invoice fetch conditional** -- only fetch if `dispute.invoice_id` is not null
2. **For "release" action** -- require invoice (throw if missing, since there's nothing to release)
3. **For "refund" action** -- if no invoice, look for visit fee payments in the `payments` table for that job and refund those instead. If no payments found at all, throw a clear error ("No payments found to refund")
4. **For "cancel" action** -- invoice is not needed at all, skip entirely

### Code changes (single file)

**`supabase/functions/resolve-dispute/index.ts`**:

- Move invoice fetch after the `resolution_action` branching
- In the `release` branch: fetch invoice, require it
- In the `refund` branch: try invoice first, fall back to `payments` table looking for any succeeded payment (`visit_fee`, `visit_fee_authorization`, or `job_invoice`) for the job
- In the `cancel` branch: no invoice needed, just update statuses

This is a ~30-line restructure of the existing logic, no new tables or schema changes required.

