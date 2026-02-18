
-- Trigger function: prevent setting verification_status='verified' unless
-- the 3 canonical documents exist in the documents table.
CREATE OR REPLACE FUNCTION public.enforce_verified_has_docs()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  has_face_photo boolean;
  has_ine boolean;
  has_criminal boolean;
  missing text[];
BEGIN
  -- Only fire when verification_status is being set to 'verified'
  IF NEW.verification_status = 'verified' AND
     (OLD.verification_status IS DISTINCT FROM 'verified') THEN

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type = 'face_photo'
    ) INTO has_face_photo;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('id_card', 'id_front')
    ) INTO has_ine;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type = 'criminal_record'
    ) INTO has_criminal;

    missing := ARRAY[]::text[];
    IF NOT has_face_photo THEN missing := missing || 'Foto del rostro'; END IF;
    IF NOT has_ine THEN missing := missing || 'INE/ID'; END IF;
    IF NOT has_criminal THEN missing := missing || 'Carta de antecedentes'; END IF;

    IF array_length(missing, 1) > 0 THEN
      RAISE EXCEPTION 'Cannot verify provider: missing documents — %', array_to_string(missing, ', ');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to provider_details
CREATE TRIGGER enforce_verified_docs_check
BEFORE UPDATE ON public.provider_details
FOR EACH ROW
EXECUTE FUNCTION public.enforce_verified_has_docs();
