-- Fix RLS policies that are directly querying auth.users
-- These policies should use the get_user_email() function instead

-- Drop the problematic policies
DROP POLICY IF EXISTS "Clients can update their pending jobs" ON public.jobs;
DROP POLICY IF EXISTS "Clients can view their own jobs" ON public.jobs;

-- Recreate them using get_user_email() function
CREATE POLICY "Clients can update their pending jobs"
ON public.jobs
FOR UPDATE
USING (
  client_id IN (
    SELECT id FROM clients 
    WHERE email = get_user_email()
  )
  AND status IN ('pending', 'active')
  AND provider_id IS NULL
)
WITH CHECK (
  client_id IN (
    SELECT id FROM clients 
    WHERE email = get_user_email()
  )
);

CREATE POLICY "Clients can view their own jobs"
ON public.jobs
FOR SELECT
USING (
  client_id IN (
    SELECT id FROM clients 
    WHERE email = get_user_email()
  )
);