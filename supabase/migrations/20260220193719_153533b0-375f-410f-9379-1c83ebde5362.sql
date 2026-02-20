
-- Add completion handshake columns to jobs table
ALTER TABLE public.jobs 
  ADD COLUMN IF NOT EXISTS completion_status text NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS completion_marked_at timestamptz,
  ADD COLUMN IF NOT EXISTS completion_confirmed_at timestamptz;

-- Add constraint for valid completion_status values
ALTER TABLE public.jobs 
  ADD CONSTRAINT jobs_completion_status_check 
  CHECK (completion_status IN ('in_progress', 'provider_marked_done', 'completed', 'auto_completed'));
