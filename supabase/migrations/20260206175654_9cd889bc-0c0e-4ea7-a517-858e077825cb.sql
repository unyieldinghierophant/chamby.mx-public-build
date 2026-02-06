-- =============================================
-- SECURITY FIX: Jobs Table Public Exposure
-- =============================================
-- Drop the overly permissive policy that allows anyone to view jobs
DROP POLICY IF EXISTS "jobs_new_select_active" ON public.jobs;

-- Create new policy: Only authenticated PROVIDERS can view available jobs
CREATE POLICY "providers_view_available_jobs" ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    status IN ('pending', 'active')
    AND provider_id IS NULL
    AND has_role(auth.uid(), 'provider'::app_role)
  );

-- =============================================
-- SECURITY FIX: Photo Short Links Public Exposure
-- =============================================
-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "photo_short_links_select_all" ON public.photo_short_links;

-- Create new policy: Only authenticated users can view photo links
-- This allows both clients and providers who are logged in to access links
CREATE POLICY "authenticated_users_select_photo_links" ON public.photo_short_links
  FOR SELECT
  TO authenticated
  USING (true);

-- Also restrict the UPDATE policy to authenticated users only
DROP POLICY IF EXISTS "photo_short_links_update_all" ON public.photo_short_links;

CREATE POLICY "authenticated_users_update_photo_links" ON public.photo_short_links
  FOR UPDATE
  TO authenticated
  USING (true);