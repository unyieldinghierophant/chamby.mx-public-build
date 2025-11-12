import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  visit_fee_paid: boolean;
  payment_status: string;
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
  acceptJob: (jobId: string) => Promise<{ error: any }>;
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
      
      // Fetch jobs that are active and don't have a provider assigned yet
      const { data: jobsData, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active')
        .is('provider_id', null)
        .eq('visit_fee_paid', true)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      // Fetch client details separately for each job
      const jobsWithClients = await Promise.all(
        (jobsData || []).map(async (job) => {
          if (job.client_id) {
            const { data: clientData } = await supabase
              .from('clients')
              .select('email, phone')
              .eq('id', job.client_id)
              .single();
            
            return {
              ...job,
              clients: clientData || { email: null, phone: null }
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
      return { error: new Error('User not authenticated') };
    }

    try {
      // Get the client ID for this provider
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email)
        .single();

      if (clientError || !clientData) {
        throw new Error('No se pudo obtener la información del proveedor');
      }

      // Update job with provider_id
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ 
          provider_id: clientData.id,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .is('provider_id', null); // Only accept if not already taken

      if (updateError) throw updateError;

      // Create notification for client
      const { data: jobData } = await supabase
        .from('jobs')
        .select('client_id, title')
        .eq('id', jobId)
        .single();

      if (jobData?.client_id) {
        await supabase
          .from('notifications')
          .insert({
            user_id: jobData.client_id,
            type: 'job_accepted',
            title: 'Proveedor asignado',
            message: `Un proveedor ha aceptado tu solicitud: ${jobData.title}`,
            link: `/job/${jobId}`
          });
      }

      // Refetch jobs after accepting
      await fetchJobs();

      return { error: null };
    } catch (err: any) {
      console.error('Error accepting job:', err);
      return { error: err };
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
