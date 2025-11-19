-- Update the notify_providers_new_job trigger function to insert into job_notifications
-- This aligns with the UI which reads from job_notifications table

DROP FUNCTION IF EXISTS notify_providers_new_job() CASCADE;

CREATE OR REPLACE FUNCTION notify_providers_new_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only notify when job becomes active AND was not active before
  IF NEW.status = 'active' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Insert notification for all verified providers
    INSERT INTO job_notifications (job_id, provider_id, sent_at)
    SELECT NEW.id, p.id, NOW()
    FROM profiles p
    WHERE p.is_tasker = true 
      AND p.verification_status = 'verified';
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_job_status_change ON jobs;

CREATE TRIGGER on_job_status_change
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_providers_new_job();