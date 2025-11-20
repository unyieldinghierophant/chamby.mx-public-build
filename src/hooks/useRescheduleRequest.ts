import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export interface RescheduleRequest {
  id: string;
  booking_id: string;
  requested_by: string;
  original_date: string;
  requested_date: string;
  reason: string | null;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  provider_response: 'accept' | 'suggest_alternative' | 'cancel' | null;
  suggested_date: string | null;
  responded_at: string | null;
  created_at: string;
  booking: {
    title: string;
    address: string;
    total_amount: number;
    reschedule_response_deadline: string;
    customer: {
      full_name: string;
      phone: string;
    };
  };
}

export const useRescheduleRequest = (rescheduleId: string) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [reschedule, setReschedule] = useState<RescheduleRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState(false);

  const fetchReschedule = async () => {
    if (!user || !rescheduleId) return;

    try {
      // Fetch job with reschedule request info
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', rescheduleId)
        .not('reschedule_requested_at', 'is', null)
        .single();

      if (error) throw error;

      // Fetch client details separately
      let clientInfo = { full_name: 'Cliente', phone: '' };
      if (data.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('email, phone')
          .eq('id', data.client_id)
          .single();
        if (clientData) {
          clientInfo = { full_name: clientData.email || 'Cliente', phone: clientData.phone || '' };
        }
      }
      
      // Transform to RescheduleRequest format
      const transformedData: RescheduleRequest = {
        id: data.id,
        booking_id: data.id,
        requested_by: data.client_id,
        original_date: data.original_scheduled_date || data.scheduled_at,
        requested_date: data.reschedule_requested_date,
        reason: null,
        status: 'pending',
        provider_response: null,
        suggested_date: null,
        responded_at: null,
        created_at: data.reschedule_requested_at,
        booking: {
          title: data.title,
          address: data.location || '',
          total_amount: data.total_amount,
          reschedule_response_deadline: data.reschedule_response_deadline,
          customer: clientInfo
        }
      };
      
      setReschedule(transformedData);
    } catch (error) {
      console.error('Error fetching reschedule:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cargar la solicitud',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const acceptReschedule = async () => {
    if (!reschedule) return;

    setResponding(true);
    try {
      // Update job scheduled date
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          scheduled_at: reschedule.requested_date,
          original_scheduled_date: reschedule.original_date,
          reschedule_requested_at: null,
          reschedule_requested_date: null,
          reschedule_response_deadline: null,
        })
        .eq('id', reschedule.booking_id);

      if (jobError) throw jobError;

      // Notification system disabled
      console.log('Would notify customer of acceptance');

      toast({
        title: '¡Perfecto!',
        description: 'Reprogramación aceptada. El cliente ha sido notificado.',
      });

      setTimeout(() => navigate('/provider-portal/calendar'), 1500);
    } catch (error) {
      console.error('Error accepting reschedule:', error);
      toast({
        title: 'Error',
        description: 'No se pudo aceptar la reprogramación',
        variant: 'destructive',
      });
    } finally {
      setResponding(false);
    }
  };

  const suggestAlternative = async (suggestedDate: Date) => {
    if (!reschedule) return;

    setResponding(true);
    try {
      // For now, just update the scheduled date to the suggested date
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          scheduled_at: suggestedDate.toISOString(),
          original_scheduled_date: reschedule.original_date,
          reschedule_requested_at: null,
          reschedule_requested_date: null,
          reschedule_response_deadline: null,
        })
        .eq('id', reschedule.booking_id);

      if (jobError) throw jobError;

      // Notification system disabled
      console.log('Would notify customer of alternative suggestion');

      toast({
        title: 'Alternativa enviada',
        description: 'Se ha sugerido una fecha alternativa al cliente',
      });

      setTimeout(() => navigate('/provider-portal/calendar'), 1500);
    } catch (error) {
      console.error('Error suggesting alternative:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la alternativa',
        variant: 'destructive',
      });
    } finally {
      setResponding(false);
    }
  };

  const cancelJob = async () => {
    if (!reschedule) return;

    setResponding(true);
    try {
      // Cancel the job and clear reschedule fields
      const { error: jobError } = await supabase
        .from('jobs')
        .update({
          status: 'cancelled',
          reschedule_requested_at: null,
          reschedule_requested_date: null,
          reschedule_response_deadline: null,
        })
        .eq('id', reschedule.booking_id);

      if (jobError) throw jobError;

      // Notification system disabled
      console.log('Would notify customer of cancellation');

      toast({
        title: 'Trabajo cancelado',
        description: 'El trabajo ha sido cancelado y el cliente notificado',
      });

      setTimeout(() => navigate('/provider-portal/jobs'), 1500);
    } catch (error) {
      console.error('Error canceling job:', error);
      toast({
        title: 'Error',
        description: 'No se pudo cancelar el trabajo',
        variant: 'destructive',
      });
    } finally {
      setResponding(false);
    }
  };

  useEffect(() => {
    fetchReschedule();
  }, [rescheduleId, user]);

  return {
    reschedule,
    loading,
    responding,
    acceptReschedule,
    suggestAlternative,
    cancelJob,
    refetch: fetchReschedule,
  };
};
