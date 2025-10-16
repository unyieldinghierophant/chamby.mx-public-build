-- Make public storage buckets private for better security
UPDATE storage.buckets 
SET public = false 
WHERE name IN ('avatars', 'job-photos', 'provider-photos', 'service-requests');

-- Update RLS policies to allow authenticated access
-- Note: Existing policies already properly restrict INSERT/UPDATE/DELETE to owners
-- We just need to ensure SELECT policies work with private buckets