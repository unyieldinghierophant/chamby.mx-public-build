-- Fix RLS policies to properly get user email
-- Supabase doesn't have auth.email(), we need to get it from auth.users or JWT

DROP POLICY IF EXISTS "Users can view their own client record" ON clients;
DROP POLICY IF EXISTS "Users can insert their own client record" ON clients;
DROP POLICY IF EXISTS "Users can update their own client record" ON clients;
DROP POLICY IF EXISTS "Users can delete their own client record" ON clients;

-- Use auth.jwt() to get email from the JWT token
CREATE POLICY "Users can view their own client record"
ON clients
FOR SELECT
TO authenticated
USING (email = (auth.jwt()->>'email')::text);

CREATE POLICY "Users can insert their own client record"
ON clients
FOR INSERT
TO authenticated
WITH CHECK (email = (auth.jwt()->>'email')::text);

CREATE POLICY "Users can update their own client record"
ON clients
FOR UPDATE
TO authenticated
USING (email = (auth.jwt()->>'email')::text)
WITH CHECK (email = (auth.jwt()->>'email')::text);

CREATE POLICY "Users can delete their own client record"
ON clients
FOR DELETE
TO authenticated
USING (email = (auth.jwt()->>'email')::text);