import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CompleteFirstVisitResult {
  success: boolean;
  message: string;
  payment_action?: string;
  payment_intent_id?: string;
  payment_intent_status?: string;
  already_completed?: boolean;
}

interface UseCompleteFirstVisitReturn {
  completeFirstVisit: (jobId: string, action?: "capture" | "release") => Promise<CompleteFirstVisitResult>;
  loading: boolean;
  error: string | null;
}

export const useCompleteFirstVisit = (): UseCompleteFirstVisitReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeFirstVisit = async (
    jobId: string, 
    action: "capture" | "release" = "capture"
  ): Promise<CompleteFirstVisitResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "complete-first-visit",
        {
          body: { jobId, action },
        }
      );

      if (invokeError) {
        throw new Error(invokeError.message);
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      return {
        success: data.success,
        message: data.message,
        payment_action: data.payment_action,
        payment_intent_id: data.payment_intent_id,
        payment_intent_status: data.payment_intent_status,
        already_completed: data.already_completed,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An error occurred";
      setError(errorMessage);
      return {
        success: false,
        message: errorMessage,
      };
    } finally {
      setLoading(false);
    }
  };

  return {
    completeFirstVisit,
    loading,
    error,
  };
};
