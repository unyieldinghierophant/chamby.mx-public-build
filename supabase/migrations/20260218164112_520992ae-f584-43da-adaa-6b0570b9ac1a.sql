
-- Trigger: prevent provider_id from changing once set (only NULL→value allowed)
CREATE OR REPLACE FUNCTION public.prevent_provider_id_reassignment()
RETURNS TRIGGER AS $$
BEGIN
  -- Allow if provider_id was NULL and is being set
  IF OLD.provider_id IS NOT NULL AND NEW.provider_id IS DISTINCT FROM OLD.provider_id THEN
    RAISE EXCEPTION 'provider_id cannot be changed once assigned (current: %, attempted: %)', OLD.provider_id, NEW.provider_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Drop if exists to be idempotent
DROP TRIGGER IF EXISTS enforce_provider_id_immutability ON public.jobs;

CREATE TRIGGER enforce_provider_id_immutability
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  WHEN (OLD.provider_id IS NOT NULL)
  EXECUTE FUNCTION public.prevent_provider_id_reassignment();
