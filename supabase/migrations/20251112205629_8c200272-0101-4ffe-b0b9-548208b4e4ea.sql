-- Make provider_id nullable in jobs table to allow job creation before provider assignment
ALTER TABLE jobs 
ALTER COLUMN provider_id DROP NOT NULL;

-- Add a comment to document this change
COMMENT ON COLUMN jobs.provider_id IS 'Provider assigned to the job. Can be null initially until a provider accepts the job.';