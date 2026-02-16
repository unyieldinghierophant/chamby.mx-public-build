
-- Phase A: Add document URL fields to provider_details as single source of truth
ALTER TABLE public.provider_details
  ADD COLUMN IF NOT EXISTS ine_front_url text,
  ADD COLUMN IF NOT EXISTS ine_back_url text,
  ADD COLUMN IF NOT EXISTS selfie_url text,
  ADD COLUMN IF NOT EXISTS selfie_with_id_url text;

-- Backfill from existing documents table where possible
UPDATE public.provider_details pd
SET ine_front_url = (
  SELECT d.file_url FROM public.documents d 
  WHERE d.provider_id = pd.user_id AND d.doc_type = 'ine_front' 
  ORDER BY d.uploaded_at DESC LIMIT 1
)
WHERE pd.ine_front_url IS NULL;

UPDATE public.provider_details pd
SET ine_back_url = (
  SELECT d.file_url FROM public.documents d 
  WHERE d.provider_id = pd.user_id AND d.doc_type = 'ine_back' 
  ORDER BY d.uploaded_at DESC LIMIT 1
)
WHERE pd.ine_back_url IS NULL;

UPDATE public.provider_details pd
SET selfie_url = (
  SELECT d.file_url FROM public.documents d 
  WHERE d.provider_id = pd.user_id AND d.doc_type = 'selfie' 
  ORDER BY d.uploaded_at DESC LIMIT 1
)
WHERE pd.selfie_url IS NULL;

UPDATE public.provider_details pd
SET selfie_with_id_url = (
  SELECT d.file_url FROM public.documents d 
  WHERE d.provider_id = pd.user_id AND d.doc_type = 'selfie_with_id' 
  ORDER BY d.uploaded_at DESC LIMIT 1
)
WHERE pd.selfie_with_id_url IS NULL;
