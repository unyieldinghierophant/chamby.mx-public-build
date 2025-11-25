-- Step 1: Add email to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS email text;

-- Step 2: Create new providers table
CREATE TABLE IF NOT EXISTS providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name text,
  business_email text,
  business_phone text,
  avatar_url text,
  skills text[] DEFAULT '{}',
  specialty text,
  hourly_rate numeric,
  rating numeric DEFAULT 0,
  total_reviews integer DEFAULT 0,
  zone_served text,
  verified boolean DEFAULT false,
  fcm_token text,
  current_latitude numeric,
  current_longitude numeric,
  last_location_update timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on providers
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Step 3: Migrate existing data from provider_details to providers
INSERT INTO providers (
  user_id, 
  skills, 
  specialty, 
  hourly_rate, 
  rating, 
  total_reviews, 
  zone_served, 
  verified, 
  fcm_token, 
  avatar_url, 
  current_latitude, 
  current_longitude, 
  last_location_update, 
  created_at, 
  updated_at
)
SELECT 
  user_id, 
  COALESCE(skills, '{}'), 
  specialty, 
  hourly_rate, 
  rating, 
  total_reviews, 
  zone_served, 
  verified, 
  fcm_token, 
  face_photo_url, 
  current_latitude, 
  current_longitude, 
  last_location_update, 
  created_at, 
  updated_at
FROM provider_details
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Add provider_id to provider_details
ALTER TABLE provider_details ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES providers(id) ON DELETE CASCADE;

-- Populate provider_id from providers table
UPDATE provider_details pd
SET provider_id = p.id
FROM providers p
WHERE pd.user_id = p.user_id;

-- Step 5: Add verification columns to provider_details
ALTER TABLE provider_details ADD COLUMN IF NOT EXISTS id_document_url text;
ALTER TABLE provider_details ADD COLUMN IF NOT EXISTS background_check_status text DEFAULT 'pending';
ALTER TABLE provider_details ADD COLUMN IF NOT EXISTS admin_notes text;

-- Step 6: Drop ALL existing provider_details policies before modifying columns
DROP POLICY IF EXISTS "provider_details_select_own" ON provider_details;
DROP POLICY IF EXISTS "provider_details_update_own" ON provider_details;
DROP POLICY IF EXISTS "provider_details_insert_own" ON provider_details;
DROP POLICY IF EXISTS "provider_details_select_verified" ON provider_details;
DROP POLICY IF EXISTS "provider_details_admin_select" ON provider_details;
DROP POLICY IF EXISTS "provider_details_admin_update" ON provider_details;

-- Step 7: Now drop columns that moved to providers
ALTER TABLE provider_details 
  DROP COLUMN IF EXISTS skills CASCADE,
  DROP COLUMN IF EXISTS specialty CASCADE,
  DROP COLUMN IF EXISTS hourly_rate CASCADE,
  DROP COLUMN IF EXISTS rating CASCADE,
  DROP COLUMN IF EXISTS total_reviews CASCADE,
  DROP COLUMN IF EXISTS zone_served CASCADE,
  DROP COLUMN IF EXISTS verified CASCADE,
  DROP COLUMN IF EXISTS fcm_token CASCADE,
  DROP COLUMN IF EXISTS current_latitude CASCADE,
  DROP COLUMN IF EXISTS current_longitude CASCADE,
  DROP COLUMN IF EXISTS last_location_update CASCADE;

-- Step 8: Create RLS policies for providers table
CREATE POLICY "providers_select_own"
  ON providers FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "providers_select_verified"
  ON providers FOR SELECT
  USING (verified = true);

CREATE POLICY "providers_insert_own"
  ON providers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "providers_update_own"
  ON providers FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "providers_admin_select"
  ON providers FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "providers_admin_update"
  ON providers FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 9: Recreate provider_details RLS policies
CREATE POLICY "provider_details_select_own"
  ON provider_details FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "provider_details_update_own"
  ON provider_details FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "provider_details_insert_own"
  ON provider_details FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "provider_details_admin_select"
  ON provider_details FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "provider_details_admin_update"
  ON provider_details FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Step 10: Update handle_new_user trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_provider_id uuid;
BEGIN
  -- Insert into users table with email
  INSERT INTO public.users (id, full_name, phone, email)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'client'::app_role)
  );
  
  -- Check if user is provider
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
$function$;

-- Step 11: Update provider rating trigger
CREATE OR REPLACE FUNCTION public.update_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  UPDATE public.providers
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
$function$;

-- Step 12: Update ensure_provider_details trigger
CREATE OR REPLACE FUNCTION public.ensure_provider_details()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  new_provider_id uuid;
BEGIN
  IF NEW.role = 'provider' THEN
    -- Create provider record
    INSERT INTO public.providers (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING
    RETURNING id INTO new_provider_id;
    
    -- Get provider id if already existed
    IF new_provider_id IS NULL THEN
      SELECT id INTO new_provider_id FROM public.providers WHERE user_id = NEW.user_id;
    END IF;
    
    -- Create provider_details
    INSERT INTO public.provider_details (provider_id, user_id, verification_status)
    VALUES (new_provider_id, NEW.user_id, 'pending')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;

-- Step 13: Add updated_at trigger for providers
DROP TRIGGER IF EXISTS update_providers_updated_at ON providers;
CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Step 14: Update notify_providers_new_job function
CREATE OR REPLACE FUNCTION public.notify_providers_new_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
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
      WHERE EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = p.user_id 
        AND ur.role = 'provider'
      )
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
$function$;