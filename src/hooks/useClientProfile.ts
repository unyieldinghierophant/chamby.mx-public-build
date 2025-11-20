import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface ClientProfile {
  id: string;
  user_id: string;
  address: string | null;
  age: number | null;
  phone_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface BaseProfile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
}

export const useClientProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<(ClientProfile & BaseProfile) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClientProfile = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Fetch client profile with base profile data
      const { data: clientData, error: clientError } = await supabase
        .from('client_profiles')
        .select(`
          *,
          profiles!inner(full_name, phone, avatar_url, bio)
        `)
        .eq('user_id', user.id)
        .single();

      if (clientError && clientError.code !== 'PGRST116') {
        throw clientError;
      }

      if (clientData) {
        // Flatten the nested structure
        const flatProfile = {
          ...clientData,
          full_name: clientData.profiles.full_name,
          phone: clientData.profiles.phone,
          avatar_url: clientData.profiles.avatar_url,
          bio: clientData.profiles.bio,
        };
        delete flatProfile.profiles;
        setProfile(flatProfile);
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching client profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateClientProfile = async (updates: Partial<ClientProfile & BaseProfile>) => {
    if (!user) return;

    try {
      // Separate client-specific and base profile updates
      const { full_name, phone, avatar_url, bio, ...clientUpdates } = updates;
      
      // Update base profile if there are base profile fields
      if (full_name !== undefined || phone !== undefined || avatar_url !== undefined || bio !== undefined) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ full_name, phone, avatar_url, bio })
          .eq('user_id', user.id);

        if (profileError) throw profileError;
      }

      // Update client profile if there are client-specific fields
      if (Object.keys(clientUpdates).length > 0) {
        const { data, error } = await supabase
          .from('client_profiles')
          .update(clientUpdates)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
      }

      await fetchClientProfile();
      return { data: profile, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err };
    }
  };

  useEffect(() => {
    fetchClientProfile();
  }, [user]);

  return {
    profile,
    loading,
    error,
    refetch: fetchClientProfile,
    updateProfile: updateClientProfile
  };
};
