import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAvailableJobsCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const { count: jobCount, error } = await supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .is('provider_id', null)
        .eq('status', 'searching')
        .eq('visit_fee_paid', true)
        .gte('assignment_deadline', new Date().toISOString());

      if (error) throw error;
      setCount(jobCount || 0);
    } catch (error) {
      console.error('Error fetching available jobs count:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('available-jobs-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'jobs',
          filter: 'provider_id=is.null'
        },
        () => {
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { count, loading };
};
