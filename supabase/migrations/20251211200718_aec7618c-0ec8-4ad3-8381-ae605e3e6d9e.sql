-- Add double confirmation fields to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS provider_confirmed_visit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS client_confirmed_visit boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS visit_confirmation_deadline timestamp with time zone,
ADD COLUMN IF NOT EXISTS visit_dispute_status text DEFAULT null,
ADD COLUMN IF NOT EXISTS visit_dispute_reason text DEFAULT null;

-- Add comment for documentation
COMMENT ON COLUMN public.jobs.provider_confirmed_visit IS 'Provider confirms they completed the visit';
COMMENT ON COLUMN public.jobs.client_confirmed_visit IS 'Client confirms they are satisfied with the visit';
COMMENT ON COLUMN public.jobs.visit_confirmation_deadline IS 'Deadline for client to confirm (48h after provider confirmation)';
COMMENT ON COLUMN public.jobs.visit_dispute_status IS 'Dispute status: pending_support, resolved_provider, resolved_client';
COMMENT ON COLUMN public.jobs.visit_dispute_reason IS 'Reason provided by client for dispute';