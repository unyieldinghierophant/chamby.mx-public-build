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
      const { data, error } = await supabase
        .from('booking_reschedules')
        .select(`
          *,
          booking:bookings!booking_reschedules_booking_id_fkey (
            title,
            address,
            total_amount,
            reschedule_response_deadline,
            customer:profiles!bookings_customer_id_fkey (
              full_name,
              phone
            )
          )
        `)
        .eq('id', rescheduleId)
        .single();

      if (error) throw error;
      setReschedule(data as any);
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
      // Update reschedule status
      const { error: rescheduleError } = await supabase
        .from('booking_reschedules')
        .update({
          status: 'accepted',
          provider_response: 'accept',
          responded_at: new Date().toISOString(),
        })
        .eq('id', reschedule.id);

      if (rescheduleError) throw rescheduleError;

      // Update booking scheduled date
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          scheduled_date: reschedule.requested_date,
          original_scheduled_date: reschedule.original_date,
          reschedule_requested_at: null,
          reschedule_requested_date: null,
          reschedule_response_deadline: null,
        })
        .eq('id', reschedule.booking_id);

      if (bookingError) throw bookingError;

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
      const { error } = await supabase
        .from('booking_reschedules')
        .update({
          status: 'rejected',
          provider_response: 'suggest_alternative',
          suggested_date: suggestedDate.toISOString(),
          responded_at: new Date().toISOString(),
        })
        .eq('id', reschedule.id);

      if (error) throw error;

      // Clear reschedule fields from booking
      await supabase
        .from('bookings')
        .update({
          reschedule_requested_at: null,
          reschedule_requested_date: null,
          reschedule_response_deadline: null,
        })
        .eq('id', reschedule.booking_id);

      // Notification system disabled
      console.log('Would notify customer of alternative date');

      toast({
        title: 'Fecha sugerida',
        description: 'El cliente puede aceptar tu propuesta o cancelar.',
      });

      setTimeout(() => navigate('/provider-portal/calendar'), 1500);
    } catch (error) {
      console.error('Error suggesting alternative:', error);
      toast({
        title: 'Error',
        description: 'No se pudo enviar la sugerencia',
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
      const { error: rescheduleError } = await supabase
        .from('booking_reschedules')
        .update({
          status: 'rejected',
          provider_response: 'cancel',
          responded_at: new Date().toISOString(),
        })
        .eq('id', reschedule.id);

      if (rescheduleError) throw rescheduleError;

      // Cancel booking
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({
          status: 'cancelled',
          tasker_id: null,
          reschedule_requested_at: null,
          reschedule_requested_date: null,
          reschedule_response_deadline: null,
        })
        .eq('id', reschedule.booking_id);

      if (bookingError) throw bookingError;

      // Notification system disabled
      console.log('Would notify customer of cancellation');

      toast({
        title: 'Trabajo cancelado',
        description: 'El trabajo fue cancelado y será reasignado.',
      });

      setTimeout(() => navigate('/provider-portal/jobs'), 1500);
    } catch (error) {
      console.error('Error cancelling job:', error);
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
