ALTER TABLE invoices ADD COLUMN IF NOT EXISTS provider_payout_amount numeric DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_surcharge_amount numeric DEFAULT 0;