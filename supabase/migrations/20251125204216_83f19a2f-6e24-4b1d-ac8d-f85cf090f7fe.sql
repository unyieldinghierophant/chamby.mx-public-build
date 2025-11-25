-- Create user_roles table (it was missing from previous migration)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Migrate existing users to have client role
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'client'::app_role
FROM auth.users
ON CONFLICT (user_id, role) DO NOTHING;

-- Add provider role for existing providers
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'provider'::app_role
FROM public.providers
ON CONFLICT (user_id, role) DO NOTHING;