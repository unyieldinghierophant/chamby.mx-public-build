import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SavedLocation {
  id: string;
  user_id: string;
  label: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export const useSavedLocations = () => {
  const { user } = useAuth();
  const [locations, setLocations] = useState<SavedLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLocations = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('saved_locations')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      setLocations(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching saved locations:', err);
    } finally {
      setLoading(false);
    }
  };

  const addLocation = async (
    label: string,
    address: string,
    latitude?: number,
    longitude?: number,
    isDefault: boolean = false
  ) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      // If setting as default, unset other defaults first
      if (isDefault) {
        await supabase
          .from('saved_locations')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('saved_locations')
        .insert({
          user_id: user.id,
          label,
          address,
          latitude,
          longitude,
          is_default: isDefault
        })
        .select()
        .single();

      if (error) throw error;

      await fetchLocations();
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const updateLocation = async (
    id: string,
    updates: Partial<Omit<SavedLocation, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ) => {
    if (!user) return { data: null, error: 'User not authenticated' };

    try {
      // If setting as default, unset other defaults first
      if (updates.is_default) {
        await supabase
          .from('saved_locations')
          .update({ is_default: false })
          .eq('user_id', user.id);
      }

      const { data, error } = await supabase
        .from('saved_locations')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      await fetchLocations();
      return { data, error: null };
    } catch (err: any) {
      setError(err.message);
      return { data: null, error: err.message };
    }
  };

  const deleteLocation = async (id: string) => {
    if (!user) return { error: 'User not authenticated' };

    try {
      const { error } = await supabase
        .from('saved_locations')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchLocations();
      return { error: null };
    } catch (err: any) {
      setError(err.message);
      return { error: err.message };
    }
  };

  useEffect(() => {
    fetchLocations();
  }, [user]);

  return {
    locations,
    loading,
    error,
    refetch: fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation
  };
};
