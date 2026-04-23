# Chamby — Memory

> Living doc. At the end of any session where changes were made, Claude Code asks:
> "Update MEMORY.md or keep this as a one-off?"
> If yes, append to the relevant section below.

---

## Stack

| Layer | Tool | Notes |
|---|---|---|
| Frontend | React + Vite (TypeScript) | |
| Backend | Supabase | Postgres, RLS, Edge Functions, Auth |
| Payments | Stripe | PaymentIntent, capture_method: manual |
| Hosting | Vercel | Auto-deploy from GitHub on push |
| Email | Postmark | Connected via Supabase SMTP |
| Repo | github.com/unyieldinghierophant/chamby.mx-public-build | |
| Supabase project | uiyjmjibshnkhwewtkoz.supabase.co | |

---

## Key file locations

| What | Path |
|---|---|
| Categories / service data | `src/data/categoryServices.ts` |
| Supabase client | `src/integrations/supabase/client.ts` |
| Supabase types | `src/integrations/supabase/types.ts` |
| Stripe utils | `src/lib/stripe.ts` |
| Pricing config | `src/utils/pricingConfig.ts` |
| Job state machine | `src/utils/jobStateMachine.ts` |
| Routes constants | `src/constants/routes.ts` |
| Edge functions | `supabase/functions/` |
| Shared edge utils | `supabase/functions/_shared/` |
| Payment edge functions | `supabase/functions/create-visit-authorization/` `supabase/functions/create-visit-payment/` `supabase/functions/complete-first-visit/` `supabase/functions/stripe-webhook/` |
| Payout + settlement edge functions | `supabase/functions/_shared/settlement.ts` `supabase/functions/complete-job/` `supabase/functions/auto-complete-jobs/` (dual pass: 24h auto-completion + 5-day hold release) `supabase/functions/release-provider-payout/` (manual admin release) `supabase/functions/admin-payment-action/` |

---

## Payment architecture (FINALIZED — do not redesign)

### Visit fee
- Visit fee: **$406 MXN** ($350 base + $56 IVA)
- Stripe receives: **40600 centavos** (all Stripe amounts in MXN centavos)
- Chamby absorbs: ~$18 Stripe fee
- Flow: `PaymentIntent` with `capture_method: manual` → hold created at booking
- Hold released on job completion (client confirms)
- Quote rejected: hold released → $250 to provider + $100 to Chamby
- Cron: `supabase/functions/auto-complete-jobs/` auto-completes after 24h without client confirm and releases the visit-fee hold
- No charge unless work is complete and client confirms

### Provider payout (5-day hold, as of 2026-04-23)
- Provider receives **90%** of the invoice `total_customer_amount`. Chamby keeps **10%** on each side (20% total spread).
- All Stripe amounts in MXN centavos.
- Flow at completion: `settleJobCompletion` inserts a `payouts` row with `status='holding'` and `release_after = now() + 5 days`. **No Stripe transfer runs at completion time.**
- Auto-release: `auto-complete-jobs` has a second pass that queries `payouts` where `status='holding' AND release_after <= now()`, runs the Stripe transfer, and promotes to `status='released'` (with `released_at` set).
- Manual early release: admin UI "Liberar ahora" button → `release-provider-payout` edge function. Unchanged by the hold.
- Cancel during hold: admin UI "Cancelar" sets `status='cancelled'` on the payout row (no Stripe call).
- Payout status vocabulary: `pending | holding | released | failed | cancelled`. Legacy `paid` ≡ `released`; legacy `awaiting_provider_onboarding` still emitted by some paths — treat as holding.
- Provider not Stripe-onboarded at release time: cron skips (row stays `holding`) — they can still finish onboarding during the 5-day window.

### Visit fee vs provider payout — KEY DISTINCTION
These are **separate money flows**. The visit fee hold is cancelled/released to the client on completion (they never paid it for real). The provider payout comes from the invoice (a different PaymentIntent the client paid for the quoted work) and is subject to the 5-day hold. Do not conflate them when editing edge functions or dashboards.

---

## Known bugs fixed (do not re-introduce)

| Bug | Where fixed | Date |
|---|---|---|
| Hardcoded wrong refund amount | Payment edge functions | 2026-03-27 |
| Missing hold capture on quote rejection | `respond-to-quote` edge fn | 2026-03-27 |
| Missing hold cancellation on no-provider assigned | `notify-no-provider` edge fn | 2026-03-27 |
| Dispute payout used subtotal instead of payout amount | `resolve-dispute` edge fn | 2026-03-27 |
| Two zombie functions re-introduced old flow | Disabled with 410 responses | 2026-03-27 |
| `valid_job_status` constraint missing `'draft'` | Supabase migration | Pre-March |
| Stripe webhook silent failure | `stripe-webhook` edge fn | Pre-March |
| Password reset role-based redirect broken | `AuthCallback.tsx` + `ResetPassword.tsx` | Pre-March |
| Postmark SMTP disconnected from Supabase | Reconnected in Supabase dashboard | Pre-March |
| `open-dispute` allowed `cancelled` jobs (inconsistent with state machine `cancelled: []`) — failed downstream, surfaced as generic "non-2xx" to the client | `supabase/functions/open-dispute/index.ts` + client guards in `ActiveJobs.tsx` / `JobTimelinePage.tsx` + error parsing in `DisputeModal.tsx` | 2026-04-23 |

---

## Architecture decisions

| Decision | Reason |
|---|---|
| Migrated from Lovable to Claude Code + VS Code + Vercel | Full control, no platform lock-in |
| PaymentIntent with manual capture (not Checkout) | Mexico 7-day auth expiry constraint; need hold-then-release model |
| Postmark for email (not Supabase native) | Better deliverability, template support |
| Single repo, Vercel auto-deploy | Simplicity; no staging environment currently |
| All monetary values in centavos in Stripe | Stripe standard for MXN |
| CFDI/SAT compliance deferred | Post-MVP; not blocking launch |

---

## Categories

Categories are defined in `src/data/categoryServices.ts`.
Assets (icons/images) live in `src/assets/` as `category-{slug}.png` / `.webp`.

**Rule:** Any UI component that shows categories MUST pull from `categoryServices.ts`.
If a category is added or renamed, update that file then grep for all consumers:
```bash
grep -r "categoryServices\|CategoryCard\|CategoryTabs\|AllCategoriesDialog" src/ --include="*.tsx" -l
```

Also check `Header.tsx` — it has its own category list that must stay in sync.

---

## Data deletion order (test data)

Foreign key constraint: `payments` references `jobs`.
Always delete in this order:
1. `payments`
2. `jobs`

---

## Google OAuth

Google OAuth consent screen: update display name from Supabase project ID → "Chamby"
Location: Google Cloud Console → APIs & Services → OAuth consent screen

---

## Changelog

<!-- Append new entries at the top. Format: [YYYY-MM-DD] Short description -->

[2026-04-23] 5-day automated provider-payout hold shipped. Completion no longer transfers to Stripe — payouts land as `holding` with `release_after = +5d`; `auto-complete-jobs` cron auto-releases them. Admin PagosView gets a payout dashboard (summary cards, filter tabs, Liberar ahora / Cancelar actions). Provider earnings page shows held balance + per-row countdown.
[2026-04-23] AdminJobDetail god-mode gaps closed: capture-button bug fix, release-hold + payout override actions, chronological status timeline, Ver perfil links, Favor cliente/proveedor quick-resolve buttons, mobile layout stacking, tabbed chat.
[2026-04-23] `open-dispute` aligned with state machine — cancelled jobs now rejected with Spanish error; client hides dispute button + shows inline notice; DisputeModal extracts 4xx body so edge-function errors actually surface.
[2026-03-27] Payment audit complete. 7 critical bugs identified and fixed. Phase 1 (visit fee hold) queued for implementation.
[2026-03] Migrated codebase from Lovable to Claude Code. DNS moved to Spaceship + Vercel. Postmark SMTP reconnected.
