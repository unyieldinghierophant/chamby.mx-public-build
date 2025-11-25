-- Create app_role enum if it doesn't exist
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'provider');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  link text,
  data jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Create has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create is_provider helper function
CREATE OR REPLACE FUNCTION public.is_provider(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.providers
    WHERE user_id = _user_id
  )
$$;

-- Create is_admin function
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_provider_id uuid;
BEGIN
  -- Insert into users table (everyone is a user/client)
  INSERT INTO public.users (id, full_name, phone, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email
  );
  
  -- Everyone gets 'client' role by default
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client'::app_role);
  
  -- Check if user is provider (from signup metadata)
  IF COALESCE((NEW.raw_user_meta_data ->> 'is_provider')::boolean, false) = true 
     OR COALESCE((NEW.raw_user_meta_data ->> 'is_tasker')::boolean, false) = true THEN
    
    -- Create provider record
    INSERT INTO public.providers (user_id, display_name, business_email, business_phone)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.email,
      NEW.raw_user_meta_data ->> 'phone'
    )
    RETURNING id INTO new_provider_id;
    
    -- Create provider_details for verification
    INSERT INTO public.provider_details (provider_id, user_id, verification_status)
    VALUES (new_provider_id, NEW.id, 'pending');
    
    -- Add provider role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'provider'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update notify_providers_new_job function
CREATE OR REPLACE FUNCTION public.notify_providers_new_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  IF NEW.status = 'active' AND NEW.provider_id IS NULL AND (OLD IS NULL OR OLD.status != 'active') THEN
    
    FOR provider_record IN
      SELECT DISTINCT
        p.user_id,
        u.full_name,
        u.phone,
        p.fcm_token,
        p.id as provider_id
      FROM public.providers p
      JOIN public.users u ON u.id = p.user_id
      WHERE p.verified = true
    LOOP
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
        '/provider-portal/available-jobs',
        jsonb_build_object(
          'job_id', NEW.id,
          'category', NEW.category,
          'rate', NEW.rate,
          'location', NEW.location,
          'title', NEW.title,
          'description', NEW.description,
          'provider_id', provider_record.provider_id
        ),
        false
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update RLS policies that referenced has_role for providers table
DROP POLICY IF EXISTS "providers_admin_select" ON public.providers;
DROP POLICY IF EXISTS "providers_admin_update" ON public.providers;

CREATE POLICY "providers_admin_select"
ON public.providers
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "providers_admin_update"
ON public.providers
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update RLS policies for provider_details
DROP POLICY IF EXISTS "provider_details_admin_select" ON public.provider_details;
DROP POLICY IF EXISTS "provider_details_admin_update" ON public.provider_details;

CREATE POLICY "provider_details_admin_select"
ON public.provider_details
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "provider_details_admin_update"
ON public.provider_details
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Migrate existing users to have client role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'client'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Add provider role for existing providers
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'provider'::app_role
FROM public.providers
ON CONFLICT (user_id, role) DO NOTHING;