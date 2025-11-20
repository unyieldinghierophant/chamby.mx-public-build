import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface Job {
  id: string;
  title: string;
  description: string | null;
  category: string;
  rate: number;
  provider_id: string | null;
  client_id: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface JobFilters {
  search?: string;
  category?: string;
  sortBy?: 'rate_asc' | 'rate_desc' | 'created_at_desc' | 'created_at_asc';
}

export const useJobs = (filters?: JobFilters) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('jobs')
        .select('*')
        .eq('status', 'active');

      // Apply filters
      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.category) {
        query = query.eq('category', filters.category);
      }

      // Apply sorting
      switch (filters?.sortBy) {
        case 'rate_asc':
          query = query.order('rate', { ascending: true });
          break;
        case 'rate_desc':
          query = query.order('rate', { ascending: false });
          break;
        case 'created_at_asc':
          query = query.order('created_at', { ascending: true });
          break;
        default:
          query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) throw error;
      setJobs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [filters?.search, filters?.category, filters?.sortBy]);

  return {
    jobs,
    loading,
    error,
    refetch: fetchJobs
  };
};

export const useProviderJobs = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderJobs = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('provider_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching provider jobs:', err);
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
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          ...jobData,
          client_id: user.id,
          provider_id: user.id,
          status: 'active'
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

  const updateJob = async (jobId: string, updates: Partial<Job>) => {
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
    fetchProviderJobs();
  }, [user]);

  return {
    jobs,
    loading,
    error,
    createJob,
    updateJob,
    deleteJob,
    refetch: fetchProviderJobs
  };
};
