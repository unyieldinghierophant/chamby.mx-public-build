-- Fase 1: Limpieza de proveedores antiguos
-- Eliminar trabajos asociados a proveedores antiguos
DELETE FROM jobs WHERE provider_id IN (
  SELECT id FROM users WHERE id IN (
    'f8dd8eed-79dc-4c9c-9b45-3c582b2ad5c6',
    '85dc8326-ef83-49ee-aa49-c92c5d5abce6'
  )
);

-- Eliminar notificaciones de proveedores antiguos
DELETE FROM notifications WHERE user_id IN (
  'f8dd8eed-79dc-4c9c-9b45-3c582b2ad5c6',
  '85dc8326-ef83-49ee-aa49-c92c5d5abce6'
);

-- Eliminar provider_details
DELETE FROM provider_details WHERE user_id IN (
  'f8dd8eed-79dc-4c9c-9b45-3c582b2ad5c6',
  '85dc8326-ef83-49ee-aa49-c92c5d5abce6'
);

-- Eliminar roles de proveedor
DELETE FROM user_roles WHERE user_id IN (
  'f8dd8eed-79dc-4c9c-9b45-3c582b2ad5c6',
  '85dc8326-ef83-49ee-aa49-c92c5d5abce6'
) AND role = 'provider';

-- Eliminar usuarios
DELETE FROM users WHERE id IN (
  'f8dd8eed-79dc-4c9c-9b45-3c582b2ad5c6',
  '85dc8326-ef83-49ee-aa49-c92c5d5abce6'
);

-- Fase 2: Actualizar trigger de notificaciones
-- Modificar para notificar a TODOS los proveedores (modo desarrollo)
CREATE OR REPLACE FUNCTION public.notify_providers_new_job()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  provider_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Solo procesar cuando el job se vuelve 'active' y no tiene proveedor
  IF NEW.status = 'active' AND NEW.provider_id IS NULL AND (OLD IS NULL OR OLD.status != 'active') THEN
    
    -- Encontrar todos los proveedores (modo desarrollo - sin filtro de verificación)
    FOR provider_record IN
      SELECT DISTINCT
        pd.user_id,
        u.full_name,
        u.phone,
        pd.fcm_token,
        pd.id as provider_detail_id
      FROM public.provider_details pd
      JOIN public.users u ON u.id = pd.user_id
      WHERE EXISTS (
        SELECT 1 FROM public.user_roles ur 
        WHERE ur.user_id = pd.user_id 
        AND ur.role = 'provider'
      )
    LOOP
      -- Insertar notificación usando auth user_id
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
          'provider_detail_id', provider_record.provider_detail_id
        ),
        false
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Creadas % notificaciones para job %', notification_count, NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;