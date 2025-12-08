-- Update visit_fee_amount default from 250 to 350
ALTER TABLE public.jobs 
ALTER COLUMN visit_fee_amount SET DEFAULT 350;

-- Update existing records that still have the old default
UPDATE public.jobs 
SET visit_fee_amount = 350 
WHERE visit_fee_amount = 250 OR visit_fee_amount IS NULL;