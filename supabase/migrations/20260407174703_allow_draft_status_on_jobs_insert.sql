-- Fix: Allow jobs to be inserted with status='draft' (new booking flow)
-- The previous policy only allowed status='pending' (legacy initial status).
-- Both 'draft' and 'pending' mean "pre-payment" — the stripe webhook and
-- create-visit-payment edge function already handle both.
DROP POLICY IF EXISTS "jobs_new_insert_client" ON jobs;
CREATE POLICY "jobs_new_insert_client" ON jobs
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = client_id
    AND provider_id IS NULL
    AND status IN ('draft', 'pending')
  );
