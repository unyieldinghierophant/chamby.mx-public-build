
CREATE OR REPLACE FUNCTION public.enforce_verified_has_docs()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  has_ine_front boolean;
  has_ine_back boolean;
  has_selfie boolean;
  has_selfie_with_id boolean;
  has_proof_of_address boolean;
  missing text[];
BEGIN
  -- Only fire when verification_status is being set to 'verified'
  IF NEW.verification_status = 'verified' AND
     (OLD.verification_status IS DISTINCT FROM 'verified') THEN

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('ine_front', 'id_front', 'id_card')
    ) INTO has_ine_front;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('ine_back', 'id_back')
    ) INTO has_ine_back;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('selfie', 'face_photo', 'face')
    ) INTO has_selfie;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('selfie_with_id', 'selfie_with_ine')
    ) INTO has_selfie_with_id;

    SELECT EXISTS (
      SELECT 1 FROM documents
      WHERE provider_id = NEW.user_id AND doc_type IN ('proof_of_address', 'comprobante_domicilio')
    ) INTO has_proof_of_address;

    missing := ARRAY[]::text[];
    IF NOT has_ine_front THEN missing := missing || 'INE Frente'; END IF;
    IF NOT has_ine_back THEN missing := missing || 'INE Reverso'; END IF;
    IF NOT has_selfie THEN missing := missing || 'Selfie'; END IF;
    IF NOT has_selfie_with_id THEN missing := missing || 'Selfie con INE'; END IF;
    IF NOT has_proof_of_address THEN missing := missing || 'Comprobante de Domicilio'; END IF;

    IF array_length(missing, 1) > 0 THEN
      RAISE EXCEPTION 'Cannot verify provider: missing documents — %', array_to_string(missing, ', ');
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;
