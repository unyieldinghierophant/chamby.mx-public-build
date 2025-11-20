import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ProviderStats {
  completedJobs: number;
  activeJobs: number;
  totalEarnings: number;
  pendingEarnings: number;
  rating: number;
  totalReviews: number;
}

export const useProviderData = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<ProviderStats>({
    completedJobs: 0,
    activeJobs: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    rating: 0,
    totalReviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    fetchProviderStats();
  }, [user]);

  const fetchProviderStats = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch provider details
      const { data: providerDetails } = await supabase
        .from("provider_details")
        .select("rating, total_reviews")
        .eq("user_id", user.id)
        .single();

      // Fetch completed jobs using provider_id (user.id)
      const { data: completedBookings, error: completedError } = await supabase
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("provider_id", user.id)
        .eq("status", "completed");

      if (completedError) throw completedError;

      // Fetch active jobs using provider_id
      const { data: activeBookings, error: activeError } = await supabase
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("provider_id", user.id)
        .in("status", ["assigned", "in_progress", "scheduled"]);

      if (activeError) throw activeError;

      // Fetch earnings using provider_id
      const { data: payments, error: paymentsError } = await supabase
        .from("jobs")
        .select("total_amount")
        .eq("provider_id", user.id)
        .eq("status", "completed");

      if (paymentsError) throw paymentsError;

      const totalEarnings = payments
        ?.reduce((sum, p) => sum + Number(p.total_amount || 0), 0) || 0;

      const pendingEarnings = 0; // No payment status anymore

      // Fetch reviews using auth user_id (reviews.provider_id references auth.users.id)
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", user.id);

      if (reviewsError) throw reviewsError;

      const avgRating = reviews?.length
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

      setStats({
        completedJobs: completedBookings?.length || 0,
        activeJobs: activeBookings?.length || 0,
        totalEarnings,
        pendingEarnings,
        rating: avgRating,
        totalReviews: reviews?.length || 0,
      });

      setError(null);
    } catch (err: any) {
      console.error("Error fetching provider stats:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    error,
    refetch: fetchProviderStats,
  };
};
