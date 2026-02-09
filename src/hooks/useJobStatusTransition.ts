import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

/**
 * Job status flow (strict order):
 * active (available) → accepted → confirmed → en_route → on_site → quoted → in_progress → completed
 * Any state can → cancelled
 */

export type JobStatus =
  | 'active'      // Available, no provider
  | 'accepted'    // Provider assigned
  | 'confirmed'   // Client confirmed
  | 'en_route'    // Provider heading to site
  | 'on_site'     // Provider arrived
  | 'quoted'      // Quote sent, awaiting approval
  | 'in_progress' // Work started
  | 'completed'   // Done
  | 'cancelled';  // Cancelled at any point

// Valid transitions map (from → to[])
const VALID_TRANSITIONS: Record<string, string[]> = {
  active:      ['accepted', 'cancelled'],
  accepted:    ['confirmed', 'cancelled'],
  confirmed:   ['en_route', 'cancelled'],
  en_route:    ['on_site', 'cancelled'],
  on_site:     ['quoted', 'in_progress', 'cancelled'], // can skip quote if not needed
  quoted:      ['in_progress', 'cancelled'],
  in_progress: ['completed', 'cancelled'],
  // Terminal states
  completed:   [],
  cancelled:   [],
};

// System message config per transition
const SYSTEM_MESSAGES: Record<string, { emoji: string; text: string }> = {
  accepted:    { emoji: '✅', text: 'El proveedor aceptó el trabajo' },
  confirmed:   { emoji: '📋', text: 'El cliente confirmó el trabajo' },
  en_route:    { emoji: '📍', text: 'El proveedor va en camino' },
  on_site:     { emoji: '📌', text: 'El proveedor llegó al sitio' },
  quoted:      { emoji: '🧾', text: 'El proveedor envió una cotización' },
  in_progress: { emoji: '🛠️', text: 'El trabajo comenzó' },
  completed:   { emoji: '🎉', text: 'El trabajo fue marcado como completado' },
  cancelled:   { emoji: '❌', text: 'El trabajo fue cancelado' },
};

// Active statuses (non-terminal)
export const ACTIVE_JOB_STATUSES = [
  'accepted', 'confirmed', 'en_route', 'on_site', 'quoted', 'in_progress'
];

// Status labels in Spanish
export const JOB_STATUS_LABELS: Record<string, string> = {
  active:      'Disponible',
  accepted:    'Aceptado',
  confirmed:   'Confirmado',
  en_route:    'En camino',
  on_site:     'En sitio',
  quoted:      'Cotizado',
  in_progress: 'En progreso',
  completed:   'Completado',
  cancelled:   'Cancelado',
};

// Status colors for badges
export const JOB_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  active:      { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  accepted:    { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300' },
  confirmed:   { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-300' },
  en_route:    { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
  on_site:     { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-300' },
  quoted:      { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-300' },
  in_progress: { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300' },
  completed:   { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' },
  cancelled:   { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
};

export const useJobStatusTransition = () => {
  const { user } = useAuth();

  /**
   * Check if provider already has an active job (non-terminal).
   * Returns the active job id or null.
   */
  const getActiveJobId = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from('jobs')
      .select('id')
      .eq('provider_id', user.id)
      .in('status', ACTIVE_JOB_STATUSES)
      .limit(1);
    return data?.[0]?.id ?? null;
  }, [user]);

  /**
   * Transition a job to a new status with validation and system message.
   */
  const transitionStatus = useCallback(async (
    jobId: string,
    newStatus: JobStatus,
    clientId: string,
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No autenticado' };

    // 1. Fetch current job status
    const { data: job, error: fetchErr } = await supabase
      .from('jobs')
      .select('status, provider_id, client_id')
      .eq('id', jobId)
      .single();

    if (fetchErr || !job) return { success: false, error: 'Trabajo no encontrado' };

    const currentStatus = job.status as string;

    // 2. Validate transition
    const allowed = VALID_TRANSITIONS[currentStatus];
    if (!allowed || !allowed.includes(newStatus)) {
      return { success: false, error: `No se puede cambiar de "${JOB_STATUS_LABELS[currentStatus] || currentStatus}" a "${JOB_STATUS_LABELS[newStatus]}"` };
    }

    // 3. If accepting, check one-active-job rule
    if (newStatus === 'accepted') {
      const existingActive = await getActiveJobId();
      if (existingActive) {
        return { success: false, error: 'Ya tienes un trabajo activo. Complétalo o cancélalo primero.' };
      }
    }

    // 4. Build update payload
    const updatePayload: Record<string, any> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };
    if (newStatus === 'accepted') {
      updatePayload.provider_id = user.id;
    }

    // 5. Update job status
    const { error: updateErr } = await supabase
      .from('jobs')
      .update(updatePayload)
      .eq('id', jobId);

    if (updateErr) return { success: false, error: updateErr.message };

    // 6. Create system message in chat
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

    // 7. Create internal notification for the other party
    const notifUserId = newStatus === 'confirmed' ? job.provider_id : (clientId || job.client_id);
    if (notifUserId && msgConfig) {
      await supabase.from('notifications').insert({
        user_id: notifUserId,
        type: `job_${newStatus}`,
        title: JOB_STATUS_LABELS[newStatus] || newStatus,
        message: msgConfig.text,
        link: `/provider-portal/jobs/${jobId}`,
        data: { job_id: jobId },
      }).then(() => {/* ignore errors for notifications */});
    }

    return { success: true };
  }, [user, getActiveJobId]);

  return { transitionStatus, getActiveJobId };
};
