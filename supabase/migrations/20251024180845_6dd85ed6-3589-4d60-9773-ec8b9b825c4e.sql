-- Fix RLS policies for job_requests table
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can insert their own job requests" ON public.job_requests;
DROP POLICY IF EXISTS "Users can view their own job requests" ON public.job_requests;

-- Create correct INSERT policy for authenticated users
CREATE POLICY "Users can insert their own job requests"
ON public.job_requests
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create SELECT policy for users to view their own requests
CREATE POLICY "Users can view their own job requests"
ON public.job_requests
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);