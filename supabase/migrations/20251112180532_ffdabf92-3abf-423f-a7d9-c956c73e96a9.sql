-- Add fcm_token column to profiles table for push notifications
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS fcm_token TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_fcm_token ON profiles(fcm_token) WHERE fcm_token IS NOT NULL;

-- Update the notification trigger to call both WhatsApp and Push notification functions
CREATE OR REPLACE FUNCTION public.notify_providers_new_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  provider_record RECORD;
BEGIN
  -- When a new job is created with visit_fee_paid = true,
  -- notify all verified providers
  IF NEW.visit_fee_paid = true AND NEW.provider_id IS NULL AND NEW.status = 'active' THEN
    -- Insert in-app notifications for all verified providers
    FOR provider_record IN
      SELECT DISTINCT p.user_id
      FROM profiles p
      WHERE p.is_tasker = true
        AND p.verification_status = 'verified'
    LOOP
      INSERT INTO notifications (user_id, type, title, message, link, created_at)
      VALUES (
        provider_record.user_id,
        'new_job_available',
        'Nuevo trabajo disponible',
        'Hay un nuevo trabajo disponible: ' || NEW.title,
        '/provider-portal/jobs',
        NOW()
      );
    END LOOP;
    
    -- Send WhatsApp notifications via edge function (non-blocking)
    PERFORM net.http_post(
      url := 'https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/send-whatsapp-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub'
      ),
      body := jsonb_build_object(
        'job_id', NEW.id,
        'type', 'new_job_available'
      )
    );
    
    -- Send push notifications via edge function (non-blocking)
    PERFORM net.http_post(
      url := 'https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('request.jwt.claims', true)::json->>'sub'
      ),
      body := jsonb_build_object(
        'job_id', NEW.id,
        'type', 'new_job_available',
        'title', 'Nuevo trabajo disponible',
        'body', 'Hay un nuevo trabajo: ' || NEW.title,
        'data', jsonb_build_object('link', '/provider-portal/jobs', 'job_id', NEW.id::text)
      )
    );
  END IF;
  
  RETURN NEW;
END;
$function$;