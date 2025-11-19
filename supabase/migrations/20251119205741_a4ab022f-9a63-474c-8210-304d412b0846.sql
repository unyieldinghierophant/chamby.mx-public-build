-- Option A: simple cleanup, no historical migration from job_requests

-- 1) Remove broken trigger/function that depend on missing job_notifications
DROP TRIGGER IF EXISTS on_job_status_change ON jobs;
DROP FUNCTION IF EXISTS notify_providers_new_job() CASCADE;

-- 2) Add any extra fields we want to keep on jobs (for future use)
ALTER TABLE jobs 
  ADD COLUMN IF NOT EXISTS time_preference text,
  ADD COLUMN IF NOT EXISTS exact_time text,
  ADD COLUMN IF NOT EXISTS budget text,
  ADD COLUMN IF NOT EXISTS photo_count integer DEFAULT 0;

-- 3) Detach photo_short_links from job_requests (we'll rely on job_id only going forward)
ALTER TABLE photo_short_links DROP COLUMN IF EXISTS job_request_id;

-- 4) Drop legacy job_requests table
DROP TABLE IF EXISTS job_requests CASCADE;