import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface JobInfo {
  id: string;
  title: string;
  scheduledAt: string | null;
  status: string | null;
}

interface ProviderInfo {
  displayName: string | null;
  avatarUrl: string | null;
}

interface AuthorizationStatus {
  status: 'needs_creation' | 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'authorized' | 'paid' | 'canceled' | 'unknown';
  paymentIntentId: string | null;
  clientSecret: string | null;
  needsCreation: boolean;
  amount: number;
  job: JobInfo | null;
  provider: ProviderInfo | null;
}

interface UseVisitAuthorizationStatusReturn {
  status: AuthorizationStatus | null;
  loading: boolean;
  error: string | null;
  fetchStatus: (jobId: string) => Promise<AuthorizationStatus>;
  reload: () => Promise<void>;
}

export const useVisitAuthorizationStatus = (jobId?: string): UseVisitAuthorizationStatusReturn => {
  const [status, setStatus] = useState<AuthorizationStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentJobId, setCurrentJobId] = useState<string | null>(jobId || null);

  const fetchStatus = useCallback(async (id: string): Promise<AuthorizationStatus> => {
    setLoading(true);
    setError(null);
    setCurrentJobId(id);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'get-visit-authorization-status',
        {
          body: { jobId: id }
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to fetch authorization status');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      const result: AuthorizationStatus = {
        status: data.status || 'unknown',
        paymentIntentId: data.paymentIntentId,
        clientSecret: data.clientSecret,
        needsCreation: data.needsCreation || false,
        amount: data.amount || 350,
        job: data.job || null,
        provider: data.provider || null
      };

      setStatus(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch authorization status';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const reload = useCallback(async () => {
    if (currentJobId) {
      await fetchStatus(currentJobId);
    }
  }, [currentJobId, fetchStatus]);

  return {
    status,
    loading,
    error,
    fetchStatus,
    reload
  };
};
