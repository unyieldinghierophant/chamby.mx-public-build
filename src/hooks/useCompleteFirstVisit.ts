import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type VisitAction = 
  | "capture" 
  | "release" 
  | "provider_confirm" 
  | "client_confirm" 
  | "client_dispute"
  | "admin_resolve_capture"
  | "admin_resolve_release";

interface CompleteFirstVisitResult {
  success: boolean;
  message: string;
  payment_action?: string;
  payment_intent_id?: string;
  payment_intent_status?: string;
  already_completed?: boolean;
  already_confirmed?: boolean;
  confirmation_deadline?: string;
}

interface UseCompleteFirstVisitReturn {
  completeFirstVisit: (jobId: string, action?: VisitAction, disputeReason?: string) => Promise<CompleteFirstVisitResult>;
  providerConfirmVisit: (jobId: string) => Promise<CompleteFirstVisitResult>;
  clientConfirmVisit: (jobId: string) => Promise<CompleteFirstVisitResult>;
  clientDisputeVisit: (jobId: string, reason: string) => Promise<CompleteFirstVisitResult>;
  adminResolveCapture: (jobId: string) => Promise<CompleteFirstVisitResult>;
  adminResolveRelease: (jobId: string) => Promise<CompleteFirstVisitResult>;
  loading: boolean;
  error: string | null;
}

export const useCompleteFirstVisit = (): UseCompleteFirstVisitReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const completeFirstVisit = async (
    jobId: string, 
    action: VisitAction = "capture",
    disputeReason?: string
  ): Promise<CompleteFirstVisitResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "complete-first-visit",
        {
          body: { jobId, action, disputeReason },
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
        already_confirmed: data.already_confirmed,
        confirmation_deadline: data.confirmation_deadline,
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

  const providerConfirmVisit = async (jobId: string) => {
    return completeFirstVisit(jobId, "provider_confirm");
  };

  const clientConfirmVisit = async (jobId: string) => {
    return completeFirstVisit(jobId, "client_confirm");
  };

  const clientDisputeVisit = async (jobId: string, reason: string) => {
    return completeFirstVisit(jobId, "client_dispute", reason);
  };

  const adminResolveCapture = async (jobId: string) => {
    return completeFirstVisit(jobId, "admin_resolve_capture");
  };

  const adminResolveRelease = async (jobId: string) => {
    return completeFirstVisit(jobId, "admin_resolve_release");
  };

  return {
    completeFirstVisit,
    providerConfirmVisit,
    clientConfirmVisit,
    clientDisputeVisit,
    adminResolveCapture,
    adminResolveRelease,
    loading,
    error,
  };
};
