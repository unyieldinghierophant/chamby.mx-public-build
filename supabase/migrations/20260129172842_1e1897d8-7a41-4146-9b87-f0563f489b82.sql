-- Drop the problematic trigger that references non-existent 'profiles' table
DROP TRIGGER IF EXISTS update_profile_on_document_insert ON documents;

-- Update the function to use the correct tables (providers/provider_details instead of profiles)
CREATE OR REPLACE FUNCTION public.update_profile_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update provider_details when document is uploaded
  UPDATE provider_details 
  SET 
    updated_at = now(),
    verification_status = CASE 
      WHEN verification_status = 'none' THEN 'pending'
      ELSE verification_status
    END
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$function$;