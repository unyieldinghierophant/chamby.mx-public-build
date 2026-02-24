
CREATE OR REPLACE FUNCTION public.fn_sync_dispute_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  affected_job_id uuid;
  has_open boolean;
BEGIN
  affected_job_id := COALESCE(NEW.job_id, OLD.job_id);

  SELECT EXISTS(
    SELECT 1 FROM public.disputes
    WHERE job_id = affected_job_id AND status = 'open'
  ) INTO has_open;

  UPDATE public.jobs
  SET has_open_dispute = has_open,
      updated_at = now()
  WHERE id = affected_job_id;

  RETURN COALESCE(NEW, OLD);
END;
$$;

CREATE TRIGGER sync_dispute_status_to_jobs
AFTER INSERT OR UPDATE OR DELETE
ON public.disputes
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_dispute_status();
