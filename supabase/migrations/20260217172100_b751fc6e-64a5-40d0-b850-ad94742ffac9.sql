-- Allow providers to accept/claim unassigned jobs in 'searching' or 'active' status
-- The provider sets provider_id to their own auth.uid()
CREATE POLICY "providers_can_accept_unassigned_jobs"
ON public.jobs
FOR UPDATE
USING (
  provider_id IS NULL
  AND status IN ('searching', 'active')
  AND has_role(auth.uid(), 'provider'::app_role)
)
WITH CHECK (
  provider_id = auth.uid()
  AND status IN ('accepted', 'assigned')
);