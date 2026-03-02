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
      const { data, error: invokeError } = await supabase.functions.invoke(
        'create-visit-payment',
        { body: { jobId } }
      );

      if (invokeError) {
        throw new Error(invokeError.message || 'Error al crear sesión de pago');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      if (!data?.url) {
        throw new Error('No se recibió URL de pago');
      }

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
    } finally {
      setLoading(false);
    }
  };

  return { redirectToCheckout, loading, error };
};
