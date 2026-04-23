# Chamby — Claude Code Instructions

## Stack
- Frontend: React + Vite (TypeScript)
- Backend: Supabase (Postgres, RLS, Edge Functions, Auth)
- Payments: Stripe (PaymentIntent with capture_method: manual)
- Hosting: Vercel
- Email: Postmark via Supabase SMTP
- Repo: github.com/unyieldinghierophant/chamby.mx-public-build

## Communication rules
- Terse. No trailing summaries. No emojis. No filler.
- After any file change: state what changed and whether it's local-only or committed.
- Never push without explicit instruction ("push" or "ship it").
- Distinguish pre-existing bugs from bugs you introduced.
- After a commit: always state live vs local status.
- At the end of any session where changes were made: ask "Update MEMORY.md or keep this as a one-off?"

## Code rules
- Never modify a component without checking if it has other instances in the codebase. Search all uses before editing.
- If you change a data structure (categories, service types, status values, icons, labels): find and update EVERY place it appears. Use grep before assuming you got them all.
- Never hardcode values that are already in a config, constant file, or Supabase table.
- Before editing any payment-related code: read MEMORY.md payment section first.
- Never re-introduce a bug documented in MEMORY.md.
- Guard all secure-context APIs (crypto.randomUUID, etc.) for non-HTTPS / LAN dev access.

## Efficiency rules
- Do not read the entire codebase speculatively. Search for the specific file or symbol you need.
- When asked to make a small change: touch only the files required. Do not refactor adjacent code.
- If a task requires more than 3 files: list them and confirm before editing.

## Patterns

### Categories
Defined in: `src/data/categoryServices.ts`
Assets: `src/assets/category-{slug}.png` / `.webp`
- Any UI that displays categories must pull from `categoryServices.ts`
- If a category is added or renamed: update that file, then run:
  ```
  grep -r "categoryServices\|CategoryCard\|CategoryTabs\|AllCategoriesDialog" src/ --include="*.tsx" -l
  ```
- `Header.tsx` has its own category list — it must always match `categoryServices.ts`

### Supabase
- Client: `src/integrations/supabase/client.ts`
- Types: `src/integrations/supabase/types.ts`

### Stripe / Payments
- Utils: `src/lib/stripe.ts`
- Pricing: `src/utils/pricingConfig.ts`
- Edge functions: `supabase/functions/create-visit-authorization/`, `create-visit-payment/`, `complete-first-visit/`, `stripe-webhook/`
- All monetary values in Stripe are MXN centavos (e.g. $406 MXN = 40600)

### Job state
- State machine: `src/utils/jobStateMachine.ts`
- Status transitions go through `supabase/functions/transition-job-status/`

## Before you touch payments
Read MEMORY.md → "Payment architecture" section. The visit fee model is finalized. Do not redesign it.

## Skills

Skills live in `.agents/skills/`. Claude Code reads and applies them automatically based on context. Never skip them.

### Core rule
Before ANY UI work: read `.agents/skills/impeccable/` first. It contains the master design principles everything else builds on.

### Always apply automatically

| Trigger | Skill |
|---|---|
| Any UI work (always) | `impeccable` |
| Building or editing any UI component | `design-taste-frontend` |
| Final pass before committing UI changes | `polish` |
| Any new page or feature being built | `redesign-existing-projects` |

### Apply when relevant

| Situation | Skill |
|---|---|
| Mobile/responsive issues, breakpoints | `adapt` |
| Adding animations or transitions | `animate` |
| Quality check before shipping | `audit` |
| UI looks bland, generic, safe | `bolder` |
| Confusing copy, error messages, labels | `clarify` |
| UI needs more color or warmth | `colorize` |
| UI feels too busy or overwhelming | `quieter` |
| Spacing, layout, visual hierarchy issues | `layout` |
| Slow, janky, large bundle | `optimize` |
| UI too cluttered or complex | `distill` |
| Typography looks off or generic | `typeset` |
| Adding micro-interactions or motion | `delight` |
| Building a landing page or marketing site | `high-end-visual-design` |
| Redesigning an existing screen | `redesign-existing-projects` |
| Clean minimal aesthetic needed | `minimalist-ui` |
| Raw/industrial aesthetic requested | `industrial-brutalist-ui` |
| Premium design system needed | `stitch-design-taste` |
| Working with images or visual assets | `image-taste-frontend` |

### Never do
- Ship UI without running `polish`
- Build a new component without reading `impeccable` + `design-taste-frontend`
- Use Inter, generic gradients, purple/blue AI aesthetic, pure black, emoji in UI
- Use 3-column equal card layouts, centered hero layouts, or unstyled shadcn defaults
