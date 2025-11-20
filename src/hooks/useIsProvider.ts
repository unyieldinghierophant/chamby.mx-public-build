import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useIsProvider = () => {
  const { user } = useAuth();
  const [isProvider, setIsProvider] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkProviderStatus = async () => {
      if (!user) {
        setIsProvider(false);
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .eq('role', 'provider')
          .single();
        
        setIsProvider(!!data);
      } catch (error) {
        console.error('Error checking provider status:', error);
        setIsProvider(false);
      } finally {
        setLoading(false);
      }
    };

    checkProviderStatus();
  }, [user]);

  return { isProvider, loading };
};
