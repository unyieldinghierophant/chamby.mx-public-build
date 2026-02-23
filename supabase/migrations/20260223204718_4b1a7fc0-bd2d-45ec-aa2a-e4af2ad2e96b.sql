-- Add IVA/pricing columns to payments ledger
ALTER TABLE public.payments 
  ADD COLUMN IF NOT EXISTS base_amount_cents integer,
  ADD COLUMN IF NOT EXISTS vat_amount_cents integer,
  ADD COLUMN IF NOT EXISTS total_amount_cents integer,
  ADD COLUMN IF NOT EXISTS pricing_version text;

-- Add IVA columns to invoices
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS vat_rate numeric NOT NULL DEFAULT 0.16,
  ADD COLUMN IF NOT EXISTS vat_amount numeric NOT NULL DEFAULT 0;