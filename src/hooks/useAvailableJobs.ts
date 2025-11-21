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
  visit_fee_paid: boolean;
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

    try {
      // Update job with provider_id and change status to assigned
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ 
          provider_id: user.id,
          status: 'assigned',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .is('provider_id', null); // Only accept if not already taken

      if (updateError) throw updateError;

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
