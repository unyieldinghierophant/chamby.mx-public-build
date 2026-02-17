import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActiveJob {
  id: string;
  title: string;
  description: string | null;
  client_id: string | null;
  provider_id: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  total_amount: number | null;
  location: string | null;
  status: string;
  category: string;
  created_at: string;
  // Payment status fields
  stripe_visit_payment_intent_id: string | null;
  visit_fee_paid: boolean | null;
  visit_fee_amount: number | null;
  amount_booking_fee: number | null;
  client?: {
    full_name: string | null;
    phone: string | null;
  };
  invoice?: {
    status: string;
  } | null;
}

interface UseActiveJobsResult {
  jobs: ActiveJob[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  completeJob: (jobId: string) => Promise<{ error: any }>;
  cancelJob: (jobId: string) => Promise<{ error: any }>;
}

export const useActiveJobs = (): UseActiveJobsResult => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const { data: jobsData, error: fetchError } = await supabase
        .from('jobs')
        .select('*, invoices(status)')
        .eq('provider_id', user.id)
        .in('status', ['assigned', 'accepted', 'confirmed', 'en_route', 'on_site', 'quoted', 'in_progress', 'scheduled'])
        .order('scheduled_at', { ascending: true });

      if (fetchError) throw fetchError;

      // Fetch client details for each job
      const jobsWithClients = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { data: clientData } = await supabase
            .from('users')
            .select('full_name, phone')
            .eq('id', job.client_id)
            .maybeSingle();

          // Get the first invoice if exists (from the joined data)
          const invoices = (job as any).invoices;
          const invoice = Array.isArray(invoices) && invoices.length > 0 
            ? invoices[0] 
            : null;

          return {
            ...job,
            client: clientData || { full_name: 'Cliente', phone: '' },
            invoice
          };
        })
      );

      setJobs(jobsWithClients as ActiveJob[]);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching active jobs:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const completeJob = async (jobId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'completed' })
        .eq('id', jobId)
        .eq('provider_id', user?.id);

      if (updateError) throw updateError;

      await fetchJobs();
      return { error: null };
    } catch (err: any) {
      console.error('Error completing job:', err);
      return { error: err };
    }
  };

  const cancelJob = async (jobId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('jobs')
        .update({ status: 'cancelled' })
        .eq('id', jobId)
        .eq('provider_id', user?.id);

      if (updateError) throw updateError;

      await fetchJobs();
      return { error: null };
    } catch (err: any) {
      console.error('Error cancelling job:', err);
      return { error: err };
    }
  };

  useEffect(() => {
    fetchJobs();

    const subscription = supabase
      .channel('active-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs'
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
    completeJob,
    cancelJob
  };
};
