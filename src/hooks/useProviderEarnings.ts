import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MonthlyEarning {
  month: string;
  amount: number;
}

export interface RecentPaidInvoice {
  invoiceId: string;
  jobTitle: string;
  paidDate: string;
  amountReceived: number;
}

export interface OutstandingInvoice {
  invoiceId: string;
  jobTitle: string;
  amountOwed: number;
  createdAt: string;
}

export interface EarningsTotals {
  lifetimeEarnings: number;
  ytdEarnings: number;
  outstandingAmount: number;
  paidInvoicesCount: number;
}

export interface ProviderEarningsData {
  totals: EarningsTotals;
  monthly: MonthlyEarning[];
  recentPaid: RecentPaidInvoice[];
  outstanding: OutstandingInvoice[];
}

export const useProviderEarnings = () => {
  const { user } = useAuth();
  const [data, setData] = useState<ProviderEarningsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEarnings = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: session } = await supabase.auth.getSession();
      if (!session?.session?.access_token) {
        throw new Error("No active session");
      }

      const { data: responseData, error: fnError } = await supabase.functions.invoke(
        "list-provider-earnings",
        {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        }
      );

      if (fnError) {
        throw fnError;
      }

      if (responseData?.error) {
        throw new Error(responseData.error);
      }

      setData(responseData);
    } catch (err: any) {
      console.error("Error fetching provider earnings:", err);
      setError(err.message || "Error al cargar las ganancias");
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchEarnings();
  }, [fetchEarnings]);

  return {
    totals: data?.totals || null,
    monthly: data?.monthly || [],
    recentPaid: data?.recentPaid || [],
    outstanding: data?.outstanding || [],
    loading,
    error,
    refetch: fetchEarnings,
  };
};
