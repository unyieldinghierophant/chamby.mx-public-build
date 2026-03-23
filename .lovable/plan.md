

## Fix: RLS Policy Always True

### Problem
The `authenticated_users_update_photo_links` policy on `photo_short_links` uses `USING (true)`, allowing any authenticated user to modify any short link's `full_url` — a redirect hijacking risk. This is the only non-SELECT policy triggering the Supabase linter warning.

### Current Usage
The UPDATE is only used in `PhotoRedirect.tsx` to increment click counts (fire-and-forget). No other code updates `photo_short_links`.

### Solution
Replace the permissive UPDATE policy with a SECURITY DEFINER function that only increments clicks — no direct UPDATE access needed.

**Step 1 — Create an RPC to increment clicks:**
```sql
CREATE OR REPLACE FUNCTION public.increment_photo_link_clicks(_short_code text)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE photo_short_links
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE short_code = _short_code;
$$;
```

**Step 2 — Drop the permissive UPDATE policy:**
```sql
DROP POLICY "authenticated_users_update_photo_links" ON public.photo_short_links;
```

**Step 3 — Update `PhotoRedirect.tsx`** to call the RPC instead of direct update:
```typescript
// Before:
supabase.from('photo_short_links').update({ clicks: ... }).eq('short_code', shortCode)

// After:
supabase.rpc('increment_photo_link_clicks', { _short_code: shortCode })
```

### Risk Assessment
- **Low risk**: The only consumer of this UPDATE is click tracking in PhotoRedirect. The RPC does exactly the same thing but without exposing write access to the full table.
- No other tables have non-SELECT `USING(true)` policies.
- The `service_categories` and `photo_short_links` SELECT `USING(true)` policies are intentionally excluded by the linter (public read access is expected).

### Technical Details
- **Migration**: 1 new function + 1 dropped policy
- **Client code**: 1 line change in `PhotoRedirect.tsx`
- **No functionality change**: Click tracking continues to work identically

