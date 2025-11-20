-- Drop the trigger and function with CASCADE
DROP TRIGGER IF EXISTS trigger_send_notification_after_insert ON notifications;
DROP FUNCTION IF EXISTS send_notification_after_insert() CASCADE;

-- Update provider verification status
UPDATE provider_profiles 
SET 
  verified = true,
  skills = ARRAY['plomeria', 'electrician']
WHERE verification_status = 'verified' AND verified = false;

-- Insert notifications for active jobs to verified providers
INSERT INTO notifications (user_id, type, title, message, link, data, read)
SELECT 
  pp.user_id,
  'new_job_available',
  'Nuevo trabajo disponible',
  'Hay un nuevo trabajo de ' || j.category || ' en ' || COALESCE(j.location, 'tu zona'),
  '/provider-portal/jobs',
  jsonb_build_object(
    'job_id', j.id,
    'category', j.category,
    'rate', j.rate,
    'location', j.location,
    'provider_profile_id', pp.id
  ),
  false
FROM jobs j
CROSS JOIN provider_profiles pp
WHERE j.status = 'active' 
  AND j.visit_fee_paid = true 
  AND j.provider_id IS NULL
  AND pp.verification_status = 'verified'
  AND pp.verified = true
  AND (pp.skills IS NULL OR j.category = ANY(pp.skills))
  AND NOT EXISTS (
    SELECT 1 FROM notifications n
    WHERE n.user_id = pp.user_id
      AND n.type = 'new_job_available'
      AND n.data->>'job_id' = j.id::text
  );