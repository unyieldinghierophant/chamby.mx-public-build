CREATE OR REPLACE FUNCTION public.fn_sync_visit_fee()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.type IN ('visit_fee', 'visit_fee_authorization') THEN
    IF NEW.status = 'succeeded' THEN
      UPDATE public.jobs
      SET visit_fee_paid = true, updated_at = now()
      WHERE id = NEW.job_id;
    ELSIF NEW.status IN ('refunded', 'failed', 'canceled') THEN
      UPDATE public.jobs
      SET visit_fee_paid = false, updated_at = now()
      WHERE id = NEW.job_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_visit_fee_to_jobs
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_sync_visit_fee();