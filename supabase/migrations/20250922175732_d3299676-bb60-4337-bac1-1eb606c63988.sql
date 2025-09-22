-- Fix security warning by setting search_path for the function
CREATE OR REPLACE FUNCTION update_profile_verification()
RETURNS TRIGGER AS $$
BEGIN
  -- When a document is inserted for a tasker, we can check if all required docs are uploaded
  UPDATE profiles 
  SET updated_at = now()
  WHERE user_id = (SELECT user_id FROM profiles WHERE id = NEW.client_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;