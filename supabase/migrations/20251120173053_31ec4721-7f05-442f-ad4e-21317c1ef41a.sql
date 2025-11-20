-- Phase 1: Remove all payment dependencies and standardize fields

-- 1.1 Make visit_fee_paid default to TRUE and update existing records
ALTER TABLE jobs ALTER COLUMN visit_fee_paid SET DEFAULT true;
UPDATE jobs SET visit_fee_paid = true WHERE visit_fee_paid = false OR visit_fee_paid IS NULL;
ALTER TABLE jobs ALTER COLUMN visit_fee_paid SET NOT NULL;

-- 1.2 Migrate any tasker_id references to provider_id
UPDATE jobs SET provider_id = (
  SELECT p.id FROM profiles p WHERE p.user_id = jobs.tasker_id
) WHERE provider_id IS NULL AND tasker_id IS NOT NULL;

-- 1.3 Drop policies that depend on tasker_id
DROP POLICY IF EXISTS "Authenticated users can view active jobs" ON jobs;

-- Recreate the policy without tasker_id reference
CREATE POLICY "Authenticated users can view active jobs" ON jobs
  FOR SELECT
  USING (
    status = 'active' 
    AND provider_id IS NULL 
    AND auth.role() = 'authenticated'
  );

-- 1.4 Drop all payment-related columns and tasker_id
ALTER TABLE jobs DROP COLUMN IF EXISTS payment_status;
ALTER TABLE jobs DROP COLUMN IF EXISTS stripe_payment_intent_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS stripe_invoice_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS stripe_invoice_url;
ALTER TABLE jobs DROP COLUMN IF EXISTS stripe_invoice_pdf;
ALTER TABLE jobs DROP COLUMN IF EXISTS invoice_due_date;
ALTER TABLE jobs DROP COLUMN IF EXISTS escrow_captured;
ALTER TABLE jobs DROP COLUMN IF EXISTS escrow_refunded;
ALTER TABLE jobs DROP COLUMN IF EXISTS tasker_id;
ALTER TABLE jobs DROP COLUMN IF EXISTS customer_id;

-- 1.5 Update the notification trigger to remove payment checks
CREATE OR REPLACE FUNCTION public.notify_providers_new_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_record RECORD;
  notification_count INTEGER := 0;
BEGIN
  -- Only process when job becomes active and is unassigned
  IF NEW.status = 'active' AND NEW.provider_id IS NULL AND (OLD IS NULL OR OLD.status != 'active') THEN
    
    -- Find matching verified providers based on category
    FOR provider_record IN
      SELECT DISTINCT
        pp.user_id,
        p.full_name,
        p.phone,
        pp.fcm_token,
        pp.id as provider_profile_id
      FROM provider_profiles pp
      JOIN profiles p ON p.user_id = pp.user_id
      WHERE pp.verification_status = 'verified'
        AND pp.verified = true
        AND (pp.skills IS NULL OR NEW.category = ANY(pp.skills))
        AND EXISTS (
          SELECT 1 FROM user_roles ur 
          WHERE ur.user_id = pp.user_id 
          AND ur.role = 'provider'
        )
    LOOP
      -- Insert notification using auth user_id
      INSERT INTO notifications (
        user_id,
        type,
        title,
        message,
        link,
        data,
        read
      ) VALUES (
        provider_record.user_id,
        'new_job_available',
        'Nuevo trabajo disponible',
        'Hay un nuevo trabajo de ' || NEW.category || ' en ' || COALESCE(NEW.location, 'tu zona'),
        '/provider-portal/jobs',
        jsonb_build_object(
          'job_id', NEW.id,
          'category', NEW.category,
          'rate', NEW.rate,
          'location', NEW.location,
          'provider_profile_id', provider_record.provider_profile_id
        ),
        false
      );
      
      notification_count := notification_count + 1;
    END LOOP;
    
    RAISE NOTICE 'Created % notifications for job %', notification_count, NEW.id;
    
  END IF;
  
  RETURN NEW;
END;
$$;