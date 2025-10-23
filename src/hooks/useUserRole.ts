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
        // Fetch all roles from user_roles table (users may have multiple roles)
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          // Priority: provider > client > admin
          // Find provider role first, then client, then admin
          const providerRole = data.find(r => r.role === 'provider');
          const clientRole = data.find(r => r.role === 'client');
          
          if (providerRole) {
            setRole('provider');
          } else if (clientRole) {
            setRole('client');
          } else {
            // If only admin or other roles, default to client
            setRole('client');
          }
        } else {
          // Default to client if no role found
          setRole('client');
        }
        setError(null);
      } catch (err: any) {
        console.error('Error fetching user role:', err);
        setError(err.message);
        // Default to client on error
        setRole('client');
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { role, loading, error };
};