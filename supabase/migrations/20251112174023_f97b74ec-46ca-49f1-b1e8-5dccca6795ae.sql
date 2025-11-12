-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS notify_providers_on_new_job ON jobs;

-- Create or replace the notification function
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
  -- notify all verified providers in the area
  IF NEW.visit_fee_paid = true AND NEW.provider_id IS NULL AND NEW.status = 'active' THEN
    -- Insert notifications for all verified providers
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
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger
CREATE TRIGGER notify_providers_on_new_job
  AFTER INSERT OR UPDATE OF visit_fee_paid ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_providers_new_job();

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status_provider ON jobs(status, provider_id) WHERE provider_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_jobs_visit_fee_paid ON jobs(visit_fee_paid) WHERE visit_fee_paid = true;
CREATE INDEX IF NOT EXISTS idx_profiles_verified_providers ON profiles(is_tasker, verification_status) WHERE is_tasker = true AND verification_status = 'verified';