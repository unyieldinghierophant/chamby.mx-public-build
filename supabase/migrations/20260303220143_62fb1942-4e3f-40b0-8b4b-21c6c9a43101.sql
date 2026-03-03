
ALTER TABLE public.provider_details
ADD COLUMN IF NOT EXISTS interview_completed boolean NOT NULL DEFAULT false;
