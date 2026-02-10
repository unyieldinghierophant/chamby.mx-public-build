import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewInfo {
  id: string;
  rating: number;
  comment: string | null;
  tags: string[];
  reviewer_role: string;
  visible_at: string | null;
  created_at: string;
}

interface JobRatingState {
  canRate: boolean;
  hasRated: boolean;
  otherHasRated: boolean;
  myReview: ReviewInfo | null;
  otherReview: ReviewInfo | null;
  loading: boolean;
}

/**
 * Hook to manage rating state for a specific job.
 * Determines if the current user can rate and if they already have.
 */
export const useJobRating = (jobId: string | undefined, jobStatus: string | undefined) => {
  const { user } = useAuth();
  const [state, setState] = useState<JobRatingState>({
    canRate: false,
    hasRated: false,
    otherHasRated: false,
    myReview: null,
    otherReview: null,
    loading: true,
  });

  const fetchRatingState = useCallback(async () => {
    if (!jobId || !user) {
      setState((prev) => ({ ...prev, loading: false }));
      return;
    }

    try {
      // Fetch both reviews for this job
      const { data: reviews } = await supabase
        .from("reviews")
        .select("id, rating, comment, tags, reviewer_role, visible_at, created_at")
        .eq("job_id", jobId);

      // Determine user's role in this job
      const { data: job } = await supabase
        .from("jobs")
        .select("client_id, provider_id, status")
        .eq("id", jobId)
        .single();

      if (!job) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const isClient = job.client_id === user.id;
      const isProvider = job.provider_id === user.id;
      const myRole = isClient ? "client" : isProvider ? "provider" : null;

      if (!myRole) {
        setState((prev) => ({ ...prev, loading: false }));
        return;
      }

      const myReview = reviews?.find((r) => r.reviewer_role === myRole) || null;
      const otherRole = myRole === "client" ? "provider" : "client";
      const otherReview = reviews?.find((r) => r.reviewer_role === otherRole) || null;

      // Check if invoice is accepted (required for rating)
      const { data: invoice } = await supabase
        .from("invoices")
        .select("status")
        .eq("job_id", jobId)
        .in("status", ["accepted"])
        .maybeSingle();

      const isCompleted = job.status === "completed";
      const hasAcceptedInvoice = !!invoice;
      const canRate = isCompleted && hasAcceptedInvoice && !myReview;

      // Check visibility: visible if both rated or visible_at has passed
      const now = new Date();
      const otherVisible = otherReview
        ? (otherReview.visible_at ? new Date(otherReview.visible_at) <= now : false)
        : false;

      setState({
        canRate,
        hasRated: !!myReview,
        otherHasRated: !!otherReview,
        myReview: myReview as ReviewInfo | null,
        otherReview: otherVisible ? (otherReview as ReviewInfo | null) : null,
        loading: false,
      });
    } catch (err) {
      console.error("Error fetching rating state:", err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, [jobId, user]);

  useEffect(() => {
    fetchRatingState();
  }, [fetchRatingState, jobStatus]);

  return { ...state, refetch: fetchRatingState };
};
