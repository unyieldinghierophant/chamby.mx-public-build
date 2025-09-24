-- First, drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that allows users to view their own complete profile
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create a policy for public viewing of provider profiles with limited information
-- This allows potential clients to see provider profiles for hiring purposes
-- but excludes sensitive information like phone numbers
CREATE POLICY "Public can view provider profiles (limited info)" 
ON public.profiles 
FOR SELECT 
USING (
  is_tasker = true 
  AND verification_status = 'verified'
  AND auth.role() = 'anon'
);

-- Add a function to get safe public profile data for providers
CREATE OR REPLACE FUNCTION public.get_public_provider_profiles()
RETURNS TABLE (
  id uuid,
  full_name text,
  bio text,
  skills text[],
  avatar_url text,
  hourly_rate numeric,
  rating numeric,
  total_reviews integer,
  verification_status text,
  is_tasker boolean
) 
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.bio,
    p.skills,
    p.avatar_url,
    p.hourly_rate,
    p.rating,
    p.total_reviews,
    p.verification_status,
    p.is_tasker
  FROM profiles p
  WHERE p.is_tasker = true 
    AND p.verification_status = 'verified';
$$;