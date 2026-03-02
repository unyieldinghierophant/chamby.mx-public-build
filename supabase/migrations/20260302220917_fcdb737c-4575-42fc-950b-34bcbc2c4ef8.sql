-- Fix: jobs.visit_fee_paid should default to false, not true
ALTER TABLE public.jobs ALTER COLUMN visit_fee_paid SET DEFAULT false;

-- Backfill: reset false positives (visit_fee_paid=true without a matching payment)
UPDATE public.jobs
SET visit_fee_paid = false
WHERE visit_fee_paid = true
  AND id NOT IN (
    SELECT job_id FROM public.payments
    WHERE type LIKE '%visit%' AND status = 'succeeded'
  );