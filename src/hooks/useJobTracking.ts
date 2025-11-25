import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface JobWithProvider {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  status: string;
  rate: number;
  scheduled_at: string | null;
  provider_id: string | null;
  provider?: {
    id: string;
    full_name: string;
    phone: string;
    avatar_url: string;
    current_latitude: number | null;
    current_longitude: number | null;
    rating: number;
    total_reviews: number;
  };
}

export const useJobTracking = (jobId: string | null) => {
  const [job, setJob] = useState<JobWithProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId) {
      setLoading(false);
      return;
    }

    fetchJob();

    // Subscribe to real-time updates for provider location
    const channel = supabase
      .channel(`job-tracking-${jobId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'provider_details',
          filter: `user_id=eq.${job?.provider_id}`
        },
        () => {
          fetchJob();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  const fetchJob = async () => {
    if (!jobId) return;

    try {
      setLoading(true);

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      if (jobData.provider_id) {
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("full_name, phone, avatar_url")
          .eq("id", jobData.provider_id)
          .single();

        const { data: providerData, error: providerError } = await supabase
          .from("providers")
          .select("current_latitude, current_longitude, rating, total_reviews")
          .eq("user_id", jobData.provider_id)
          .single();

        if (!userError && !providerError && userData && providerData) {
          setJob({
            ...jobData,
            provider: {
              id: jobData.provider_id,
              ...userData,
              ...providerData,
            },
          });
        } else {
          setJob(jobData);
        }
      } else {
        setJob(jobData);
      }

      setError(null);
    } catch (err: any) {
      console.error("Error fetching job:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { job, loading, error, refetch: fetchJob };
};
