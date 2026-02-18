

## Fix Provider Portal Runtime Crashes

### Problem
Two runtime errors crash the provider portal:
1. **"Cannot read properties of null (reading 'toFixed')"** -- triggered when `total_amount`, `rate`, `rating`, or invoice fields are null/undefined.
2. **Minified React error #310** -- caused by rendering components with null data before guards catch it.

### Solution

#### 1. Create shared helper `toFixedSafe`
- **New file**: `src/utils/formatSafe.ts`
- Export `toFixedSafe(value: number | null | undefined, digits: number, fallback = '—'): string`
- Returns `fallback` if value is null/undefined/NaN, otherwise `value.toFixed(digits)`

#### 2. Replace unsafe `.toFixed()` calls in provider-portal scope

| File | Line(s) | Unsafe call | Fix |
|------|---------|-------------|-----|
| `src/pages/provider-portal/ProviderJobs.tsx` | 213, 257 | `job.total_amount.toFixed(2)` | `toFixedSafe(job.total_amount, 2)` |
| `src/components/provider-portal/JobCardAvailable.tsx` | 114 | `job.rate.toFixed(2)` | `toFixedSafe(job.rate, 2)` |
| `src/pages/provider-portal/ProviderAccount.tsx` | 133 | `providerProfile.rating.toFixed(1)` | `toFixedSafe(providerProfile.rating, 1)` |
| `src/pages/provider-portal/ProviderDashboardHome.tsx` | 272 | `stats.rating.toFixed(1)` | `toFixedSafe(stats.rating, 1)` (already safe but consistent) |
| `src/pages/provider-portal/JobTimelinePage.tsx` | 524, 528, 532 | `visitFee.toFixed(0)` etc. | `toFixedSafe(visitFee, 0)` etc. (already has `|| 350` fallback but add safety) |
| `src/components/provider-portal/InvoiceCard.tsx` | 203, 367, 371, 375, 431, 457, 467, 477 | Various `.toFixed(2)` on invoice amounts | `toFixedSafe(...)` for `invoice.total_customer_amount`, `item.total`, and computed expressions |
| `src/components/provider-portal/JobCardMobile.tsx` | 41 | `km.toFixed(1)` | Already guarded by null check above -- safe, but wrap for consistency |

#### 3. Guard `.map()` sources against null
- In `ProviderJobs.tsx`: ensure `availableJobs`, `activeJobs`, `futureJobs`, `historicalJobs` default to `[]` before `.map()`
- In `InvoiceCard.tsx`: guard `invoice.items` with `(invoice.items ?? [])` before `.map()` and `.reduce()`

#### 4. Early returns in JobTimelinePage for loading/null job
- Already has early returns at lines 390-409 (loading spinner + null job guard) -- these are correct and in place. No change needed here.

### Files changed
- **New**: `src/utils/formatSafe.ts`
- **Edited**: `src/pages/provider-portal/ProviderJobs.tsx`, `src/components/provider-portal/JobCardAvailable.tsx`, `src/pages/provider-portal/ProviderAccount.tsx`, `src/pages/provider-portal/ProviderDashboardHome.tsx`, `src/pages/provider-portal/JobTimelinePage.tsx`, `src/components/provider-portal/InvoiceCard.tsx`, `src/components/provider-portal/JobCardMobile.tsx`

