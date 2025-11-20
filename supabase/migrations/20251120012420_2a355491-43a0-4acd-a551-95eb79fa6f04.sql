-- Add missing fields from bookings to jobs table
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS duration_hours integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS total_amount numeric,
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES profiles(user_id),
ADD COLUMN IF NOT EXISTS tasker_id uuid REFERENCES profiles(user_id),
ADD COLUMN IF NOT EXISTS reschedule_requested_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS reschedule_requested_date timestamp with time zone,
ADD COLUMN IF NOT EXISTS reschedule_response_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS original_scheduled_date timestamp with time zone;

-- Update foreign key on messages to reference jobs instead of bookings
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_job_id_fkey;
ALTER TABLE messages ADD CONSTRAINT messages_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- Update foreign key on payments to reference jobs instead of bookings
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_job_id_fkey;
ALTER TABLE payments ADD CONSTRAINT payments_job_id_fkey 
  FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE;

-- Drop booking_reschedules table (reschedule info now in jobs)
DROP TABLE IF EXISTS booking_reschedules CASCADE;

-- Drop bookings table
DROP TABLE IF EXISTS bookings CASCADE;

-- Add indexes for the new foreign keys
CREATE INDEX IF NOT EXISTS idx_jobs_customer_id ON jobs(customer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_tasker_id ON jobs(tasker_id);