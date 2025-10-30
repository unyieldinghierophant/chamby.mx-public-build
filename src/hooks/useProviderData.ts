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

      // Fetch completed jobs
      const { data: completedBookings, error: completedError } = await supabase
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("tasker_id", user.id)
        .eq("status", "completed");

      if (completedError) throw completedError;

      // Fetch active jobs
      const { data: activeBookings, error: activeError } = await supabase
        .from("bookings")
        .select("id", { count: "exact" })
        .eq("tasker_id", user.id)
        .in("status", ["pending", "confirmed", "in_progress"]);

      if (activeError) throw activeError;

      // Fetch earnings
      const { data: payments, error: paymentsError } = await supabase
        .from("bookings")
        .select("total_amount, payment_status")
        .eq("tasker_id", user.id);

      if (paymentsError) throw paymentsError;

      const totalEarnings = payments
        ?.filter((p) => p.payment_status === "paid")
        .reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

      const pendingEarnings = payments
        ?.filter((p) => p.payment_status === "pending")
        .reduce((sum, p) => sum + Number(p.total_amount), 0) || 0;

      // Fetch reviews
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
