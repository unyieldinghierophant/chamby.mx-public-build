import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useAvailableJobsCount = () => {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchCount = async () => {
    try {
      const { count: jobCount, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .is('tasker_id', null)
        .eq('status', 'pending');

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
          table: 'bookings',
          filter: 'tasker_id=is.null'
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
