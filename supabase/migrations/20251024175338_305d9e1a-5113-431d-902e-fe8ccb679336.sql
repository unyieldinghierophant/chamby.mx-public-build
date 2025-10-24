-- Add invoice tracking columns to job_requests table
ALTER TABLE public.job_requests
ADD COLUMN stripe_invoice_id text,
ADD COLUMN stripe_invoice_url text,
ADD COLUMN stripe_invoice_pdf text,
ADD COLUMN invoice_due_date timestamp with time zone;

-- Add index for faster invoice lookups
CREATE INDEX idx_job_requests_stripe_invoice_id ON public.job_requests(stripe_invoice_id);

-- Add comment for documentation
COMMENT ON COLUMN public.job_requests.stripe_invoice_id IS 'Stripe invoice ID for visit fee ($250 MXN)';
COMMENT ON COLUMN public.job_requests.stripe_invoice_url IS 'Stripe-hosted invoice page URL';
COMMENT ON COLUMN public.job_requests.stripe_invoice_pdf IS 'PDF download URL for invoice';
COMMENT ON COLUMN public.job_requests.invoice_due_date IS 'Invoice due date (set to immediate for visit fees)';