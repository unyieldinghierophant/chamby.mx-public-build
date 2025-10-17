-- Add missing DELETE policy for provider-photos
CREATE POLICY "Users can delete their own provider photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'provider-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add missing UPDATE policy for service-requests
CREATE POLICY "Users can update their own service request images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'service-requests' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add missing DELETE policy for service-requests
CREATE POLICY "Users can delete their own service request images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'service-requests' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Add missing DELETE policy for user-documents
CREATE POLICY "Users can delete their own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);