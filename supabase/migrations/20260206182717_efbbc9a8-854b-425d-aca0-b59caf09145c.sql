-- =============================================
-- FIX 1: Reviews Table - Provider Policy Broken
-- =============================================
-- Drop the broken policy that references non-existent 'profiles' table
DROP POLICY IF EXISTS "Providers can view their reviews" ON public.reviews;

-- Create correct policy allowing providers to view reviews about them
-- Uses direct comparison since provider_id stores the user's auth.uid()
CREATE POLICY "Providers can view their reviews"
ON public.reviews
FOR SELECT
TO authenticated
USING (provider_id = auth.uid());

-- =============================================
-- FIX 2: Providers Table - Sensitive Data Exposure
-- =============================================
-- Drop the overly permissive policy that exposes all columns
DROP POLICY IF EXISTS "providers_select_verified" ON public.providers;

-- Create a secure function that returns ONLY public provider fields
-- This prevents exposure of: stripe_account_id, fcm_token, business_email, 
-- business_phone, current_latitude, current_longitude
CREATE OR REPLACE FUNCTION public.get_verified_providers()
RETURNS TABLE (
  id uuid,
  user_id uuid,
  display_name text,
  avatar_url text,
  skills text[],
  specialty text,
  hourly_rate numeric,
  rating numeric,
  total_reviews integer,
  zone_served text,
  verified boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.user_id,
    p.display_name,
    p.avatar_url,
    p.skills,
    p.specialty,
    p.hourly_rate,
    p.rating,
    p.total_reviews,
    p.zone_served,
    p.verified
  FROM providers p
  WHERE p.verified = true;
$$;