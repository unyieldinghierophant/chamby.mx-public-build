import { useUserCredit } from "@/hooks/useUserCredit";
import { Gift } from "lucide-react";

interface CreditLineItemProps {
  totalAmount: number;
}

export function CreditLineItem({ totalAmount }: CreditLineItemProps) {
  const { credit, hasCredit, creditAmount } = useUserCredit();

  if (!hasCredit || !credit) return null;

  // Apply credit up to the total amount
  const appliedCredit = Math.min(creditAmount, totalAmount);

  return (
    <div className="flex justify-between items-center text-sm">
      <span className="flex items-center gap-1.5 text-primary font-medium">
        <Gift className="h-3.5 w-3.5" />
        Crédito Chamby
      </span>
      <span className="text-primary font-semibold">-${appliedCredit.toFixed(2)}</span>
    </div>
  );
}

/**
 * Helper to calculate the effective total after credit
 */
export function useEffectiveTotal(totalAmount: number) {
  const { hasCredit, creditAmount } = useUserCredit();
  const appliedCredit = hasCredit ? Math.min(creditAmount, totalAmount) : 0;
  const effectiveTotal = Math.max(0, totalAmount - appliedCredit);
  return { effectiveTotal, appliedCredit, hasCredit };
}
