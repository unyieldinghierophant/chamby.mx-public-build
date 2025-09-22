-- Update the handle_new_user function to also insert into clients table with role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
BEGIN
  -- Insert into profiles table (existing functionality)
  INSERT INTO public.profiles (user_id, full_name, is_tasker, phone)
  VALUES (
    NEW.id, 
    NEW.raw_user_meta_data ->> 'full_name',
    COALESCE((NEW.raw_user_meta_data ->> 'is_tasker')::boolean, false),
    NEW.raw_user_meta_data ->> 'phone'
  );
  
  -- Insert into clients table with role
  INSERT INTO public.clients (email, phone, role)
  VALUES (
    NEW.email,
    NEW.raw_user_meta_data ->> 'phone',
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'client')
  );
  
  RETURN NEW;
END;
$function$;