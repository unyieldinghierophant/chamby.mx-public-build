-- Security Fix Phase 1: Critical Data Protection

-- 1. Fix clients table RLS policies
-- Add missing UPDATE policy for clients table
CREATE POLICY "Users can update their own client record" 
ON public.clients 
FOR UPDATE 
USING (auth.uid()::text = email)
WITH CHECK (auth.uid()::text = email);

-- Add DELETE policy for clients table  
CREATE POLICY "Users can delete their own client record" 
ON public.clients 
FOR DELETE 
USING (auth.uid()::text = email);

-- 2. Strengthen documents table security
-- Drop existing policies that use complex email-based checks
DROP POLICY IF EXISTS "client_insert_documents" ON public.documents;
DROP POLICY IF EXISTS "client_select_documents" ON public.documents;  
DROP POLICY IF EXISTS "client_update_documents" ON public.documents;

-- Create more secure document policies using auth.uid() directly
-- First we need a function to get client_id from user_id
CREATE OR REPLACE FUNCTION public.get_client_id_from_auth()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT id FROM clients WHERE email = auth.uid()::text LIMIT 1;
$$;

-- New secure document policies
CREATE POLICY "Users can view their own documents"
ON public.documents
FOR SELECT
USING (client_id = public.get_client_id_from_auth());

CREATE POLICY "Users can insert their own documents"
ON public.documents  
FOR INSERT
WITH CHECK (client_id = public.get_client_id_from_auth());

CREATE POLICY "Users can update their own documents"
ON public.documents
FOR UPDATE  
USING (client_id = public.get_client_id_from_auth())
WITH CHECK (client_id = public.get_client_id_from_auth());

-- 3. Add audit logging trigger for sensitive operations
CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only allow reading own audit logs
CREATE POLICY "Users can view their own audit logs"
ON public.security_audit_log
FOR SELECT
USING (user_id = auth.uid());

-- Create audit trigger function
CREATE OR REPLACE FUNCTION public.audit_security_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log security-sensitive operations on profiles, clients, and documents
  IF TG_TABLE_NAME IN ('profiles', 'clients', 'documents') THEN
    INSERT INTO security_audit_log (
      user_id,
      action,
      table_name, 
      record_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END
    );
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Add audit triggers to sensitive tables
CREATE TRIGGER audit_profiles_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_changes();

CREATE TRIGGER audit_clients_changes  
  AFTER INSERT OR UPDATE OR DELETE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_changes();

CREATE TRIGGER audit_documents_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.documents  
  FOR EACH ROW EXECUTE FUNCTION public.audit_security_changes();

-- 4. Add rate limiting function for sensitive operations
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id uuid,
  _action text,
  _max_attempts integer DEFAULT 5,
  _window_minutes integer DEFAULT 60
)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT (
    SELECT COUNT(*)
    FROM security_audit_log
    WHERE user_id = _user_id 
      AND action = _action
      AND created_at > now() - (_window_minutes || ' minutes')::interval
  ) < _max_attempts;
$$;