-- Phase 1: Create new tables for provider and client specific data

-- Create provider_profiles table for provider-specific information
CREATE TABLE IF NOT EXISTS public.provider_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  hourly_rate NUMERIC,
  rating NUMERIC(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  skills TEXT[],
  specialty TEXT,
  zone_served TEXT,
  payment_schedule TEXT DEFAULT 'every_3_days',
  verification_status TEXT DEFAULT 'pending',
  face_photo_url TEXT,
  verified BOOLEAN DEFAULT false,
  fcm_token TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Create client_profiles table for client-specific information
CREATE TABLE IF NOT EXISTS public.client_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT,
  age INTEGER,
  phone_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on new tables
ALTER TABLE public.provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_profiles ENABLE ROW LEVEL SECURITY;

-- Phase 2: Migrate existing data

-- Migrate provider data from profiles to provider_profiles
INSERT INTO public.provider_profiles (
  user_id, hourly_rate, rating, total_reviews, skills, specialty, 
  zone_served, payment_schedule, verification_status, face_photo_url, 
  verified, fcm_token, created_at, updated_at
)
SELECT 
  user_id, hourly_rate, rating, total_reviews, skills, specialty,
  zone_served, payment_schedule, verification_status, face_photo_url,
  verified, fcm_token, created_at, updated_at
FROM public.profiles
WHERE is_tasker = true
ON CONFLICT (user_id) DO NOTHING;

-- Migrate client data from clients to client_profiles
INSERT INTO public.client_profiles (user_id, address, age, phone_verified)
SELECT 
  (SELECT id FROM auth.users WHERE email = clients.email LIMIT 1) as user_id,
  clients.address,
  clients.age,
  clients.phone_verified
FROM public.clients
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = clients.email)
ON CONFLICT (user_id) DO NOTHING;

-- Phase 3: Drop dependent objects and clean up profiles table

-- Drop the policy that depends on is_tasker
DROP POLICY IF EXISTS "Authenticated users can view verified providers" ON public.profiles;

-- Drop the trigger that depends on is_tasker
DROP TRIGGER IF EXISTS trg_provider_role ON public.profiles;
DROP FUNCTION IF EXISTS ensure_provider_role();

-- Now remove provider-specific columns
ALTER TABLE public.profiles DROP COLUMN IF EXISTS hourly_rate;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS rating;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS total_reviews;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS skills;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS specialty;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS zone_served;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS payment_schedule;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS face_photo_url;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS verified;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS fcm_token;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_tasker;

-- Phase 4: Add RLS policies for new tables

-- Provider profiles policies
CREATE POLICY "Providers can view their own profile"
  ON public.provider_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Providers can update their own profile"
  ON public.provider_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Providers can insert their own profile"
  ON public.provider_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view verified providers"
  ON public.provider_profiles
  FOR SELECT
  USING (auth.role() = 'authenticated' AND verified = true);

CREATE POLICY "Admins can view all provider profiles"
  ON public.provider_profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any provider profile"
  ON public.provider_profiles
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Client profiles policies
CREATE POLICY "Clients can view their own profile"
  ON public.client_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can update their own profile"
  ON public.client_profiles
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Clients can insert their own profile"
  ON public.client_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Phase 5: Update triggers and functions

-- Update the trigger function to handle new table structure
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table (common data for all users)
  INSERT INTO public.profiles (user_id, full_name, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'client'::app_role)
  );
  
  -- If user is a provider, create provider_profile
  IF COALESCE((NEW.raw_user_meta_data ->> 'is_tasker')::boolean, false) = true THEN
    INSERT INTO public.provider_profiles (user_id)
    VALUES (NEW.id);
    
    -- Add provider role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'provider'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Create client profile
    INSERT INTO public.client_profiles (user_id)
    VALUES (NEW.id);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update provider rating trigger to use new table
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE provider_profiles
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM reviews
      WHERE provider_id = NEW.provider_id
    ),
    updated_at = now()
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$$;

-- Update function to get public provider profiles
CREATE OR REPLACE FUNCTION public.get_public_provider_profiles()
RETURNS TABLE(
  id UUID,
  full_name TEXT,
  bio TEXT,
  skills TEXT[],
  avatar_url TEXT,
  hourly_rate NUMERIC,
  rating NUMERIC,
  total_reviews INTEGER,
  verification_status TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.id,
    p.full_name,
    p.bio,
    pp.skills,
    p.avatar_url,
    pp.hourly_rate,
    pp.rating,
    pp.total_reviews,
    pp.verification_status
  FROM profiles p
  JOIN provider_profiles pp ON p.user_id = pp.user_id
  WHERE pp.verified = true 
    AND pp.verification_status = 'verified';
$$;

-- Create updated_at trigger for new tables
CREATE TRIGGER update_provider_profiles_updated_at
  BEFORE UPDATE ON public.provider_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_client_profiles_updated_at
  BEFORE UPDATE ON public.client_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();