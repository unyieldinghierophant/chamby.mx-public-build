-- Add unique constraint to prevent duplicate role assignments
ALTER TABLE user_roles
ADD CONSTRAINT user_roles_unique_pair UNIQUE (user_id, role);

-- Create function to auto-assign provider role when profile is marked as tasker
CREATE OR REPLACE FUNCTION ensure_provider_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When a profile is marked as tasker, ensure they have the provider role
  IF NEW.is_tasker = true THEN
    INSERT INTO user_roles (user_id, role)
    VALUES (NEW.user_id, 'provider'::app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END $$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS trg_provider_role ON profiles;

-- Create trigger on profiles table (since provider_profiles doesn't exist)
CREATE TRIGGER trg_provider_role
AFTER INSERT OR UPDATE OF is_tasker ON profiles
FOR EACH ROW 
WHEN (NEW.is_tasker = true)
EXECUTE FUNCTION ensure_provider_role();