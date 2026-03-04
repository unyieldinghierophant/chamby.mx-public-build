import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  type JobStatus,
  VALID_TRANSITIONS,
  PROVIDER_ACTIVE_STATES,
  SYSTEM_MESSAGES,
  getStatusLabel,
  canTransition,
} from '@/utils/jobStateMachine';

// Re-export for backward compat
export type { JobStatus };
export {
  getStatusLabel as JOB_STATUS_LABELS_FN,
  PROVIDER_ACTIVE_STATES as ACTIVE_JOB_STATUSES,
} from '@/utils/jobStateMachine';
export {
  JOB_STATUS_CONFIG,
} from '@/utils/jobStateMachine';

export const useJobStatusTransition = () => {
  const { user } = useAuth();

  const getActiveJobId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('jobs')
      .select('id')
      .eq('provider_id', user.id)
      .in('status', PROVIDER_ACTIVE_STATES)
      .limit(1);
    return data?.[0]?.id ?? null;
  }, [user]);

  const transitionStatus = useCallback(async (
    jobId: string,
    newStatus: JobStatus,
    clientId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No autenticado' };

    const { data: job, error: fetchErr } = await supabase
      .from('jobs')
      .select('status, provider_id, client_id')
      .eq('id', jobId)
      .single();

    if (fetchErr || !job) return { success: false, error: 'Trabajo no encontrado' };

    const currentStatus = job.status as string;

    if (!canTransition(currentStatus, newStatus)) {
      return { success: false, error: `No se puede cambiar de "${getStatusLabel(currentStatus)}" a "${getStatusLabel(newStatus)}"` };
    }

    // If accepting (assigned), check one-active-job rule
    if (newStatus === 'assigned') {
      const existingActive = await getActiveJobId();
      if (existingActive) {
        return { success: false, error: 'Ya tienes un trabajo activo. Complétalo o cancélalo primero.' };
      }
    }

    // If moving to in_progress, check that invoice is accepted
    if (newStatus === 'in_progress') {
      const { data: invoice } = await supabase
        .from('invoices')
        .select('status')
        .eq('job_id', jobId)
        .in('status', ['sent', 'accepted'])
        .maybeSingle();

      if (!invoice || invoice.status !== 'accepted') {
        return { success: false, error: 'La factura debe ser aceptada por el cliente antes de iniciar el trabajo.' };
      }
    }

    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'assigned') {
      updatePayload.provider_id = user.id;
    }

    const { error: updateErr } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId);

    if (updateErr) return { success: false, error: updateErr.message };

    // Create system message in chat
    const msgConfig = SYSTEM_MESSAGES[newStatus];
    if (msgConfig) {
      const resolvedClientId = clientId || job.client_id;
      if (resolvedClientId) {
        await supabase.from('messages').insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: resolvedClientId,
          message_text: `${msgConfig.emoji} ${msgConfig.text}`,
          is_system_message: true,
          system_event_type: newStatus,
          read: false,
        });
      }
    }

    // Create notification for other party
    const notifUserId = newStatus === 'assigned' ? (clientId || job.client_id) : (clientId || job.client_id);
    if (notifUserId && msgConfig) {
      await supabase.from('notifications').insert({
        user_id: notifUserId,
        type: `job_${newStatus}`,
        title: getStatusLabel(newStatus),
        message: msgConfig.text,
        link: `/provider-portal/jobs/${jobId}`,
        data: { job_id: jobId },
      }).then(() => {/* ignore errors */});
    }

    return { success: true };
  }, [user, getActiveJobId]);

  return { transitionStatus, getActiveJobId };
};
