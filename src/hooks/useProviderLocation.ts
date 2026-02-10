import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ProviderLocation {
  latitude: number;
  longitude: number;
}

export const useProviderLocation = () => {
  const { user } = useAuth();
  const [location, setLocation] = useState<ProviderLocation | null>(null);
  const [loading, setLoading] = useState(true);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const saveLocation = useCallback(async (lat: number, lng: number) => {
    if (!user) return;
    await supabase
      .from('providers')
      .update({
        current_latitude: lat,
        current_longitude: lng,
        last_location_update: new Date().toISOString(),
      })
      .eq('user_id', user.id);
    setLocation({ latitude: lat, longitude: lng });
  }, [user]);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setPermissionDenied(true);
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        await saveLocation(lat, lng);
        setPermissionDenied(false);
        setLoading(false);
      },
      () => {
        setPermissionDenied(true);
        setLoading(false);
      },
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, [saveLocation]);

  // On mount, try to load saved location from DB, then try browser
  useEffect(() => {
    if (!user) { setLoading(false); return; }

    const loadSaved = async () => {
      const { data } = await supabase
        .from('providers')
        .select('current_latitude, current_longitude')
        .eq('user_id', user.id)
        .single();

      if (data?.current_latitude && data?.current_longitude) {
        setLocation({ latitude: data.current_latitude, longitude: data.current_longitude });
        setLoading(false);
        // Also try to refresh in background
        requestLocation();
      } else {
        requestLocation();
      }
    };

    loadSaved();
  }, [user, requestLocation]);

  return { location, loading, permissionDenied, requestLocation };
};

/**
 * Calculate distance between two coordinates in km (Haversine)
 */
export const calculateDistanceKm = (
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};
