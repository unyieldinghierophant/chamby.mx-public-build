-- Add role field to clients table with default "client"
ALTER TABLE public.clients 
ADD COLUMN role text NOT NULL DEFAULT 'client';

-- Add check constraint to ensure role is either 'client' or 'provider'
ALTER TABLE public.clients 
ADD CONSTRAINT clients_role_check 
CHECK (role IN ('client', 'provider'));