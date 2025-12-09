import { useState } from "react";
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
}

interface CreateInvoiceResult {
  success: boolean;
  already_exists?: boolean;
  invoice?: Invoice;
  invoice_items?: InvoiceItem[];
  payment_intent_client_secret?: string | null;
  error?: string;
}

interface LineItem {
  description: string;
  amount: number;
  quantity: number;
}

interface UseCreateInvoiceReturn {
  createInvoice: (
    jobId: string,
    lineItems: LineItem[],
    description?: string
  ) => Promise<CreateInvoiceResult>;
  getExistingInvoice: (jobId: string) => Promise<CreateInvoiceResult>;
  loading: boolean;
  error: string | null;
}

export const useCreateInvoice = (): UseCreateInvoiceReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvoice = async (
    jobId: string,
    lineItems: LineItem[],
    description?: string
  ): Promise<CreateInvoiceResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-or-get-invoice",
        {
          body: { jobId, lineItems, description },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return {
        success: data.success,
        already_exists: data.already_exists,
        invoice: data.invoice,
        invoice_items: data.invoice_items,
        payment_intent_client_secret: data.payment_intent_client_secret,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  const getExistingInvoice = async (jobId: string): Promise<CreateInvoiceResult> => {
    setLoading(true);
    setError(null);

    try {
      // Call with empty lineItems to just retrieve existing invoice
      const { data, error: invokeError } = await supabase.functions.invoke(
        "create-or-get-invoice",
        {
          body: { jobId, lineItems: [] },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      // If error says lineItems required, no invoice exists
      if (data?.error?.includes("lineItems are required")) {
        return {
          success: true,
          already_exists: false,
          invoice: undefined,
          invoice_items: [],
          payment_intent_client_secret: null,
        };
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return {
        success: data.success,
        already_exists: data.already_exists,
        invoice: data.invoice,
        invoice_items: data.invoice_items,
        payment_intent_client_secret: data.payment_intent_client_secret,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      // Don't set error if it's just "lineItems required" - means no invoice exists
      if (!errorMessage.includes("lineItems are required")) {
        setError(errorMessage);
      }
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    createInvoice,
    getExistingInvoice,
    loading,
    error,
  };
};
