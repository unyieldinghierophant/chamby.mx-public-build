-- Part A: Update payouts table for flexible payout types
ALTER TABLE payouts ALTER COLUMN invoice_id DROP NOT NULL;

ALTER TABLE payouts ADD COLUMN IF NOT EXISTS job_id uuid REFERENCES jobs(id);

ALTER TABLE payouts ADD COLUMN IF NOT EXISTS payout_type text DEFAULT 'job_completion';
-- payout_type: 'job_completion' | 'visit_fee_settlement'