-- Rename client_id to provider_id in documents table
ALTER TABLE public.documents 
RENAME COLUMN client_id TO provider_id;

-- Update RLS policies to use auth.uid() directly
DROP POLICY IF EXISTS "Users can insert their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can update their own documents" ON public.documents;
DROP POLICY IF EXISTS "Users can view their own documents" ON public.documents;

CREATE POLICY "Users can insert their own documents"
ON public.documents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can update their own documents"
ON public.documents
FOR UPDATE
TO authenticated
USING (auth.uid() = provider_id)
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Users can view their own documents"
ON public.documents
FOR SELECT
TO authenticated
USING (auth.uid() = provider_id);