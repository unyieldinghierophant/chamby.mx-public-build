-- Step 1: Fix the foreign key in messages table
ALTER TABLE messages 
DROP CONSTRAINT IF EXISTS messages_job_id_fkey;

ALTER TABLE messages 
ADD CONSTRAINT messages_job_id_fkey 
FOREIGN KEY (job_id) 
REFERENCES jobs(id) 
ON DELETE CASCADE;

-- Step 2: Drop the old backup table
DROP TABLE IF EXISTS jobs_old_backup CASCADE;

-- Step 3: Populate provider_details for existing providers
INSERT INTO provider_details (user_id)
SELECT user_id FROM user_roles WHERE role = 'provider'
ON CONFLICT (user_id) DO NOTHING;

-- Step 4: Create function to automatically create provider_details
CREATE OR REPLACE FUNCTION ensure_provider_details()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'provider' THEN
    INSERT INTO provider_details (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Step 5: Create trigger
DROP TRIGGER IF EXISTS ensure_provider_details_trigger ON user_roles;
CREATE TRIGGER ensure_provider_details_trigger
AFTER INSERT ON user_roles
FOR EACH ROW
EXECUTE FUNCTION ensure_provider_details();