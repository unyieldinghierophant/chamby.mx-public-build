-- One-time backfill: fix completion_status for jobs completed before complete-job edge function was deployed
-- Affects 3 rows: f066137b, 7cd67795, 64dcf121

UPDATE public.jobs
SET completion_status = 'completed',
    updated_at = now()
WHERE status = 'completed'
  AND completion_status != 'completed';
