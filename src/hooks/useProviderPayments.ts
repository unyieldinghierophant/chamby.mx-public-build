import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PaymentMethod {
  id: string;
  bank_name: string;
  account_number: string;
  clabe: string | null;
  account_holder_name: string;
  is_default: boolean;
}

export interface PaymentStats {
  availableBalance: number;
  pendingBalance: number;
  totalEarnings: number;
  paymentHistory: Array<{
    id: string;
    amount: number;
    type: string;
    status: string;
    transaction_id: string | null;
    created_at: string;
  }>;
}

export const useProviderPayments = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<PaymentStats>({
    availableBalance: 0,
    pendingBalance: 0,
    totalEarnings: 0,
    paymentHistory: [],
  });
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPaymentData();
    }
  }, [user]);

  const fetchPaymentData = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch payments
      const { data: payments, error: paymentsError } = await supabase
        .from("payments")
        .select("*")
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (paymentsError) throw paymentsError;

      // Calculate balances
      const availableBalance = payments
        ?.filter((p) => p.status === "released" && !p.withdrawn_at)
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const pendingBalance = payments
        ?.filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      const totalEarnings = payments
        ?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      setStats({
        availableBalance,
        pendingBalance,
        totalEarnings,
        paymentHistory: payments?.map((p) => ({
          id: p.id,
          amount: Number(p.amount),
          type: p.type,
          status: p.status,
          transaction_id: p.transaction_id,
          created_at: p.created_at,
        })) || [],
      });

      // Fetch payment methods
      const { data: methods, error: methodsError } = await supabase
        .from("provider_payment_methods")
        .select("*")
        .eq("provider_id", user.id);

      if (methodsError) throw methodsError;
      setPaymentMethods(methods || []);
    } catch (error: any) {
      console.error("Error fetching payment data:", error);
      toast.error("Error al cargar datos de pagos");
    } finally {
      setLoading(false);
    }
  };

  const addPaymentMethod = async (method: Omit<PaymentMethod, "id" | "is_default">) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("provider_payment_methods")
        .insert({
          provider_id: user.id,
          ...method,
          is_default: paymentMethods.length === 0,
        });

      if (error) throw error;

      toast.success("Método de pago agregado");
      await fetchPaymentData();
    } catch (error: any) {
      console.error("Error adding payment method:", error);
      toast.error("Error al agregar método de pago");
    }
  };

  const requestWithdrawal = async (amount: number) => {
    if (!user) return;

    try {
      const { error } = await supabase.from("payments").insert({
        provider_id: user.id,
        amount: -amount,
        type: "withdrawal",
        status: "pending",
      });

      if (error) throw error;

      toast.success("Solicitud de retiro enviada");
      await fetchPaymentData();
    } catch (error: any) {
      console.error("Error requesting withdrawal:", error);
      toast.error("Error al solicitar retiro");
    }
  };

  return {
    stats,
    paymentMethods,
    loading,
    addPaymentMethod,
    requestWithdrawal,
    refetch: fetchPaymentData,
  };
};
