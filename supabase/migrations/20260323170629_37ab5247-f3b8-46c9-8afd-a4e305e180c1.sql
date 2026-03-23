-- Create RPC for click tracking
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

-- Drop the permissive UPDATE policy
DROP POLICY "authenticated_users_update_photo_links" ON public.photo_short_links;