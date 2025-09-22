import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TaskerJob {
  id: string;
  title: string;
  description: string | null;
  category: string;
  rate: number;
  provider_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export const useTaskerJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<TaskerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskerJobs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First get the tasker's client ID
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email)
        .single();

      if (clientError) throw clientError;
      if (!clientData) throw new Error('Client not found');

      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('provider_id', clientData.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching tasker jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const createJob = async (jobData: {
    title: string;
    description: string;
    category: string;
    rate: number;
  }) => {
    if (!user) return { error: 'No user found' };

    try {
      // First get the tasker's client ID
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email)
        .single();

      if (clientError) throw clientError;
      if (!clientData) throw new Error('Client not found');

      const { data, error } = await supabase
        .from('jobs')
        .insert({
          ...jobData,
          provider_id: clientData.id
        })
        .select()
        .single();

      if (error) throw error;

      setJobs(prev => [data, ...prev]);
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  const updateJob = async (jobId: string, updates: Partial<TaskerJob>) => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .update(updates)
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;

      setJobs(prev => prev.map(job => job.id === jobId ? data : job));
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  const deleteJob = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      setJobs(prev => prev.filter(job => job.id !== jobId));
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err };
    }
  };

  useEffect(() => {
    fetchTaskerJobs();
  }, [user]);

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    refetch: fetchTaskerJobs
  };
};