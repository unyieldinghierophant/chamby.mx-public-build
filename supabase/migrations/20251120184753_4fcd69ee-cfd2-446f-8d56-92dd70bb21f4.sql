-- Phase 1: Create New Simplified Schema

-- 1. Create users table (replaces profiles, clients, client_profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create provider_details table (replaces provider_profiles)
CREATE TABLE IF NOT EXISTS public.provider_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  skills TEXT[],
  hourly_rate NUMERIC,
  zone_served TEXT,
  specialty TEXT,
  verification_status TEXT DEFAULT 'pending',
  verified BOOLEAN DEFAULT false,
  rating NUMERIC DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  fcm_token TEXT,
  face_photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create new simplified jobs table
CREATE TABLE IF NOT EXISTS public.jobs_new (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  client_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- What
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  service_type TEXT,
  problem TEXT,
  
  -- Where
  location TEXT,
  
  -- When
  scheduled_at TIMESTAMPTZ,
  time_preference TEXT,
  exact_time TEXT,
  
  -- How much
  budget TEXT,
  rate NUMERIC NOT NULL,
  final_price NUMERIC,
  amount_booking_fee NUMERIC DEFAULT 250,
  amount_service_total NUMERIC,
  total_amount NUMERIC,
  
  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'assigned', 'in_progress', 'completed', 'cancelled')),
  
  -- Media
  photos TEXT[],
  photo_count INTEGER DEFAULT 0,
  
  -- Additional
  urgent BOOLEAN DEFAULT false,
  duration_hours INTEGER DEFAULT 1,
  visit_fee_paid BOOLEAN DEFAULT true,
  provider_visited BOOLEAN DEFAULT false,
  
  -- Reschedule tracking
  reschedule_requested_at TIMESTAMPTZ,
  reschedule_requested_date TIMESTAMPTZ,
  reschedule_response_deadline TIMESTAMPTZ,
  original_scheduled_date TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Phase 2: Enable RLS on new tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs_new ENABLE ROW LEVEL SECURITY;

-- Phase 3: Create RLS Policies

-- Users table policies
CREATE POLICY "users_select_own" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "users_update_own" ON public.users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "users_insert_own" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Provider details policies
CREATE POLICY "provider_details_select_verified" ON public.provider_details
  FOR SELECT USING (verified = true);

CREATE POLICY "provider_details_select_own" ON public.provider_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "provider_details_update_own" ON public.provider_details
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "provider_details_insert_own" ON public.provider_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "provider_details_admin_update" ON public.provider_details
  FOR UPDATE USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "provider_details_admin_select" ON public.provider_details
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Jobs new table policies
CREATE POLICY "jobs_new_select_active" ON public.jobs_new
  FOR SELECT USING (
    status IN ('pending', 'active') 
    AND provider_id IS NULL
  );

CREATE POLICY "jobs_new_select_own_client" ON public.jobs_new
  FOR SELECT USING (auth.uid() = client_id);

CREATE POLICY "jobs_new_select_own_provider" ON public.jobs_new
  FOR SELECT USING (auth.uid() = provider_id);

CREATE POLICY "jobs_new_insert_client" ON public.jobs_new
  FOR INSERT WITH CHECK (
    auth.uid() = client_id 
    AND provider_id IS NULL
    AND status IN ('pending', 'active')
  );

CREATE POLICY "jobs_new_update_client" ON public.jobs_new
  FOR UPDATE USING (
    auth.uid() = client_id 
    AND provider_id IS NULL
  );

CREATE POLICY "jobs_new_update_provider" ON public.jobs_new
  FOR UPDATE USING (auth.uid() = provider_id);

-- Phase 4: Migrate data from old tables to new tables

-- Migrate profiles to users table
INSERT INTO public.users (id, full_name, phone, avatar_url, bio, created_at, updated_at)
SELECT user_id, full_name, phone, avatar_url, bio, created_at, updated_at 
FROM public.profiles
ON CONFLICT (id) DO NOTHING;

-- Migrate provider_profiles to provider_details
INSERT INTO public.provider_details (
  user_id, skills, hourly_rate, zone_served, specialty, 
  verification_status, verified, rating, total_reviews, 
  fcm_token, face_photo_url, created_at, updated_at
)
SELECT 
  user_id, skills, hourly_rate, zone_served, specialty,
  verification_status, verified, rating, total_reviews,
  fcm_token, face_photo_url, created_at, updated_at
FROM public.provider_profiles
ON CONFLICT (user_id) DO NOTHING;

-- Migrate jobs to jobs_new (converting client_id from clients table to auth.users)
INSERT INTO public.jobs_new (
  id, client_id, provider_id, title, description, category, service_type, problem,
  location, scheduled_at, time_preference, exact_time,
  budget, rate, final_price, amount_booking_fee, amount_service_total, total_amount,
  status, photos, photo_count, urgent, duration_hours, visit_fee_paid, provider_visited,
  reschedule_requested_at, reschedule_requested_date, reschedule_response_deadline, original_scheduled_date,
  created_at, updated_at
)
SELECT 
  j.id,
  -- Convert client_id from clients.id to auth.users.id
  COALESCE(
    (SELECT au.id FROM auth.users au JOIN public.clients c ON c.email = au.email WHERE c.id = j.client_id LIMIT 1),
    j.client_id
  ) as client_id,
  -- Convert provider_id from profiles.id to auth.users.id
  COALESCE(
    (SELECT p.user_id FROM public.profiles p WHERE p.id = j.provider_id LIMIT 1),
    j.provider_id
  ) as provider_id,
  j.title, j.description, j.category, j.service_type, j.problem,
  j.location, j.scheduled_at, j.time_preference, j.exact_time,
  j.budget, j.rate, j.amount_service_total, j.amount_booking_fee, j.amount_service_total, j.total_amount,
  j.status, j.photos, j.photo_count, j.urgent, j.duration_hours, j.visit_fee_paid, j.provider_visited,
  j.reschedule_requested_at, j.reschedule_requested_date, j.reschedule_response_deadline, j.original_scheduled_date,
  j.created_at, j.updated_at
FROM public.jobs j
ON CONFLICT (id) DO NOTHING;

-- Phase 5: Update trigger function for new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into users table (common data for all users)
  INSERT INTO public.users (id, full_name, phone)
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
  
  -- If user is a provider, create provider_details
  IF COALESCE((NEW.raw_user_meta_data ->> 'is_tasker')::boolean, false) = true THEN
    INSERT INTO public.provider_details (user_id)
    VALUES (NEW.id);
    
    -- Add provider role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'provider'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Phase 6: Update other functions to reference new tables

-- Update provider rating trigger
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.provider_details
  SET 
    rating = (
      SELECT AVG(rating)::numeric(3,2)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE provider_id = NEW.provider_id
    ),
    updated_at = now()
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$$;

-- Update notify providers function for new jobs
CREATE OR REPLACE FUNCTION public.notify_providers_new_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Only process when job becomes active and is unassigned
  IF NEW.status = 'active' AND NEW.provider_id IS NULL AND (OLD IS NULL OR OLD.status != 'active') THEN
    
    -- Find matching verified providers based on category
    FOR provider_record IN
      SELECT DISTINCT
        pd.user_id,
        u.full_name,
        u.phone,
        pd.fcm_token,
        pd.id as provider_detail_id
      FROM public.provider_details pd
      JOIN public.users u ON u.id = pd.user_id
      WHERE pd.verification_status = 'verified'
        AND pd.verified = true
        AND (pd.skills IS NULL OR NEW.category = ANY(pd.skills))
        AND EXISTS (
          SELECT 1 FROM public.user_roles ur 
          WHERE ur.user_id = pd.user_id 
          AND ur.role = 'provider'
        )
    LOOP
      -- Insert notification using auth user_id
      INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        link,
        data,
        read
      ) VALUES (
        provider_record.user_id,
        'new_job_available',
        'Nuevo trabajo disponible',
        'Hay un nuevo trabajo de ' || NEW.category || ' en ' || COALESCE(NEW.location, 'tu zona'),
        '/provider-portal/jobs',
        jsonb_build_object(
          'job_id', NEW.id,
          'category', NEW.category,
          'rate', NEW.rate,
          'location', NEW.location,
          'provider_detail_id', provider_record.provider_detail_id
        ),
        false
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % notifications for job %', notification_count, NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update triggers to use new jobs_new table
DROP TRIGGER IF EXISTS notify_providers_on_new_job ON public.jobs;
CREATE TRIGGER notify_providers_on_new_job
  AFTER INSERT OR UPDATE ON public.jobs_new
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_providers_new_job();

-- Phase 7: Drop old tables (we'll keep jobs for now and rename later)
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.client_profiles CASCADE;
DROP TABLE IF EXISTS public.provider_profiles CASCADE;
DROP TABLE IF EXISTS public.admin_users CASCADE;
DROP TABLE IF EXISTS public.admin_activity_log CASCADE;
DROP TABLE IF EXISTS public.payments CASCADE;
DROP TABLE IF EXISTS public.provider_payment_methods CASCADE;
DROP TABLE IF EXISTS public.photo_short_links CASCADE;

-- Phase 8: Rename jobs_new to jobs
ALTER TABLE IF EXISTS public.jobs RENAME TO jobs_old_backup;
ALTER TABLE public.jobs_new RENAME TO jobs;

-- Create updated_at trigger for new tables
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_provider_details_updated_at
  BEFORE UPDATE ON public.provider_details
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();