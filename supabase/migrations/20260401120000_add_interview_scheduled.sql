-- Add interview_scheduled flag to provider_details
-- Tracks when a provider self-reports having scheduled their Calendly interview.
-- Distinct from interview_completed, which is set by admin after the interview occurs.
ALTER TABLE provider_details
  ADD COLUMN IF NOT EXISTS interview_scheduled boolean NOT NULL DEFAULT false;
