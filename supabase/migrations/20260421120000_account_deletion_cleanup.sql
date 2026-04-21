-- Part A: fix FK rules so deleting an auth.users row cleanly cascades /
--          nulls instead of being blocked by the default NO ACTION.

-- jobs.client_id → cascade (wipe jobs when client deletes account)
ALTER TABLE public.jobs
  DROP CONSTRAINT IF EXISTS jobs_client_id_fkey;
ALTER TABLE public.jobs
  ADD CONSTRAINT jobs_client_id_fkey
  FOREIGN KEY (client_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- documents.reviewed_by → keep doc, null reviewer
ALTER TABLE public.documents
  DROP CONSTRAINT IF EXISTS documents_reviewed_by_fkey;
ALTER TABLE public.documents
  ADD CONSTRAINT documents_reviewed_by_fkey
  FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;


-- Part B: block deletion of a user while they have an active job
--          or an open dispute. Fires on public.users BEFORE DELETE,
--          which is triggered by the cascade from auth.users too,
--          so it covers every delete path (dashboard, edge function,
--          profile UI).

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
      active_job_count
      USING ERRCODE = 'restrict_violation';
  END IF;

  SELECT COUNT(*) INTO open_dispute_count
  FROM public.disputes d
  JOIN public.jobs j ON j.id = d.job_id
  WHERE d.status = 'open'
    AND (j.client_id = OLD.id OR j.provider_id = OLD.id);

  IF open_dispute_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete account: % open dispute(s). Resolve them first.',
      open_dispute_count
      USING ERRCODE = 'restrict_violation';
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS prevent_delete_with_active_work ON public.users;
CREATE TRIGGER prevent_delete_with_active_work
  BEFORE DELETE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_delete_with_active_work();
