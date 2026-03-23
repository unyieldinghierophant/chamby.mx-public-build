-- Create a SECURITY DEFINER function for safe role assignment
-- Only allows assigning client/provider to the calling user
CREATE OR REPLACE FUNCTION public.assign_own_role(_role app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Block admin self-assignment
  IF _role = 'admin' THEN
    RAISE EXCEPTION 'Cannot self-assign admin role';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Drop the permissive INSERT policy
DROP POLICY "Users can insert their own roles" ON public.user_roles;