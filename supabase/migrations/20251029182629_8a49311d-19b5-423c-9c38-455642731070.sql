-- Allow anonymous uploads to temp-uploads folder in job-photos bucket
CREATE POLICY "Allow anonymous uploads to temp folder"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'job-photos' AND
  (storage.foldername(name))[1] = 'temp-uploads'
);

-- Allow anonymous users to read their temp uploads
CREATE POLICY "Allow anonymous read temp uploads"
ON storage.objects
FOR SELECT
TO anon
USING (
  bucket_id = 'job-photos' AND
  (storage.foldername(name))[1] = 'temp-uploads'
);