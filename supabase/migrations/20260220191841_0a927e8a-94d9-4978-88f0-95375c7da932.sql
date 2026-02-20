
-- 1. Add stripe_onboarding_status to providers
ALTER TABLE public.providers
  ADD COLUMN IF NOT EXISTS stripe_onboarding_status text NOT NULL DEFAULT 'not_started';

-- 2. Create payments table (ledger of all Stripe payment intents)
CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id uuid NOT NULL REFERENCES public.jobs(id),
  provider_id uuid REFERENCES public.providers(user_id),
  stripe_payment_intent_id text,
  stripe_checkout_session_id text,
  amount integer NOT NULL, -- centavos
  currency text NOT NULL DEFAULT 'mxn',
  type text NOT NULL CHECK (type IN ('visit_fee', 'job_invoice')),
  status text NOT NULL DEFAULT 'pending',
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS: clients see payments for their jobs
CREATE POLICY "Clients can view their payments"
  ON public.payments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.jobs WHERE jobs.id = payments.job_id AND jobs.client_id = auth.uid()
  ));

-- RLS: providers see payments for their jobs
CREATE POLICY "Providers can view their payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = provider_id);

-- RLS: admins see all
CREATE POLICY "Admins can view all payments"
  ON public.payments FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Add stripe_transfer_id to payouts
ALTER TABLE public.payouts
  ADD COLUMN IF NOT EXISTS stripe_transfer_id text;

-- 4. Updated_at trigger for payments
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
