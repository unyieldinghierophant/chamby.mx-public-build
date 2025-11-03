import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface AvailableJob {
  id: string;
  title: string;
  description: string | null;
  service_id: string;
  customer_id: string;
  scheduled_date: string;
  duration_hours: number;
  total_amount: number;
  address: string | null;
  status: string;
  created_at: string;
  service?: {
    name: string;
    category: string;
  };
  customer?: {
    full_name: string | null;
    avatar_url: string | null;
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
      const { data, error: fetchError } = await supabase
        .from('bookings')
        .select(`
          *,
          service:services(name, category),
          customer:profiles!bookings_customer_id_fkey(full_name, avatar_url)
        `)
        .eq('status', 'pending')
        .is('tasker_id', null)
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setJobs((data || []) as AvailableJob[]);
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
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ 
          tasker_id: user.id,
          status: 'confirmed'
        })
        .eq('id', jobId)
        .is('tasker_id', null); // Only accept if not already taken

      if (updateError) throw updateError;

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

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('available-jobs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: 'status=eq.pending'
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