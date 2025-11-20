-- Fix foreign key relationships for proper joins

-- Drop and recreate provider_profiles with proper foreign key
ALTER TABLE public.provider_profiles 
  DROP CONSTRAINT IF EXISTS provider_profiles_user_id_fkey;

ALTER TABLE public.provider_profiles
  ADD CONSTRAINT provider_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Drop and recreate client_profiles with proper foreign key
ALTER TABLE public.client_profiles 
  DROP CONSTRAINT IF EXISTS client_profiles_user_id_fkey;

ALTER TABLE public.client_profiles
  ADD CONSTRAINT client_profiles_user_id_fkey 
  FOREIGN KEY (user_id) 
  REFERENCES auth.users(id) 
  ON DELETE CASCADE;

-- Grant necessary permissions
GRANT ALL ON public.provider_profiles TO authenticated;
GRANT ALL ON public.client_profiles TO authenticated;

-- Create indexes for better join performance
CREATE INDEX IF NOT EXISTS idx_provider_profiles_user_id ON public.provider_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_client_profiles_user_id ON public.client_profiles(user_id);