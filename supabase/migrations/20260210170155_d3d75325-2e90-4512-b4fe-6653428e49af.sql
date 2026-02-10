
-- Drop old check constraint and add updated one with searching/unassigned states
ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check CHECK (
  status = ANY (ARRAY[
    'pending', 'active', 'searching', 'assigned', 'accepted', 'confirmed',
    'en_route', 'on_site', 'quoted', 'in_progress',
    'completed', 'cancelled', 'archived', 'unassigned'
  ])
);

-- Add assignment_deadline column (configurable window for provider matching)
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS assignment_deadline timestamptz;

-- Update existing paid active jobs without provider to 'searching' state
-- so they use the new flow going forward
UPDATE public.jobs
SET status = 'searching',
    assignment_deadline = now() + interval '4 hours',
    updated_at = now()
WHERE status = 'active'
  AND provider_id IS NULL
  AND visit_fee_paid = true;
