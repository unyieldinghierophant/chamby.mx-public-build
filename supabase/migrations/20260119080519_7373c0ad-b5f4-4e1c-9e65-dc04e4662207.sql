-- Agregar política RLS para permitir a usuarios insertar su propio rol de provider/client
CREATE POLICY "Users can insert their own roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND role IN ('client'::app_role, 'provider'::app_role)
);