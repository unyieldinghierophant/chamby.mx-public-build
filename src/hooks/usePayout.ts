import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  job_id: string;
  status: string;
  subtotal_provider: number;
  chamby_commission_amount: number;
  total_customer_amount: number;
  provider_notes: string | null;
  created_at: string;
  items: InvoiceItem[];
}

interface Job {
  id: string;
  title: string;
  category: string;
  description: string | null;
  location: string | null;
  status: string | null;
  client_id: string;
}

interface Provider {
  user_id: string;
  display_name: string | null;
  full_name: string;
  email: string | null;
  phone: string | null;
}

interface Client {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
}

interface Payout {
  id: string;
  invoice_id: string;
  provider_id: string;
  amount: number;
  status: string;
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
}

interface PayoutDetail {
  payout: Payout;
  invoice: Invoice | null;
  job: Job | null;
  provider: Provider | null;
  client: Client | null;
  isAdmin: boolean;
}

export const usePayout = (payoutId: string | undefined) => {
  const { user } = useAuth();
  const [data, setData] = useState<PayoutDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayout = useCallback(async () => {
    if (!user || !payoutId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: response, error: fnError } = await supabase.functions.invoke('get-payout', {
        body: { payoutId }
      });

      if (fnError) {
        console.error('Error fetching payout:', fnError);
        setError('Error al cargar los detalles del pago');
        return;
      }

      if (response?.error) {
        console.error('API error:', response.error);
        setError(response.error);
        return;
      }

      setData(response);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Error inesperado al cargar los detalles');
    } finally {
      setLoading(false);
    }
  }, [user, payoutId]);

  useEffect(() => {
    fetchPayout();
  }, [fetchPayout]);

  return {
    payout: data?.payout || null,
    invoice: data?.invoice || null,
    job: data?.job || null,
    provider: data?.provider || null,
    client: data?.client || null,
    isAdmin: data?.isAdmin || false,
    loading,
    error,
    refetch: fetchPayout
  };
};