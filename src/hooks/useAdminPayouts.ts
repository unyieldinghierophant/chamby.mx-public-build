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
  provider_name: string;
  invoice_status: string;
  job_title: string;
}

interface PayoutSummary {
  totalPaid: number;
  pendingAmount: number;
  totalPayouts: number;
  paidCount: number;
  pendingCount: number;
}

interface PaidInvoice {
  id: string;
  job_id: string;
  provider_id: string;
  subtotal_provider: number;
  status: string;
  created_at: string;
  provider_name: string;
  job_title: string;
  has_payout: boolean;
}

interface UseAdminPayoutsReturn {
  payouts: Payout[];
  summary: PayoutSummary | null;
  paidInvoices: PaidInvoice[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  createPayout: (invoiceId: string, amount: number, notes?: string) => Promise<boolean>;
  markAsPaid: (payoutId: string) => Promise<boolean>;
}

export const useAdminPayouts = (): UseAdminPayoutsReturn => {
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [summary, setSummary] = useState<PayoutSummary | null>(null);
  const [paidInvoices, setPaidInvoices] = useState<PaidInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPayouts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all payouts
      const { data: payoutsData, error: payoutsError } = await supabase.functions.invoke('admin-list-all-payouts');

      if (payoutsError) {
        console.error('Error fetching payouts:', payoutsError);
        setError('Error al cargar los pagos');
        return;
      }

      if (payoutsData.error) {
        console.error('API error:', payoutsData.error);
        setError(payoutsData.error);
        return;
      }

      setPayouts(payoutsData.payouts || []);
      setSummary(payoutsData.summary || null);

      // Fetch paid invoices for creating new payouts
      const { data: invoicesData, error: invoicesError } = await supabase.functions.invoke('admin-list-paid-invoices');

      if (invoicesError) {
        console.error('Error fetching paid invoices:', invoicesError);
      } else if (!invoicesData.error) {
        setPaidInvoices(invoicesData.invoices || []);
      }

    } catch (err) {
      console.error('Unexpected error:', err);
      setError('Error inesperado al cargar los datos');
    } finally {
      setLoading(false);
    }
  }, []);

  const createPayout = useCallback(async (invoiceId: string, amount: number, notes?: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-create-payout', {
        body: { invoice_id: invoiceId, amount, notes }
      });

      if (fnError || data.error) {
        console.error('Error creating payout:', fnError || data.error);
        return false;
      }

      await fetchPayouts();
      return true;
    } catch (err) {
      console.error('Unexpected error creating payout:', err);
      return false;
    }
  }, [fetchPayouts]);

  const markAsPaid = useCallback(async (payoutId: string): Promise<boolean> => {
    try {
      const { data, error: fnError } = await supabase.functions.invoke('admin-mark-payout-paid', {
        body: { payout_id: payoutId }
      });

      if (fnError || data.error) {
        console.error('Error marking payout as paid:', fnError || data.error);
        return false;
      }

      await fetchPayouts();
      return true;
    } catch (err) {
      console.error('Unexpected error marking payout as paid:', err);
      return false;
    }
  }, [fetchPayouts]);

  useEffect(() => {
    fetchPayouts();
  }, [fetchPayouts]);

  return {
    payouts,
    summary,
    paidInvoices,
    loading,
    error,
    refetch: fetchPayouts,
    createPayout,
    markAsPaid
  };
};