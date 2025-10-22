-- Create admin role enum (extending existing app_role if needed)
-- Since app_role already exists, we'll check if 'admin' is included
-- If not, we need to add it to the existing enum

-- Add admin to app_role enum if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) THEN
    CREATE TYPE public.app_role AS ENUM ('client', 'provider', 'admin');
  ELSE
    -- Check if 'admin' value exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'admin' AND enumtypid = 'public.app_role'::regtype) THEN
      ALTER TYPE public.app_role ADD VALUE 'admin';
    END IF;
  END IF;
END $$;

-- Create admin_users table for storing admin-specific data
CREATE TABLE IF NOT EXISTS public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  department text, -- e.g., 'operations', 'finance', 'support', 'content'
  permissions jsonb DEFAULT '{}', -- fine-grained permissions
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  last_login_at timestamp with time zone,
  is_active boolean DEFAULT true
);

-- Enable RLS on admin_users
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'admin'::app_role
  )
$$;

-- RLS Policies for admin_users
CREATE POLICY "Admins can view all admin users"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "Admins can insert admin users"
  ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (is_admin(auth.uid()));

CREATE POLICY "Admins can update admin users"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (is_admin(auth.uid()));

-- Create admin_activity_log for audit trail
CREATE TABLE IF NOT EXISTS public.admin_activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES auth.users(id) NOT NULL,
  action text NOT NULL, -- e.g., 'user_verified', 'job_refunded', 'user_suspended'
  entity_type text NOT NULL, -- e.g., 'user', 'job', 'booking', 'payment'
  entity_id uuid,
  details jsonb,
  ip_address inet,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on admin_activity_log
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy for admin_activity_log
CREATE POLICY "Admins can view activity logs"
  ON public.admin_activity_log
  FOR SELECT
  TO authenticated
  USING (is_admin(auth.uid()));

CREATE POLICY "System can insert activity logs"
  ON public.admin_activity_log
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = admin_id);

-- Create admin dashboard stats view
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
  (SELECT COUNT(*) FROM jobs) as total_jobs,
  (SELECT COUNT(*) FROM jobs WHERE status = 'completed') as completed_jobs,
  (SELECT COUNT(*) FROM jobs WHERE status = 'cancelled') as cancelled_jobs,
  (SELECT COUNT(DISTINCT customer_id) FROM bookings) as active_users,
  (SELECT COUNT(DISTINCT user_id) FROM profiles WHERE is_tasker = true AND verification_status = 'verified') as active_providers,
  (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'paid') as total_payments,
  (SELECT COUNT(*) FROM jobs WHERE created_at > now() - interval '24 hours') as jobs_today,
  (SELECT COUNT(*) FROM bookings WHERE created_at > now() - interval '24 hours') as bookings_today;

-- Grant select on view to authenticated users (admins will access through RLS)
GRANT SELECT ON public.admin_dashboard_stats TO authenticated;

-- Create function to get top providers
CREATE OR REPLACE FUNCTION public.get_top_providers(limit_count integer DEFAULT 10)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  rating numeric,
  total_reviews integer,
  completed_jobs bigint,
  total_earnings numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.rating,
    p.total_reviews,
    COUNT(DISTINCT j.id) as completed_jobs,
    COALESCE(SUM(j.rate), 0) as total_earnings
  FROM profiles p
  LEFT JOIN jobs j ON j.provider_id = (SELECT id FROM clients WHERE email = (SELECT email FROM auth.users WHERE id = p.user_id))
  WHERE p.is_tasker = true 
    AND p.verification_status = 'verified'
    AND (j.status = 'completed' OR j.status IS NULL)
  GROUP BY p.user_id, p.full_name, p.rating, p.total_reviews
  ORDER BY completed_jobs DESC, p.rating DESC
  LIMIT limit_count;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_created_at ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_activity_log_entity ON admin_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);