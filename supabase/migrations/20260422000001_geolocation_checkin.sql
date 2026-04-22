ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS job_address_lat       double precision,
  ADD COLUMN IF NOT EXISTS job_address_lng       double precision,
  ADD COLUMN IF NOT EXISTS arrived_lat           double precision,
  ADD COLUMN IF NOT EXISTS arrived_lng           double precision,
  ADD COLUMN IF NOT EXISTS arrived_at            timestamptz,
  ADD COLUMN IF NOT EXISTS geolocation_mismatch  boolean DEFAULT false;
