-- Additional FK rules discovered while cleaning test accounts. Without
-- these, deleting a user's auth.users row fails midway through the cascade
-- because children of jobs/invoices have no ON DELETE rule and block.

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_job_id_fkey,
  ADD CONSTRAINT payments_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE public.payments
  DROP CONSTRAINT IF EXISTS payments_provider_id_fkey,
  ADD CONSTRAINT payments_provider_id_fkey
    FOREIGN KEY (provider_id) REFERENCES public.providers(user_id) ON DELETE SET NULL;

ALTER TABLE public.payouts
  DROP CONSTRAINT IF EXISTS payouts_job_id_fkey,
  ADD CONSTRAINT payouts_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE public.refund_requests
  DROP CONSTRAINT IF EXISTS refund_requests_job_id_fkey,
  ADD CONSTRAINT refund_requests_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE public.reviews
  DROP CONSTRAINT IF EXISTS reviews_job_id_fkey,
  ADD CONSTRAINT reviews_job_id_fkey
    FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE;

ALTER TABLE public.disputes
  DROP CONSTRAINT IF EXISTS disputes_invoice_id_fkey,
  ADD CONSTRAINT disputes_invoice_id_fkey
    FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

ALTER TABLE public.invoices
  DROP CONSTRAINT IF EXISTS invoices_parent_invoice_id_fkey,
  ADD CONSTRAINT invoices_parent_invoice_id_fkey
    FOREIGN KEY (parent_invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;

ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_followup_invoice_id_fkey,
  ADD CONSTRAINT jobs_followup_invoice_id_fkey
    FOREIGN KEY (followup_invoice_id) REFERENCES public.invoices(id) ON DELETE SET NULL;


-- Also: remove the storage purge from the delete trigger — Supabase's
-- storage.protect_delete() blocks direct DELETE FROM storage.objects.
-- Orphaned avatars/docs should be cleaned up via an edge function using
-- the Storage API.
CREATE OR REPLACE FUNCTION public.prevent_delete_with_active_work()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  active_job_count integer;
  open_dispute_count integer;
BEGIN
  SELECT COUNT(*) INTO active_job_count
  FROM public.jobs
  WHERE (client_id = OLD.id OR provider_id = OLD.id)
    AND status NOT IN ('completed', 'cancelled', 'quote_rejected', 'draft');
  IF active_job_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete account: % active job(s) in progress. Complete or cancel them first.',
      active_job_count USING ERRCODE = 'restrict_violation';
  END IF;

  SELECT COUNT(*) INTO open_dispute_count
  FROM public.disputes d
  JOIN public.jobs j ON j.id = d.job_id
  WHERE d.status = 'open'
    AND (j.client_id = OLD.id OR j.provider_id = OLD.id);
  IF open_dispute_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete account: % open dispute(s). Resolve them first.',
      open_dispute_count USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN OLD;
END;
$$;
