import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface UserRole {
  role: 'client' | 'provider' | null;
  roles: string[];
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
}

export const useUserRole = (): UserRole => {
  const { user } = useAuth();
  const [role, setRole] = useState<'client' | 'provider' | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all roles from user_roles table
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          throw error;
        }

        if (data && data.length > 0) {
          const userRoles = data.map(r => r.role);
          setRoles(userRoles);

          // Check if user has selected a role in this session
          const selectedRole = localStorage.getItem('selected_role') as 'client' | 'provider' | null;
          
          if (selectedRole && userRoles.includes(selectedRole)) {
            // Use the previously selected role
            setRole(selectedRole);
          } else {
            // Priority: provider > client
            const hasProvider = userRoles.includes('provider');
            setRole(hasProvider ? 'provider' : 'client');
          }
        } else {
          // Default to client if no role found
          setRole('client');
          setRoles(['client']);
        }
        setError(null);
      } catch (err: any) {
        console.error('Error fetching user role:', err);
        setError(err.message);
        setRole('client');
        setRoles(['client']);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isAdmin = roles.includes('admin');

  return { role, roles, isAdmin, loading, error };
};