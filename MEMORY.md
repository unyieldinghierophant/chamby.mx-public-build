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

---

## Payment architecture (FINALIZED — do not redesign)

- Visit fee: **$406 MXN** ($350 base + $56 IVA)
- Stripe receives: **40600 centavos** (all Stripe amounts in MXN centavos)
- Chamby absorbs: ~$18 Stripe fee
- Flow: `PaymentIntent` with `capture_method: manual` → hold created at booking
- Hold released on job completion (client confirms)
- Quote rejected: hold released → $250 to provider + $100 to Chamby
- Cron: `supabase/functions/auto-complete-jobs/` auto-releases expired holds every 2h
- No charge unless work is complete and client confirms

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

[2026-03-27] Payment audit complete. 7 critical bugs identified and fixed. Phase 1 (visit fee hold) queued for implementation.
[2026-03] Migrated codebase from Lovable to Claude Code. DNS moved to Spaceship + Vercel. Postmark SMTP reconnected.
