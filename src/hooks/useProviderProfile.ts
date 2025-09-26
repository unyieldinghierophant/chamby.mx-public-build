import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  bio: string | null;
  is_tasker: boolean;
  verification_status: string;
  created_at: string;
  updated_at: string;
  hourly_rate: number | null;
  rating: number | null;
  total_reviews: number | null;
  skills: string[] | null;
}

interface BookingStats {
  total_bookings: number;
  member_since: string;
}

export const useProviderProfile = (providerId: string) => {
  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [stats, setStats] = useState<BookingStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviderProfile = async () => {
    try {
      // Fetch provider profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', providerId)
        .eq('is_tasker', true)
        .single();

      if (profileError) {
        throw profileError;
      }

      setProfile(profileData);

      // Fetch booking stats
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('created_at')
        .eq('tasker_id', profileData?.user_id || '');

      if (!bookingsError && bookingsData) {
        const memberSince = new Date(profileData?.created_at || '').getFullYear().toString();
        setStats({
          total_bookings: bookingsData.length,
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

  useEffect(() => {
    if (providerId) {
      fetchProviderProfile();
    }
  }, [providerId]);

  return {
    profile,
    stats,
    loading,
    error,
    refetch: fetchProviderProfile
  };
};