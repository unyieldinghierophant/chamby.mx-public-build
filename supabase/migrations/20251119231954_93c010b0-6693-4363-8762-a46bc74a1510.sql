-- Consolidate services into jobs table

-- 1) Drop foreign key from bookings to services table
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS bookings_service_id_fkey;

-- 2) Since service_id should reference a job, add FK to jobs table
-- (service_id in bookings should point to the job that was booked)
ALTER TABLE bookings 
  ADD CONSTRAINT bookings_service_id_fkey 
  FOREIGN KEY (service_id) 
  REFERENCES jobs(id) 
  ON DELETE CASCADE;

-- 3) Drop the services table (it's redundant - jobs table handles everything)
DROP TABLE IF EXISTS services CASCADE;

-- 4) Drop service_requests table if it still exists (also redundant)
DROP TABLE IF EXISTS service_requests CASCADE;