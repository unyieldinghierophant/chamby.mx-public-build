import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  unit_price: number;
  quantity: number;
  total: number;
  created_at: string;
}

interface Invoice {
  id: string;
  job_id: string;
  provider_id: string;
  user_id: string;
  subtotal_provider: number;
  chamby_commission_amount: number;
  total_customer_amount: number;
  status: string;
  provider_notes: string | null;
  stripe_payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Provider {
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface Job {
  title: string;
  category: string;
  location: string | null;
}

interface UseInvoiceReturn {
  invoice: Invoice | null;
  invoiceItems: InvoiceItem[];
  provider: Provider | null;
  job: Job | null;
  clientSecret: string | null;
  paymentIntentId: string | null;
  paymentIntentStatus: string | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useInvoice = (invoiceId: string | null): UseInvoiceReturn => {
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [paymentIntentStatus, setPaymentIntentStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvoice = async () => {
    if (!invoiceId) {
      setError("Invoice ID is required");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "get-invoice",
        {
          body: { invoiceId },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setInvoice(data.invoice);
      setInvoiceItems(data.invoice_items || []);
      setProvider(data.provider);
      setJob(data.job);
      setClientSecret(data.payment_intent_client_secret);
      setPaymentIntentId(data.payment_intent_id);
      setPaymentIntentStatus(data.payment_intent_status);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  return {
    invoice,
    invoiceItems,
    provider,
    job,
    clientSecret,
    paymentIntentId,
    paymentIntentStatus,
    loading,
    error,
    refetch: fetchInvoice,
  };
};
