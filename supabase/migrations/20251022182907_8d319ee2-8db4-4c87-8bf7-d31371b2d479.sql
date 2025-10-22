-- Fix 1: Drop the insecure view and create a secure function
DROP VIEW IF EXISTS admin_dashboard_stats;

-- Create a secure function that checks admin role
CREATE OR REPLACE FUNCTION public.get_admin_dashboard_stats()
RETURNS TABLE (
  total_jobs bigint,
  completed_jobs bigint,
  cancelled_jobs bigint,
  active_users bigint,
  active_providers bigint,
  jobs_today bigint,
  bookings_today bigint,
  total_payments numeric
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  -- Only allow admins to access stats
  SELECT 
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM jobs)
    ELSE NULL END as total_jobs,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM jobs WHERE status = 'completed')
    ELSE NULL END as completed_jobs,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM jobs WHERE status = 'cancelled')
    ELSE NULL END as cancelled_jobs,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(DISTINCT user_id) FROM profiles WHERE is_tasker = false)
    ELSE NULL END as active_users,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(DISTINCT user_id) FROM profiles WHERE is_tasker = true AND verification_status = 'verified')
    ELSE NULL END as active_providers,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM jobs WHERE DATE(created_at) = CURRENT_DATE)
    ELSE NULL END as jobs_today,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COUNT(*) FROM bookings WHERE DATE(created_at) = CURRENT_DATE)
    ELSE NULL END as bookings_today,
    CASE WHEN has_role(auth.uid(), 'admin'::app_role) THEN
      (SELECT COALESCE(SUM(total_amount), 0) FROM bookings WHERE payment_status = 'paid')
    ELSE NULL END as total_payments
  WHERE has_role(auth.uid(), 'admin'::app_role);
$$;

-- Fix 2: Remove permissive unauthenticated job_requests policy
DROP POLICY IF EXISTS "Anyone can insert job requests" ON job_requests;