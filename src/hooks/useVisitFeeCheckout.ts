import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook to redirect the user to Stripe Checkout for visit fee payment.
 * This is the canonical way to pay visit fees — replaces the deprecated
 * PaymentIntent authorization flow. See Phase 4 S5.
 */
export const useVisitFeeCheckout = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const redirectToCheckout = async (jobId: string): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Ensure a valid session token exists before invoking — after a failed signOut the
      // Supabase client may have cleared its local tokens even though the server rejected
      // the logout (403). Try refreshing first; if still missing, ask user to log in again.
      let { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const { data: refreshed } = await supabase.auth.refreshSession();
        session = refreshed.session;
      }
      if (!session?.access_token) {
        throw new Error('Tu sesión expiró. Por favor inicia sesión de nuevo.');
      }

      console.log('[redirectToCheckout] invoking create-visit-payment for job:', jobId);
      const { data, error: invokeError } = await supabase.functions.invoke(
        'create-visit-payment',
        {
          body: { jobId },
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      console.log('[redirectToCheckout] response:', { data, invokeError });
      if (invokeError) {
        throw new Error(invokeError.message || 'Error al crear sesión de pago');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.url) {
        throw new Error('No se recibió URL de pago');
      }
      console.log('[redirectToCheckout] redirecting to:', data.url);

      // Redirect to Stripe Checkout
      window.location.href = data.url;
    } catch (err: any) {
      const msg = err.message || 'Error al iniciar el pago';
      setError(msg);
      toast({
        title: 'Error de pago',
        description: msg,
        variant: 'destructive',
      });
      throw err; // re-throw so callers can avoid clearing form state on failure
    } finally {
      setLoading(false);
    }
  };

  return { redirectToCheckout, loading, error };
};
