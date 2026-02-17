
-- FIX: Change all UPDATE policies on jobs from RESTRICTIVE to PERMISSIVE
-- RESTRICTIVE means ALL must pass; we need PERMISSIVE (any one passes)

-- 1. Drop and recreate jobs_new_update_provider as PERMISSIVE
DROP POLICY IF EXISTS "jobs_new_update_provider" ON public.jobs;
CREATE POLICY "jobs_new_update_provider"
ON public.jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

-- 2. Drop and recreate jobs_new_update_client as PERMISSIVE
DROP POLICY IF EXISTS "jobs_new_update_client" ON public.jobs;
CREATE POLICY "jobs_new_update_client"
ON public.jobs
FOR UPDATE
TO authenticated
USING (auth.uid() = client_id)
WITH CHECK (auth.uid() = client_id);

-- 3. Drop and recreate providers_can_accept_unassigned_jobs as PERMISSIVE
DROP POLICY IF EXISTS "providers_can_accept_unassigned_jobs" ON public.jobs;
CREATE POLICY "providers_can_accept_unassigned_jobs"
ON public.jobs
FOR UPDATE
TO authenticated
USING (
  provider_id IS NULL
  AND status IN ('searching', 'active')
  AND has_role(auth.uid(), 'provider'::app_role)
)
WITH CHECK (
  provider_id = auth.uid()
  AND status IN ('accepted', 'assigned')
);

-- 4. Allow providers to read client info for their assigned jobs
-- Add a PERMISSIVE SELECT policy on users table for job participants
CREATE POLICY "providers_can_view_job_client_info"
ON public.users
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT client_id FROM public.jobs WHERE provider_id = auth.uid()
  )
);
