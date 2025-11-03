-- Add payment schedule column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payment_schedule TEXT DEFAULT 'every_3_days';

-- Create provider payment methods table
CREATE TABLE IF NOT EXISTS provider_payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  bank_name TEXT NOT NULL,
  account_number TEXT NOT NULL,
  clabe TEXT,
  account_holder_name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE provider_payment_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for provider_payment_methods
CREATE POLICY "Providers can view their own payment methods"
ON provider_payment_methods FOR SELECT
TO authenticated
USING (provider_id = auth.uid());

CREATE POLICY "Providers can insert their own payment methods"
ON provider_payment_methods FOR INSERT
TO authenticated
WITH CHECK (provider_id = auth.uid());

CREATE POLICY "Providers can update their own payment methods"
ON provider_payment_methods FOR UPDATE
TO authenticated
USING (provider_id = auth.uid());

CREATE POLICY "Providers can delete their own payment methods"
ON provider_payment_methods FOR DELETE
TO authenticated
USING (provider_id = auth.uid());

-- Add trigger for updated_at
CREATE OR REPLACE TRIGGER update_provider_payment_methods_updated_at
BEFORE UPDATE ON provider_payment_methods
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();