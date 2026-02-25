-- Drop the old restrictive CHECK constraint
ALTER TABLE public.invoices DROP CONSTRAINT invoices_status_check;

-- Recreate with all existing + new status values
ALTER TABLE public.invoices ADD CONSTRAINT invoices_status_check
  CHECK (status = ANY (ARRAY[
    -- Original values
    'draft'::text,
    'pending_payment'::text,
    'paid'::text,
    'failed'::text,
    -- Previously expected values
    'sent'::text,
    'accepted'::text,
    'rejected'::text,
    'ready_to_release'::text,
    'released'::text,
    -- New negotiation flow values
    'countered'::text,
    'expired'::text,
    'withdrawn'::text,
    'superseded'::text
  ]));