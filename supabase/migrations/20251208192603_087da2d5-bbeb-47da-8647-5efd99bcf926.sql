
-- =====================================================
-- SAFE PAYMENT SCHEMA EXTENSION
-- Only adds missing columns and new tables
-- Does NOT modify any existing columns or structures
-- =====================================================

-- 1. Add stripe_customer_id to users (if not exists)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS stripe_customer_id text;

-- 2. Add stripe_account_id to providers (if not exists)
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS stripe_account_id text;

-- 3. Add payment columns to jobs (if not exists)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS visit_fee_amount integer DEFAULT 250;

ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS stripe_visit_payment_intent_id text;

-- 4. Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL,
  user_id uuid NOT NULL,
  subtotal_provider numeric NOT NULL DEFAULT 0,
  chamby_commission_amount numeric NOT NULL DEFAULT 0,
  total_customer_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'draft',
  provider_notes text,
  stripe_payment_intent_id text,
  pdf_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'pending_payment', 'paid', 'failed'))
);

-- 5. Create invoice_items table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

-- 6. Enable RLS on new tables
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for invoices
CREATE POLICY "Providers can view their own invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = provider_id);

CREATE POLICY "Providers can create invoices for their jobs"
ON public.invoices FOR INSERT
WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their own invoices"
ON public.invoices FOR UPDATE
USING (auth.uid() = provider_id);

CREATE POLICY "Clients can view their invoices"
ON public.invoices FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices"
ON public.invoices FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all invoices"
ON public.invoices FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- 8. RLS Policies for invoice_items
CREATE POLICY "Users can view invoice items for their invoices"
ON public.invoice_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND (invoices.provider_id = auth.uid() OR invoices.user_id = auth.uid())
  )
);

CREATE POLICY "Providers can create invoice items"
ON public.invoice_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.provider_id = auth.uid()
  )
);

CREATE POLICY "Providers can update their invoice items"
ON public.invoice_items FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.provider_id = auth.uid()
  )
);

CREATE POLICY "Providers can delete their invoice items"
ON public.invoice_items FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.invoices 
    WHERE invoices.id = invoice_items.invoice_id 
    AND invoices.provider_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all invoice items"
ON public.invoice_items FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- 9. Add updated_at trigger for invoices
CREATE TRIGGER update_invoices_updated_at
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_invoices_job_id ON public.invoices(job_id);
CREATE INDEX IF NOT EXISTS idx_invoices_provider_id ON public.invoices(provider_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);
