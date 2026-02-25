ALTER TABLE public.invoices
  ADD COLUMN revision_number integer NOT NULL DEFAULT 1,
  ADD COLUMN parent_invoice_id uuid REFERENCES public.invoices(id);