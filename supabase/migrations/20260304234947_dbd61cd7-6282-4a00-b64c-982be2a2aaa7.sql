-- Update RLS policy: providers_view_available_jobs to include 'pending'
DROP POLICY IF EXISTS "providers_view_available_jobs" ON jobs;
CREATE POLICY "providers_view_available_jobs" ON jobs
  FOR SELECT TO authenticated
  USING (
    status IN ('pending', 'searching')
    AND provider_id IS NULL
    AND has_role(auth.uid(), 'provider'::app_role)
  );

-- Update RLS policy: providers_can_accept_unassigned_jobs
DROP POLICY IF EXISTS "providers_can_accept_unassigned_jobs" ON jobs;
CREATE POLICY "providers_can_accept_unassigned_jobs" ON jobs
  FOR UPDATE TO authenticated
  USING (
    provider_id IS NULL
    AND status IN ('searching', 'pending')
    AND has_role(auth.uid(), 'provider'::app_role)
  )
  WITH CHECK (
    provider_id = auth.uid()
    AND status = 'assigned'
  );

-- Update jobs_new_insert_client to allow 'pending' only
DROP POLICY IF EXISTS "jobs_new_insert_client" ON jobs;
CREATE POLICY "jobs_new_insert_client" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = client_id
    AND provider_id IS NULL
    AND status = 'pending'
  );