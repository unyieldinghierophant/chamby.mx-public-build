-- Remove the anonymous upload policy on job-photos
DROP POLICY IF EXISTS "Allow anonymous uploads to temp folder" ON storage.objects;

-- Remove the anonymous read policy if it exists  
DROP POLICY IF EXISTS "Allow anonymous reads from temp folder" ON storage.objects;

-- Ensure authenticated users can still upload to job-photos
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage'
    AND policyname = 'Authenticated users can upload job photos'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Authenticated users can upload job photos"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'job-photos')
    $policy$;
  END IF;
END $$;