import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AuthorizationResult {
  client_secret: string;
  payment_intent_id: string;
  amount?: number;
  currency?: string;
  already_exists?: boolean;
}

interface UseVisitAuthorizationReturn {
  createAuthorization: (jobId: string) => Promise<AuthorizationResult>;
  loading: boolean;
  error: string | null;
}

/**
 * Hook to create a visit fee authorization (PaymentIntent with manual capture)
 * This authorizes $350 USD on the user's card without capturing it.
 * The capture will happen later when the provider completes the first visit.
 */
export const useVisitAuthorization = (): UseVisitAuthorizationReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAuthorization = async (jobId: string): Promise<AuthorizationResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        'create-visit-authorization',
        {
          body: { jobId }
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Failed to create authorization');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.client_secret) {
        throw new Error('No client_secret returned from authorization');
      }

      return {
        client_secret: data.client_secret,
        payment_intent_id: data.payment_intent_id,
        amount: data.amount,
        currency: data.currency,
        already_exists: data.already_exists
      };
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create visit authorization';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createAuthorization,
    loading,
    error
  };
};
