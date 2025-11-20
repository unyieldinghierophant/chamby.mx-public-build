-- Helper function to get provider profile ID from auth user ID
CREATE OR REPLACE FUNCTION public.get_provider_profile_id(auth_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM profiles WHERE user_id = auth_user_id LIMIT 1;
$$;

-- Helper function to get client ID from auth user ID  
CREATE OR REPLACE FUNCTION public.get_client_id_from_user_id(auth_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM clients WHERE email = (
    SELECT email FROM auth.users WHERE id = auth_user_id
  ) LIMIT 1;
$$;

-- Drop and recreate jobs RLS policies with correct provider_id mapping
DROP POLICY IF EXISTS "Providers can read their jobs" ON jobs;
DROP POLICY IF EXISTS "Providers can update their jobs" ON jobs;
DROP POLICY IF EXISTS "Authenticated users can view active jobs" ON jobs;

CREATE POLICY "Providers can read their jobs"
ON jobs
FOR SELECT
TO authenticated
USING (provider_id = get_provider_profile_id(auth.uid()));

CREATE POLICY "Providers can update their jobs"
ON jobs
FOR UPDATE
TO authenticated
USING (provider_id = get_provider_profile_id(auth.uid()))
WITH CHECK (provider_id = get_provider_profile_id(auth.uid()));

CREATE POLICY "Authenticated users can view active jobs"
ON jobs
FOR SELECT
TO authenticated
USING (
  status = 'active' 
  AND tasker_id IS NULL
  AND auth.role() = 'authenticated'
);

-- Fix payments RLS policies to use correct provider mapping
DROP POLICY IF EXISTS "Providers can view their own payments" ON payments;
DROP POLICY IF EXISTS "Providers can insert their own payments" ON payments;
DROP POLICY IF EXISTS "Providers can update their own payments" ON payments;

CREATE POLICY "Providers can view their own payments"
ON payments
FOR SELECT
TO authenticated
USING (provider_id = auth.uid());

CREATE POLICY "Providers can insert their own payments"
ON payments
FOR INSERT
TO authenticated
WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can update their own payments"
ON payments
FOR UPDATE
TO authenticated
USING (provider_id = auth.uid())
WITH CHECK (provider_id = auth.uid());

-- Ensure notifications table is correctly configured for real-time
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Add to realtime publication if not already added
DO $$ 
BEGIN
  -- Check if publication exists and add table if needed
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Update notify_providers_new_job function to ensure proper user_id mapping
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
  -- Only process when job becomes active and has payment confirmed
  IF NEW.status = 'active' AND NEW.visit_fee_paid = true AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    
    -- Find matching verified providers based on category
    FOR provider_record IN
      SELECT DISTINCT
        pp.user_id,  -- This is the auth user_id
        p.full_name,
        p.phone,
        pp.fcm_token,
        p.id as profile_id  -- This is the profiles.id
      FROM provider_profiles pp
      JOIN profiles p ON p.user_id = pp.user_id
      WHERE pp.verification_status = 'verified'
        AND pp.verified = true
        -- Match by category if provider has skills
        AND (pp.skills IS NULL OR NEW.category = ANY(pp.skills))
        -- Only active providers
        AND EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = pp.user_id 
          AND ur.role = 'provider'
        )
    LOOP
      -- Insert notification using auth user_id (NOT profile.id)
      INSERT INTO notifications (
        user_id,  -- Use auth user_id
        type,
        title,
        message,
        link,
        data,
        read
      ) VALUES (
        provider_record.user_id,  -- auth.users.id
        'new_job_available',
        'Nuevo trabajo disponible',
        'Hay un nuevo trabajo de ' || NEW.category || ' en ' || COALESCE(NEW.location, 'tu zona'),
        '/provider-portal/jobs',
        jsonb_build_object(
          'job_id', NEW.id,
          'category', NEW.category,
          'rate', NEW.rate,
          'location', NEW.location,
          'provider_profile_id', provider_record.profile_id
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