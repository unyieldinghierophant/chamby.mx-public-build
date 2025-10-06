-- Add new columns to jobs table for the service request flow
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS client_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS service_type text,
ADD COLUMN IF NOT EXISTS problem text,
ADD COLUMN IF NOT EXISTS photos text[],
ADD COLUMN IF NOT EXISTS location text,
ADD COLUMN IF NOT EXISTS urgent boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS scheduled_at timestamptz,
ADD COLUMN IF NOT EXISTS visit_fee_paid boolean DEFAULT false;

-- Create storage bucket for job photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-photos', 'job-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for job-photos bucket
CREATE POLICY "Authenticated users can upload job photos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'job-photos');

CREATE POLICY "Anyone can view job photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'job-photos');

CREATE POLICY "Users can update their own job photos"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'job-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own job photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'job-photos' AND auth.uid()::text = (storage.foldername(name))[1]);