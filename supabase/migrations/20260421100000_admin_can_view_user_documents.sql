-- Allow admins to read provider documents from the user-documents bucket.
-- Without this policy, createSignedUrl() fails for admins because the
-- existing SELECT policy only matches when the caller owns the folder,
-- so the "Ver" button in AdminProvidersPage silently returns no URL.

DROP POLICY IF EXISTS "Admins can view all user documents" ON storage.objects;
CREATE POLICY "Admins can view all user documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-documents'
  AND public.is_admin(auth.uid())
);
