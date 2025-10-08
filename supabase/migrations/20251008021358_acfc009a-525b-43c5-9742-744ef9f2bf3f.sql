-- Add unique constraint to email column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'clients_email_key'
  ) THEN
    ALTER TABLE public.clients ADD CONSTRAINT clients_email_key UNIQUE (email);
  END IF;
END $$;

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_client();

-- Function to create client record on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user_client()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into clients table with role from metadata or default to 'client'
  INSERT INTO public.clients (email, phone, role, created_at)
  VALUES (
    NEW.email,
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NOW()
  )
  ON CONFLICT (email) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Trigger to call function on user creation
CREATE TRIGGER on_auth_user_created_client
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_client();

-- Backfill missing clients records for existing users
INSERT INTO public.clients (email, phone, role, created_at)
SELECT 
  au.email,
  au.raw_user_meta_data->>'phone' as phone,
  COALESCE(au.raw_user_meta_data->>'role', 'client') as role,
  au.created_at
FROM auth.users au
WHERE au.email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.clients c WHERE c.email = au.email
  )
ON CONFLICT (email) DO NOTHING;