-- Fix handle_new_user trigger to remove role column from clients insert
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into profiles table
  INSERT INTO public.profiles (user_id, full_name, is_tasker, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE((NEW.raw_user_meta_data ->> 'is_tasker')::boolean, false),
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- Insert into clients table without role column
  INSERT INTO public.clients (email, phone)
  VALUES (
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone'
  )
  ON CONFLICT (email) DO NOTHING;
  
  -- Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (
    NEW.id,
    COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'client'::app_role)
  );
  
  RETURN NEW;
END;
$function$;

-- Fix handle_new_user_client trigger to remove role column from clients insert
CREATE OR REPLACE FUNCTION public.handle_new_user_client()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Insert into clients table without role column
  INSERT INTO public.clients (email, phone, created_at)
  VALUES (
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$function$;