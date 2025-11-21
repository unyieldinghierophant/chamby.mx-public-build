-- Update handle_new_user trigger to accept 'is_provider' metadata
-- Maintain backward compatibility with 'is_tasker'

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert into users table (common data for all users)
  INSERT INTO public.users (id, full_name, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'client'::app_role)
  );
  
  -- Check both is_provider (new) and is_tasker (old) for backward compatibility
  IF COALESCE((NEW.raw_user_meta_data ->> 'is_provider')::boolean, false) = true 
     OR COALESCE((NEW.raw_user_meta_data ->> 'is_tasker')::boolean, false) = true THEN
    INSERT INTO public.provider_details (user_id)
    VALUES (NEW.id);
    
    -- Add provider role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'provider'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$function$;