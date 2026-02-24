
CREATE OR REPLACE FUNCTION public.fn_sync_verification_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.providers
  SET verified = (NEW.verification_status = 'verified'),
      updated_at = now()
  WHERE user_id = NEW.user_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER sync_verification_status_to_providers
AFTER INSERT OR UPDATE OF verification_status
ON public.provider_details
FOR EACH ROW
EXECUTE FUNCTION public.fn_sync_verification_status();
