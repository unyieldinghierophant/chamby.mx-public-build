-- Add invoice tracking columns to jobs table
ALTER TABLE public.jobs
ADD COLUMN stripe_invoice_id text,
ADD COLUMN stripe_invoice_url text,
ADD COLUMN stripe_invoice_pdf text,
ADD COLUMN invoice_due_date timestamp with time zone;

-- Add index for faster invoice lookups
CREATE INDEX idx_jobs_stripe_invoice_id ON public.jobs(stripe_invoice_id);

-- Add comment for documentation
COMMENT ON COLUMN public.jobs.stripe_invoice_id IS 'Stripe invoice ID for visit fee ($250 MXN)';
COMMENT ON COLUMN public.jobs.stripe_invoice_url IS 'Stripe-hosted invoice page URL';
COMMENT ON COLUMN public.jobs.stripe_invoice_pdf IS 'PDF download URL for invoice';
COMMENT ON COLUMN public.jobs.invoice_due_date IS 'Invoice due date (set to immediate for visit fees)';