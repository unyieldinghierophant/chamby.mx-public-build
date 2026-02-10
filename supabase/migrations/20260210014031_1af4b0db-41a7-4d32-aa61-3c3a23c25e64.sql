
-- Add bidirectional review support
-- Add tags and reviewer_role to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS reviewer_role text NOT NULL DEFAULT 'client',
ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES public.jobs(id),
ADD COLUMN IF NOT EXISTS visible_at timestamp with time zone;

-- Add unique constraint: one review per job per reviewer role
ALTER TABLE public.reviews 
ADD CONSTRAINT reviews_job_reviewer_unique UNIQUE (job_id, reviewer_role);

-- Allow clients and providers to insert reviews (currently blocked)
CREATE POLICY "Clients can create reviews for completed jobs"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = client_id 
  AND reviewer_role = 'client'
  AND EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = reviews.job_id 
    AND jobs.status = 'completed'
    AND jobs.client_id = auth.uid()
  )
);

CREATE POLICY "Providers can create reviews for completed jobs"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = provider_id 
  AND reviewer_role = 'provider'
  AND EXISTS (
    SELECT 1 FROM public.jobs 
    WHERE jobs.id = reviews.job_id 
    AND jobs.status = 'completed'
    AND jobs.provider_id = auth.uid()
  )
);

-- Allow admins to view all reviews
CREATE POLICY "Admins can view all reviews"
ON public.reviews
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Update the existing trigger to also handle provider ratings from client reviews
-- (The existing update_provider_rating trigger already handles this)

COMMENT ON COLUMN public.reviews.reviewer_role IS 'client = client reviewing provider, provider = provider reviewing client';
COMMENT ON COLUMN public.reviews.tags IS 'Quick tags like Puntual, Profesional, Limpio, etc.';
COMMENT ON COLUMN public.reviews.visible_at IS 'When this review becomes visible to the reviewed party (after both rate or 7 days)';
