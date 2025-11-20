-- Create function to notify providers about new jobs
CREATE OR REPLACE FUNCTION notify_providers_new_job()
RETURNS TRIGGER
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
    
    -- Find matching verified providers based on category and location
    FOR provider_record IN
      SELECT DISTINCT
        pp.user_id,
        p.full_name,
        p.phone,
        pp.fcm_token
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
      -- Insert notification for each matching provider
      INSERT INTO notifications (
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
          'location', NEW.location
        ),
        false
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    -- Log notification count
    RAISE NOTICE 'Created % notifications for job %', notification_count, NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new job notifications
DROP TRIGGER IF EXISTS trigger_notify_providers_new_job ON jobs;
CREATE TRIGGER trigger_notify_providers_new_job
  AFTER INSERT OR UPDATE ON jobs
  FOR EACH ROW
  EXECUTE FUNCTION notify_providers_new_job();

-- Create function to send notifications after insertion
CREATE OR REPLACE FUNCTION send_notification_after_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_phone TEXT;
  provider_fcm_token TEXT;
  job_data JSONB;
BEGIN
  -- Only process new job notifications
  IF NEW.type = 'new_job_available' AND NEW.data IS NOT NULL THEN
    
    -- Get provider phone and FCM token
    SELECT p.phone, pp.fcm_token
    INTO provider_phone, provider_fcm_token
    FROM profiles p
    LEFT JOIN provider_profiles pp ON pp.user_id = p.user_id
    WHERE p.user_id = NEW.user_id;
    
    -- Call push notification edge function asynchronously
    IF provider_fcm_token IS NOT NULL THEN
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
        ),
        body := jsonb_build_object(
          'user_ids', ARRAY[NEW.user_id::text],
          'type', 'new_job_available',
          'title', NEW.title,
          'body', NEW.message,
          'data', NEW.data
        )
      );
    END IF;
    
    -- Call WhatsApp notification edge function asynchronously
    IF provider_phone IS NOT NULL THEN
      PERFORM net.http_post(
        url := current_setting('app.settings.supabase_url') || '/functions/v1/send-whatsapp-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || current_setting('app.settings.supabase_service_role_key')
        ),
        body := jsonb_build_object(
          'phone', provider_phone,
          'message', NEW.message,
          'job_id', (NEW.data->>'job_id')
        )
      );
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for sending notifications
DROP TRIGGER IF EXISTS trigger_send_notification_after_insert ON notifications;
CREATE TRIGGER trigger_send_notification_after_insert
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION send_notification_after_insert();