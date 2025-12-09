import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Payout {
  id: string;
  invoice_id: string;
  provider_id: string;
  amount: number;
  status: 'pending' | 'paid' | 'failed';
  notes: string | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
  invoice_status: string;
  job_title: string;
}

interface PayoutSummary {
  totalPaid: number;
  pendingAmount: number;
  lastPaidAt: string | null;
  totalPayouts: number;
  paidCount: number;
  pendingCount: number;
}

interface UseProviderPayoutsReturn {
  payouts: Payout[];
  summary: PayoutSummary | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useProviderPayouts = (): UseProviderPayoutsReturn => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('list-provider-payouts');

      if (fnError) {
        console.error('Error fetching payouts:', fnError);
        setError('Error al cargar los pagos');
        return;
      }

      if (data.error) {
        console.error('API error:', data.error);
        setError(data.error);
        return;
      }

      setPayouts(data.payouts || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Error inesperado al cargar los pagos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return {
    payouts,
    summary,
    loading,
    error,
    refetch: fetchPayouts
  };
};