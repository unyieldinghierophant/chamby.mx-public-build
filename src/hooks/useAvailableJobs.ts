import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getCurrentProfile } from '@/lib/profile';

export interface AvailableJob {
  id: string;
  title: string;
  description: string | null;
  category: string;
  service_type: string | null;
  location: string | null;
  client_id: string | null;
  scheduled_at: string | null;
  rate: number;
  status: string;
  created_at: string;
  // Payment status fields
  visit_fee_paid: boolean;
  stripe_visit_payment_intent_id: string | null;
  problem: string | null;
  urgent: boolean;
  photos: string[] | null;
  clients?: {
    email: string | null;
    phone: string | null;
  };
}

interface UseAvailableJobsResult {
  jobs: AvailableJob[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  acceptJob: (jobId: string) => Promise<void>;
}

export const useAvailableJobs = (): UseAvailableJobsResult => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<AvailableJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Only show paid, valid, unassigned active jobs to providers
      const { data: jobsData, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .eq('visit_fee_paid', true)
        .is('provider_id', null)
        .not('scheduled_at', 'is', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch client details separately for each job
      const jobsWithClients = await Promise.all(
        (jobsData || []).map(async (job) => {
          if (job.client_id) {
            const { data: clientData } = await supabase
              .from('users')
              .select('full_name, phone')
              .eq('id', job.client_id)
              .single();
            
            return {
              ...job,
              clients: clientData || { full_name: null, phone: null }
            };
          }
          return {
            ...job,
            clients: { email: null, phone: null }
          };
        })
      );

      setJobs(jobsWithClients as AvailableJob[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching available jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const acceptJob = async (jobId: string) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Check one-active-job rule
    const { data: existingActive } = await supabase
      .from('jobs')
      .select('id')
      .eq('provider_id', user.id)
      .in('status', ['accepted', 'confirmed', 'en_route', 'on_site', 'quoted', 'in_progress'])
      .limit(1);

    if (existingActive && existingActive.length > 0) {
      throw new Error('Ya tienes un trabajo activo. Complétalo o cancélalo primero.');
    }

    try {
      // Verify job is paid before accepting
      const { data: jobToAccept } = await supabase
        .from('jobs')
        .select('visit_fee_paid, status')
        .eq('id', jobId)
        .single();

      if (!jobToAccept?.visit_fee_paid) {
        throw new Error('Este trabajo no tiene pago de visita confirmado.');
      }
      if (jobToAccept.status !== 'active') {
        throw new Error('Este trabajo ya no está disponible.');
      }

      // Update job with provider_id and change status to accepted
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ 
          provider_id: user.id,
          status: 'accepted',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('visit_fee_paid', true)
        .is('provider_id', null); // Only accept if not already taken

      if (updateError) throw updateError;

      // Create system message for acceptance
      const { data: jobData } = await supabase
        .from('jobs')
        .select('client_id')
        .eq('id', jobId)
        .single();

      if (jobData?.client_id) {
        await supabase.from('messages').insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: jobData.client_id,
          message_text: '✅ El proveedor aceptó el trabajo',
          is_system_message: true,
          system_event_type: 'accepted',
          read: false,
        });
      }

      // Mark related notifications as read
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('type', 'new_job_available')
        .contains('data', { job_id: jobId });

      // Refetch jobs after accepting
      await fetchJobs();
    } catch (err: any) {
      console.error('Error accepting job:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchJobs();

    // Subscribe to real-time changes on jobs table
    const subscription = supabase
      .channel('available-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: 'status=eq.active'
        },
        () => {
          fetchJobs();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs,
    acceptJob
  };
};
