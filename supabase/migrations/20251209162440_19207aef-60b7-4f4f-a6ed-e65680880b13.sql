-- Create payouts table for manual provider payout tracking
CREATE TABLE public.payouts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.providers(user_id) ON DELETE CASCADE,
  amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  notes text,
  paid_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add constraint for valid status values
ALTER TABLE public.payouts ADD CONSTRAINT payouts_status_check 
  CHECK (status IN ('pending', 'paid', 'failed'));

-- Enable Row Level Security
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Providers can view their own payouts
CREATE POLICY "Providers can view their own payouts"
ON public.payouts
FOR SELECT
USING (auth.uid() = provider_id);

-- Admins can view all payouts
CREATE POLICY "Admins can view all payouts"
ON public.payouts
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert payouts
CREATE POLICY "Admins can insert payouts"
ON public.payouts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update payouts
CREATE POLICY "Admins can update payouts"
ON public.payouts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_payouts_updated_at
BEFORE UPDATE ON public.payouts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_payouts_provider_id ON public.payouts(provider_id);
CREATE INDEX idx_payouts_invoice_id ON public.payouts(invoice_id);
CREATE INDEX idx_payouts_status ON public.payouts(status);