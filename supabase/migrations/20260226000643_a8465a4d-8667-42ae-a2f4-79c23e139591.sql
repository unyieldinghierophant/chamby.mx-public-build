
CREATE OR REPLACE FUNCTION public.notify_providers_new_job()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
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
      JOIN public.provider_details pd ON pd.user_id = p.user_id
      WHERE pd.verification_status = 'verified'
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
