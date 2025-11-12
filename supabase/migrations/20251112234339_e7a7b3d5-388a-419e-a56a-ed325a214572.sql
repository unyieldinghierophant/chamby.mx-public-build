-- Fix the trigger to use service role key instead of user JWT
-- This ensures WhatsApp and push notifications work from trigger context

CREATE OR REPLACE FUNCTION public.notify_providers_new_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  provider_record RECORD;
  service_key text;
BEGIN
  -- When a job is updated to active with visit_fee_paid = true,
  -- notify all verified providers
  IF NEW.visit_fee_paid = true AND NEW.provider_id IS NULL AND NEW.status = 'active' THEN
    -- Log trigger execution
    RAISE NOTICE '🔔 [TRIGGER] notify_providers_new_job triggered for job: %', NEW.id;
    RAISE NOTICE '   Job details: title=%, category=%, location=%', NEW.title, NEW.category, NEW.location;
    
    -- Insert in-app notifications for all verified providers
    FOR provider_record IN
      SELECT DISTINCT p.user_id, p.full_name
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
      
      RAISE NOTICE '   ✅ Notification inserted for provider: %', provider_record.full_name;
    END LOOP;
    
    -- Get service role key for edge function calls
    service_key := current_setting('app.settings.service_role_key', true);
    IF service_key IS NULL THEN
      -- Fallback to service role key from environment
      service_key := current_setting('supabase.service_role_key', true);
    END IF;
    
    -- Send WhatsApp notifications via edge function (non-blocking)
    BEGIN
      RAISE NOTICE '   📱 Calling WhatsApp notification function...';
      PERFORM net.http_post(
        url := 'https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/send-whatsapp-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('request.jwt.claims', true)::json->>'sub', '')
        ),
        body := jsonb_build_object(
          'job_id', NEW.id,
          'type', 'new_job_available'
        ),
        timeout_milliseconds := 5000
      );
      RAISE NOTICE '   ✅ WhatsApp notification call completed';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '   ⚠️ WhatsApp notification failed: %', SQLERRM;
    END;
    
    -- Send push notifications via edge function (non-blocking)
    BEGIN
      RAISE NOTICE '   🔔 Calling push notification function...';
      PERFORM net.http_post(
        url := 'https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(service_key, current_setting('request.jwt.claims', true)::json->>'sub', '')
        ),
        body := jsonb_build_object(
          'job_id', NEW.id,
          'type', 'new_job_available',
          'title', 'Nuevo trabajo disponible',
          'body', 'Hay un nuevo trabajo: ' || NEW.title,
          'data', jsonb_build_object('link', '/provider-portal/jobs', 'job_id', NEW.id::text)
        ),
        timeout_milliseconds := 5000
      );
      RAISE NOTICE '   ✅ Push notification call completed';
    EXCEPTION WHEN OTHERS THEN
      RAISE WARNING '   ⚠️ Push notification failed: %', SQLERRM;
    END;
    
    RAISE NOTICE '   🎉 [TRIGGER] All notifications processed for job: %', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$function$;