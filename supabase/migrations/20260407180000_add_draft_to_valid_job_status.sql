-- Fix: Add 'draft' to the valid_job_status CHECK constraint.
-- Migration 20260304234621 added this constraint without 'draft'.
-- Migration 20260407174703 updated the RLS INSERT policy to allow 'draft'
-- but forgot to also update the CHECK constraint.
-- Without this fix, the stripe-webhook edge function cannot update a
-- draft → searching transition because the UPDATE would violate the constraint.

ALTER TABLE public.jobs DROP CONSTRAINT IF EXISTS valid_job_status;

ALTER TABLE public.jobs ADD CONSTRAINT valid_job_status CHECK (
  status IN (
    'draft', 'pending', 'searching', 'assigned', 'on_site',
    'quoted', 'quote_accepted', 'quote_rejected', 'job_paid',
    'in_progress', 'provider_done', 'completed', 'cancelled',
    'disputed', 'no_match'
  )
);
