-- Allow authenticated clients to create job requests
CREATE POLICY "Clients can create job requests" 
ON jobs 
FOR INSERT 
TO authenticated 
WITH CHECK (
  auth.uid() IS NOT NULL AND
  provider_id IS NULL AND
  status = 'pending'
);

-- Allow clients to view their own jobs
CREATE POLICY "Clients can view their own jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);

-- Allow clients to update their pending jobs
CREATE POLICY "Clients can update their pending jobs"
ON jobs
FOR UPDATE
TO authenticated
USING (
  client_id IN (
    SELECT id FROM clients WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  ) AND status IN ('pending', 'active') AND provider_id IS NULL
)
WITH CHECK (
  client_id IN (
    SELECT id FROM clients WHERE email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  )
);