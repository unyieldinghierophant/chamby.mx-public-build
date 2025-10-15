-- Fix 1: Create proper user roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'provider');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (user_id = auth.uid());

-- Only admins can insert/update/delete roles (will be enforced via edge functions)
CREATE POLICY "Only system can manage roles"
ON public.user_roles
FOR ALL
USING (false);

-- Migrate existing roles from clients table to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT 
  (SELECT id FROM auth.users WHERE email = c.email LIMIT 1) as user_id,
  c.role::app_role
FROM public.clients c
WHERE c.email IS NOT NULL
  AND (SELECT id FROM auth.users WHERE email = c.email) IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Fix 2: Restrict OTP table access (remove public SELECT access)
DROP POLICY IF EXISTS "Users can access their own OTP records" ON public.phone_verification_otps;

-- OTPs should only be accessed via edge functions, no direct client access
CREATE POLICY "No direct OTP access"
ON public.phone_verification_otps
FOR ALL
USING (false);

-- Fix 3: Require authentication for viewing active jobs
DROP POLICY IF EXISTS "Everyone can view active jobs" ON public.jobs;

CREATE POLICY "Authenticated users view active jobs"
ON public.jobs
FOR SELECT
USING (
  status = 'active'::text 
  AND auth.role() = 'authenticated'::text
);

-- Fix 4: Fix get_client_id_from_auth function
CREATE OR REPLACE FUNCTION public.get_client_id_from_auth()
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email IS NULL THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT id FROM clients WHERE email = user_email LIMIT 1);
END;
$$;

-- Fix 5: Update jobs RLS policies to use role checking for providers
DROP POLICY IF EXISTS "Providers can create their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Providers can update their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Providers can delete their own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Providers can view and update their own jobs" ON public.jobs;

CREATE POLICY "Providers can create jobs"
ON public.jobs
FOR INSERT
WITH CHECK (
  has_role(auth.uid(), 'provider'::app_role)
  AND provider_id = get_client_id_from_auth()
);

CREATE POLICY "Providers can view their jobs"
ON public.jobs
FOR SELECT
USING (
  (status = 'active'::text AND auth.role() = 'authenticated'::text)
  OR (has_role(auth.uid(), 'provider'::app_role) AND provider_id = get_client_id_from_auth())
);

CREATE POLICY "Providers can update their jobs"
ON public.jobs
FOR UPDATE
USING (
  has_role(auth.uid(), 'provider'::app_role)
  AND provider_id = get_client_id_from_auth()
);

CREATE POLICY "Providers can delete their jobs"
ON public.jobs
FOR DELETE
USING (
  has_role(auth.uid(), 'provider'::app_role)
  AND provider_id = get_client_id_from_auth()
);

-- Create IP rate limiting table for OTP functions
CREATE TABLE IF NOT EXISTS public.otp_rate_limit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  phone_number text,
  action text NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.otp_rate_limit_log ENABLE ROW LEVEL SECURITY;

-- No direct access to rate limit logs
CREATE POLICY "No direct access to rate limit logs"
ON public.otp_rate_limit_log
FOR ALL
USING (false);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_otp_rate_limit_ip_created 
ON public.otp_rate_limit_log(ip_address, created_at DESC);

-- Update handle_new_user function to assign default role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, full_name, is_tasker, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE((NEW.raw_user_meta_data ->> 'is_tasker')::boolean, false),
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- Insert into clients table
  INSERT INTO public.clients (email, phone, role)
  VALUES (
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'client'::app_role)
  );
  
  RETURN NEW;
END;
$$;