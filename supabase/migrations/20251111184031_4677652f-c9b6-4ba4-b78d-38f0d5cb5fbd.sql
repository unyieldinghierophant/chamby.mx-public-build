-- Add payment and escrow tracking columns to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
ADD COLUMN IF NOT EXISTS stripe_invoice_id text,
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS escrow_captured boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS escrow_refunded boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS provider_visited boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS amount_booking_fee numeric DEFAULT 250,
ADD COLUMN IF NOT EXISTS amount_service_total numeric;

-- Add index for faster payment intent lookups
CREATE INDEX IF NOT EXISTS idx_jobs_payment_intent ON jobs(stripe_payment_intent_id);

-- Add index for payment status filtering
CREATE INDEX IF NOT EXISTS idx_jobs_payment_status ON jobs(payment_status);

-- Add comment to document payment_status values
COMMENT ON COLUMN jobs.payment_status IS 'Payment status: pending, authorized, escrow_captured, invoice_paid, cancelled, payment_failed';