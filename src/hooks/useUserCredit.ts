import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserCredit {
  id: string;
  amount: number;
  expires_at: string;
  redeemed_at: string | null;
}

export function useUserCredit() {
  const { user } = useAuth();

  const { data: credit, isLoading } = useQuery({
    queryKey: ["user-credit", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<UserCredit | null> => {
      const { data, error } = await (supabase as any)
        .from("user_credits")
        .select("id, amount, expires_at, redeemed_at")
        .eq("user_id", user!.id)
        .is("redeemed_at", null)
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user credit:", error);
        return null;
      }

      return data as UserCredit | null;
    },
  });

  return {
    credit,
    hasCredit: !!credit,
    creditAmount: credit?.amount ?? 0,
    isLoading,
  };
}
