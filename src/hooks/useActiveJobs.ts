import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ActiveJob {
  id: string;
  title: string;
  description: string | null;
  customer_id: string | null;
  tasker_id: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  total_amount: number | null;
  location: string | null;
  status: string;
  category: string;
  created_at: string;
  customer?: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  };
  tasker?: {
    full_name: string | null;
    avatar_url: string | null;
    phone: string | null;
  };
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
      const { data, error: fetchError } = await supabase
        .from('jobs')
        .select(`
          *,
          customer:profiles!jobs_customer_id_fkey(full_name, avatar_url, phone),
          tasker:profiles!jobs_tasker_id_fkey(full_name, avatar_url, phone)
        `)
        .eq('tasker_id', user.id)
        .in('status', ['confirmed', 'in_progress'])
        .order('scheduled_at', { ascending: true });

      if (fetchError) throw fetchError;

      setJobs((data || []) as ActiveJob[]);
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
        .eq('tasker_id', user?.id);

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
        .eq('tasker_id', user?.id);

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

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('active-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: `tasker_id=eq.${user?.id}`
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