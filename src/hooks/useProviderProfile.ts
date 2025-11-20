import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderProfile {
  id: string;
  user_id: string;
  hourly_rate: number | null;
  rating: number | null;
  total_reviews: number | null;
  skills: string[] | null;
  specialty: string | null;
  zone_served: string | null;
  payment_schedule: string;
  verification_status: string;
  face_photo_url: string | null;
  verified: boolean;
  fcm_token: string | null;
  created_at: string;
  updated_at: string;
}

interface BaseProfile {
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
}

interface BookingStats {
  total_bookings: number;
  member_since: string;
}

export const useProviderProfile = (userId?: string) => {
  const [profile, setProfile] = useState<(ProviderProfile & BaseProfile) | null>(null);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderProfile = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      // Fetch base profile first
      const { data: baseProfile, error: baseError } = await supabase
        .from('users')
        .select('full_name, phone, avatar_url, bio, created_at')
        .eq('id', userId)
        .single();

      if (baseError) throw baseError;

      // Fetch provider profile
      const { data: providerData, error: providerError } = await supabase
        .from('provider_details')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (providerError) throw providerError;

      // Combine the data
      setProfile({
        ...providerData,
        ...baseProfile,
      });

      // Fetch booking stats
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('created_at')
        .eq('provider_id', userId);

      if (!jobsError && jobsData) {
        const memberSince = new Date(baseProfile.created_at || '').getFullYear().toString();
        setStats({
          total_bookings: jobsData.length,
          member_since: memberSince
        });
      }

      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching provider profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateProviderProfile = async (updates: Partial<ProviderProfile & BaseProfile>) => {
    if (!userId) return;

    try {
      // Separate provider-specific and base profile updates
      const { full_name, phone, avatar_url, bio, ...providerUpdates } = updates;
      
      // Update base profile if there are base profile fields
      if (full_name !== undefined || phone !== undefined || avatar_url !== undefined || bio !== undefined) {
        const { error: profileError } = await supabase
          .from('users')
          .update({ full_name, phone, avatar_url, bio })
          .eq('id', userId);

        if (profileError) throw profileError;
      }

      // Update provider profile if there are provider-specific fields
      if (Object.keys(providerUpdates).length > 0) {
        const { error } = await supabase
          .from('provider_details')
          .update(providerUpdates)
          .eq('user_id', userId);

        if (error) throw error;
      }

      await fetchProviderProfile();
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err };
    }
  };

  useEffect(() => {
    fetchProviderProfile();
  }, [userId]);

  return {
    profile,
    stats,
    loading,
    error,
    refetch: fetchProviderProfile,
    updateProfile: updateProviderProfile
  };
};
