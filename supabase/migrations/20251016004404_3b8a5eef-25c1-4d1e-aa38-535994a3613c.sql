-- Remove unused role column from clients table
-- Authorization now uses the user_roles table exclusively

ALTER TABLE public.clients DROP COLUMN IF EXISTS role;