import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  role: 'client' | 'provider' | null;
  loading: boolean;
  error: string | null;
}

export const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const [role, setRole] = useState<'client' | 'provider' | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      // Retry logic for Google OAuth race condition
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const { data, error } = await supabase
            .from('clients')
            .select('role')
            .eq('email', user.email)
            .maybeSingle();

          if (error) {
            throw error;
          }

          // If data found, use it
          if (data) {
            setRole((data.role === 'provider' ? 'provider' : 'client') as 'client' | 'provider');
            setError(null);
            setLoading(false);
            return;
          }

          // If no data and not last attempt, wait and retry
          if (attempt < maxRetries) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }

          // Last attempt, no data found - default to client
          setRole('client');
          setError(null);
        } catch (err: any) {
          if (attempt === maxRetries) {
            setError(err.message);
            console.error('Error fetching user role:', err);
            setRole('client'); // Default to client on error
          } else {
            // Retry on error
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      setLoading(false);
    };

    fetchUserRole();
  }, [user]);

  return { role, loading, error };
};