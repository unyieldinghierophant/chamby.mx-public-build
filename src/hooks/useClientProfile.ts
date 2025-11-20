import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface BaseProfile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export const useClientProfile = (userId?: string) => {
  const { user } = useAuth();
  const targetUserId = userId || user?.id;
  
  const [profile, setProfile] = useState<BaseProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientProfile = async () => {
    if (!targetUserId) {
      setLoading(false);
      return;
    }

    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', targetUserId)
        .single();

      if (userError) throw userError;

      setProfile(userData);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching client profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateClientProfile = async (updates: Partial<BaseProfile>) => {
    if (!targetUserId) return;

    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', targetUserId);

      if (error) throw error;

      await fetchClientProfile();
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err };
    }
  };

  useEffect(() => {
    fetchClientProfile();
  }, [targetUserId]);

  return {
    profile,
    loading,
    error,
    refetch: fetchClientProfile,
    updateProfile: updateClientProfile
  };
};
