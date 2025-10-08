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

      try {
        const { data, error } = await supabase
          .from('clients')
          .select('role')
          .eq('email', user.email)
          .maybeSingle();

        if (error) {
          throw error;
        }

        // If no client record found, default to 'client' (trigger will create it)
        if (!data) {
          setRole('client');
        } else {
          setRole((data.role === 'provider' ? 'provider' : 'client') as 'client' | 'provider');
        }
        setError(null);
      } catch (err: any) {
        setError(err.message);
        console.error('Error fetching user role:', err);
        setRole('client'); // Default to client on error
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, loading, error };
};