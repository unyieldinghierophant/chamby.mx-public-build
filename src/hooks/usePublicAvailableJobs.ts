import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface PublicJob {
  title: string;
  category: string;
  rate: number;
  location: string | null;
}

export const extractCity = (location: string | null): string => {
  if (!location) return 'México';
  
  // Buscar patrón: "44639 Guadalajara" o similar
  const match = location.match(/\d{5}\s+([^,]+)/);
  if (match) return match[1].trim();
  
  // Fallback: último segmento antes del país
  const parts = location.split(',');
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 3] || parts[parts.length - 2];
    return cityPart.replace(/\d+/g, '').trim() || 'México';
  }
  
  return 'México';
};

export const usePublicAvailableJobs = () => {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const { data, error } = await supabase
          .from('jobs')
          .select('title, category, rate, location')
          .eq('status', 'active')
          .is('provider_id', null)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) {
          console.error('Error fetching public jobs:', error);
          return;
        }

        if (data) {
          setJobs(data);
        }
      } catch (err) {
        console.error('Error fetching public jobs:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  return { jobs, loading };
};
