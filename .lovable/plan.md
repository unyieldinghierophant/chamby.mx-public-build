

## Security Fix: Restrict Sensitive Provider Data Exposure

### Current State

The `providers` table contains sensitive fields (Stripe account IDs, real-time GPS coordinates, business contact info) alongside public profile data. While current RLS policies only allow self-access and admin access (no cross-provider exposure exists today), this is a defense-in-depth concern — any future policy change could leak all columns at once.

### What We'll Do

Create a SQL migration that adds a **restricted view** (`providers_public`) exposing only safe columns, then tighten the base table's non-admin, non-self SELECT to deny direct access from any new policies that might be added.

### Steps

**1. Create `providers_public` view**

A `SECURITY INVOKER` view that exposes only: `id`, `user_id`, `display_name`, `avatar_url`, `skills`, `specialty`, `hourly_rate`, `rating`, `total_reviews`, `zone_served`, `verified`. This excludes `business_email`, `business_phone`, `stripe_account_id`, `stripe_*` fields, `current_latitude`, `current_longitude`, `fcm_token`.

**2. Update `get_verified_providers()` function**

Already returns limited columns — no change needed, but we'll verify it doesn't leak sensitive fields.

**3. Update client-side code**

Audit all `from('providers').select(...)` calls to ensure non-admin, non-self queries use only safe columns. The current code already selects specific columns (not `*`), so no client code changes are needed — this is purely a database-level hardening.

### Technical Detail

```sql
-- Create restricted view
CREATE VIEW public.providers_public
WITH (security_invoker = on) AS
  SELECT id, user_id, display_name, avatar_url, skills, specialty,
         hourly_rate, rating, total_reviews, zone_served, verified,
         created_at
  FROM public.providers;

-- No base table policy changes needed since existing policies
-- already restrict to self + admin only
```

### What Won't Change
- No Supabase edge functions modified
- No client-side code changes (all existing queries already select specific safe columns)
- No RLS policy removals — existing self-access and admin policies remain
- Provider onboarding, Stripe Connect, and job acceptance flows all untouched

### Risk Assessment
- **Low risk**: This is additive only (creating a view). No existing queries or policies are modified.
- The view serves as a safe target for any future features that need cross-provider data (e.g., public profiles, provider search).

