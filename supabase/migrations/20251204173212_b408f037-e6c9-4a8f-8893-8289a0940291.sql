-- Add new columns to documents table for review tracking
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS reviewed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Update provider_details verification_status to support more states
-- First, update any existing values to be compatible
UPDATE public.provider_details 
SET verification_status = 'pending' 
WHERE verification_status NOT IN ('none', 'pending', 'verified', 'rejected');

-- Add comment to clarify the status values
COMMENT ON COLUMN public.provider_details.verification_status IS 'Verification status: none (no docs), pending (awaiting review), verified (approved), rejected';

-- Add RLS policy for admins to update documents
CREATE POLICY "Admins can update document status"
ON public.documents
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to view all documents
CREATE POLICY "Admins can view all documents"
ON public.documents
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));