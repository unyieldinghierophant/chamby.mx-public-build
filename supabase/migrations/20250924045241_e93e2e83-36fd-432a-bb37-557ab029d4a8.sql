-- Drop the existing function first
DROP FUNCTION IF EXISTS public.get_public_provider_profiles();

-- Drop the problematic policy that won't work correctly
DROP POLICY IF EXISTS "Public can view provider profiles (limited info)" ON public.profiles;
DROP POLICY IF EXISTS "Anonymous users can view basic provider info" ON public.profiles;

-- Create a better policy for authenticated users to view verified provider profiles
-- This allows authenticated users (potential clients) to see provider profiles for hiring
CREATE POLICY "Authenticated users can view verified providers" 
ON public.profiles 
FOR SELECT 
USING (
  auth.role() = 'authenticated' 
  AND is_tasker = true 
  AND verification_status = 'verified'
);

-- Recreate the function with the correct return type (excluding sensitive data like phone)
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
  verification_status text
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
    p.verification_status
  FROM profiles p
  WHERE p.is_tasker = true 
    AND p.verification_status = 'verified';
$$;