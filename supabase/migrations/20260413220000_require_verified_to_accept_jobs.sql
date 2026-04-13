-- Providers must be verified to view or accept available jobs.
-- Prevents unverified/rejected providers from claiming jobs and creating stuck payouts.

DROP POLICY IF EXISTS "providers_view_available_jobs" ON jobs;
CREATE POLICY "providers_view_available_jobs" ON jobs
  FOR SELECT TO authenticated
  USING (
    status IN ('pending', 'searching')
    AND provider_id IS NULL
    AND has_role(auth.uid(), 'provider'::app_role)
    AND EXISTS (
      SELECT 1 FROM provider_details
      WHERE user_id = auth.uid()
      AND verification_status = 'verified'
    )
  );

DROP POLICY IF EXISTS "providers_can_accept_unassigned_jobs" ON jobs;
CREATE POLICY "providers_can_accept_unassigned_jobs" ON jobs
  FOR UPDATE TO authenticated
  USING (
    provider_id IS NULL
    AND status IN ('searching', 'pending')
    AND has_role(auth.uid(), 'provider'::app_role)
    AND EXISTS (
      SELECT 1 FROM provider_details
      WHERE user_id = auth.uid()
      AND verification_status = 'verified'
    )
  )
  WITH CHECK (
    provider_id = auth.uid()
    AND status = 'assigned'
  );
