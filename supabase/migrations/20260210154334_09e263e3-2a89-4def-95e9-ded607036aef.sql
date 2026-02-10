
-- Drop old check constraint and add expanded one with all valid statuses
ALTER TABLE public.jobs DROP CONSTRAINT jobs_new_status_check;

ALTER TABLE public.jobs ADD CONSTRAINT jobs_status_check CHECK (
  status = ANY (ARRAY[
    'pending', 'active', 'assigned', 'accepted', 'confirmed',
    'en_route', 'on_site', 'quoted', 'in_progress',
    'completed', 'cancelled', 'archived'
  ])
);

-- Archive all unpaid active jobs with no provider (test/invalid jobs)
UPDATE public.jobs
SET status = 'archived', updated_at = now()
WHERE status = 'active'
  AND provider_id IS NULL
  AND (visit_fee_paid = false OR visit_fee_paid IS NULL);

-- Archive unpaid self-assigned test jobs
UPDATE public.jobs
SET status = 'archived', updated_at = now()
WHERE status IN ('active', 'assigned')
  AND client_id = provider_id
  AND (visit_fee_paid = false OR visit_fee_paid IS NULL);
