-- Add onboarding tracking columns to providers table
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS onboarding_complete boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_step text DEFAULT 'auth';
