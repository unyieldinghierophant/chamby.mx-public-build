import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface RefundRequest {
  id: string;
  job_id: string;
  client_id: string;
  reason: string;
  status: string;
  requested_at: string;
}

export function useRefundRequest(jobId: string | null) {
  const { user } = useAuth();
  const [existingRequest, setExistingRequest] = useState<RefundRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchExisting = useCallback(async () => {
    if (!jobId || !user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await supabase
        .from('refund_requests' as any)
        .select('*')
        .eq('job_id', jobId)
        .eq('client_id', user.id)
        .order('requested_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      setExistingRequest(data as unknown as RefundRequest | null);
    } catch {
      // table may not exist yet, ignore
    } finally {
      setLoading(false);
    }
  }, [jobId, user]);

  useEffect(() => {
    fetchExisting();
  }, [fetchExisting]);

  const submitRefundRequest = useCallback(async (reason: string) => {
    if (!jobId || !user) return false;
    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('refund_requests' as any)
        .insert({
          job_id: jobId,
          client_id: user.id,
          reason,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      setExistingRequest(data as unknown as RefundRequest);
      toast.success('Tu solicitud de reembolso fue enviada. Un administrador la revisará pronto.');
      return true;
    } catch (err: any) {
      console.error('Refund request error:', err);
      toast.error('Error al solicitar reembolso. Intenta de nuevo.');
      return false;
    } finally {
      setSubmitting(false);
    }
  }, [jobId, user]);

  return {
    existingRequest,
    hasRequested: !!existingRequest,
    isPending: existingRequest?.status === 'pending',
    loading,
    submitting,
    submitRefundRequest,
  };
}
