-- Fix RLS policies on clients table to use auth.email() instead of auth.uid()

-- Drop existing policies
DROP POLICY IF EXISTS "chamby client policy" ON clients;
DROP POLICY IF EXISTS "client_insert_policy" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record" ON clients;
DROP POLICY IF EXISTS "Users can delete their own client record" ON clients;

-- Create corrected policies using auth.email()
CREATE POLICY "Users can view their own client record"
ON clients
FOR SELECT
TO authenticated
USING (email = auth.email());

CREATE POLICY "Users can insert their own client record"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (email = auth.email());

CREATE POLICY "Users can update their own client record"
ON clients
FOR UPDATE
TO authenticated
USING (email = auth.email())
WITH CHECK (email = auth.email());

CREATE POLICY "Users can delete their own client record"
ON clients
FOR DELETE
TO authenticated
USING (email = auth.email());