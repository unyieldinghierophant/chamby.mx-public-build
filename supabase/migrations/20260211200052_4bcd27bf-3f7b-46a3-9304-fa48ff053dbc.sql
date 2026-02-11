-- Add 'searching' to allowed statuses in providers_view_available_jobs RLS policy
DROP POLICY IF EXISTS "providers_view_available_jobs" ON public.jobs;

CREATE POLICY "providers_view_available_jobs"
ON public.jobs
FOR SELECT
USING (
  status IN ('pending', 'active', 'searching')
  AND provider_id IS NULL
  AND has_role(auth.uid(), 'provider'::app_role)
);