-- Add reschedule tracking columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS reschedule_requested_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reschedule_requested_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS reschedule_response_deadline TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS original_scheduled_date TIMESTAMPTZ;

-- Create booking_reschedules table for reschedule request history
CREATE TABLE IF NOT EXISTS booking_reschedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE NOT NULL,
  requested_by UUID NOT NULL,
  original_date TIMESTAMPTZ NOT NULL,
  requested_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  provider_response TEXT CHECK (provider_response IN ('accept', 'suggest_alternative', 'cancel')),
  suggested_date TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on booking_reschedules
ALTER TABLE booking_reschedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for booking_reschedules
CREATE POLICY "Providers can view reschedule requests for their bookings"
  ON booking_reschedules FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_reschedules.booking_id 
      AND bookings.tasker_id = auth.uid()
    )
  );

CREATE POLICY "Customers can view their reschedule requests"
  ON booking_reschedules FOR SELECT
  USING (requested_by = auth.uid());

CREATE POLICY "Customers can create reschedule requests"
  ON booking_reschedules FOR INSERT
  WITH CHECK (requested_by = auth.uid());

CREATE POLICY "Providers can update reschedule requests"
  ON booking_reschedules FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_reschedules.booking_id 
      AND bookings.tasker_id = auth.uid()
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_reschedules_booking_id ON booking_reschedules(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_reschedules_status ON booking_reschedules(status);
CREATE INDEX IF NOT EXISTS idx_bookings_reschedule_deadline ON bookings(reschedule_response_deadline) WHERE reschedule_response_deadline IS NOT NULL;

-- Trigger to update updated_at on booking_reschedules
CREATE TRIGGER update_booking_reschedules_updated_at
  BEFORE UPDATE ON booking_reschedules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to create notification for reschedule request
CREATE OR REPLACE FUNCTION notify_reschedule_request()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  provider_id UUID;
  customer_name TEXT;
BEGIN
  -- Get provider and customer info
  SELECT b.tasker_id, p.full_name INTO provider_id, customer_name
  FROM bookings b
  JOIN profiles p ON b.customer_id = p.user_id
  WHERE b.id = NEW.booking_id;
  
  -- Insert notification for provider
  INSERT INTO notifications (user_id, type, title, message, link, created_at)
  VALUES (
    provider_id,
    'reschedule_request',
    'Solicitud de reprogramación',
    customer_name || ' quiere reprogramar tu trabajo',
    '/provider-portal/reschedule/' || NEW.id,
    NOW()
  );
  
  RETURN NEW;
END;
$$;

-- Trigger on booking_reschedules INSERT
CREATE TRIGGER on_reschedule_request
  AFTER INSERT ON booking_reschedules
  FOR EACH ROW
  EXECUTE FUNCTION notify_reschedule_request();

-- Function to create job reminder notifications
CREATE OR REPLACE FUNCTION create_job_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  job_record RECORD;
  customer_name TEXT;
BEGIN
  -- Create 24-hour reminders
  FOR job_record IN
    SELECT b.id, b.tasker_id, b.title, b.scheduled_date, p.full_name as customer_name
    FROM bookings b
    JOIN profiles p ON b.customer_id = p.user_id
    WHERE b.status IN ('confirmed', 'pending')
    AND b.scheduled_date > NOW()
    AND b.scheduled_date <= NOW() + INTERVAL '25 hours'
    AND b.scheduled_date >= NOW() + INTERVAL '23 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = b.tasker_id 
      AND type = 'job_reminder_24h'
      AND link LIKE '%' || b.id || '%'
      AND created_at > NOW() - INTERVAL '24 hours'
    )
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      job_record.tasker_id,
      'job_reminder_24h',
      'Trabajo mañana',
      'Tienes ' || job_record.title || ' con ' || job_record.customer_name || ' mañana',
      '/provider-portal/calendar'
    );
  END LOOP;
  
  -- Create 1-hour reminders
  FOR job_record IN
    SELECT b.id, b.tasker_id, b.title, b.scheduled_date, p.full_name as customer_name
    FROM bookings b
    JOIN profiles p ON b.customer_id = p.user_id
    WHERE b.status IN ('confirmed', 'pending')
    AND b.scheduled_date > NOW()
    AND b.scheduled_date <= NOW() + INTERVAL '70 minutes'
    AND b.scheduled_date >= NOW() + INTERVAL '50 minutes'
    AND NOT EXISTS (
      SELECT 1 FROM notifications 
      WHERE user_id = b.tasker_id 
      AND type = 'job_reminder_1h'
      AND link LIKE '%' || b.id || '%'
      AND created_at > NOW() - INTERVAL '1 hour'
    )
  LOOP
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      job_record.tasker_id,
      'job_reminder_1h',
      'Trabajo en 1 hora',
      'Tu trabajo con ' || job_record.customer_name || ' comienza pronto',
      '/provider-portal/jobs'
    );
  END LOOP;
END;
$$;