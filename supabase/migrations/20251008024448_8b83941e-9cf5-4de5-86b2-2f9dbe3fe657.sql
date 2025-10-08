-- Create a security definer function to get the user's email
CREATE OR REPLACE FUNCTION public.get_user_email()
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
DROP POLICY IF EXISTS "Users can insert their own client record" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record" ON clients;
DROP POLICY IF EXISTS "Users can delete their own client record" ON clients;

-- Create new policies using the security definer function
CREATE POLICY "Users can view their own client record"
ON clients
FOR SELECT
TO authenticated
USING (email = public.get_user_email());

CREATE POLICY "Users can insert their own client record"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (email = public.get_user_email());

CREATE POLICY "Users can update their own client record"
ON clients
FOR UPDATE
TO authenticated
USING (email = public.get_user_email())
WITH CHECK (email = public.get_user_email());

CREATE POLICY "Users can delete their own client record"
ON clients
FOR DELETE
TO authenticated
USING (email = public.get_user_email());