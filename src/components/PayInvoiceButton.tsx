import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, CheckCircle, AlertCircle } from "lucide-react";
import { confirmInvoicePayment, ConfirmPaymentResult } from "@/utils/confirmInvoicePayment";

interface PayInvoiceButtonProps {
  clientSecret: string;
  amount: number;
  currency?: string;
  onSuccess?: (result: ConfirmPaymentResult) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  className?: string;
}

export const PayInvoiceButton = ({
  clientSecret,
  amount,
  currency = "USD",
  onSuccess,
  onError,
  disabled = false,
  className,
}: PayInvoiceButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePayment = async () => {
    if (!clientSecret) {
      setErrorMessage("No payment information available");
      setStatus("error");
      onError?.("No payment information available");
      return;
    }

    setLoading(true);
    setStatus("idle");
    setErrorMessage(null);

    try {
      const result = await confirmInvoicePayment(clientSecret);

      if (result.success) {
        setStatus("success");
        onSuccess?.(result);
      } else {
        setStatus("error");
        setErrorMessage(result.error || "Payment failed");
        onError?.(result.error || "Payment failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setStatus("error");
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amt: number) => {
    return amt.toLocaleString("en-US", {
      style: "currency",
      currency: currency,
    });
  };

  if (status === "success") {
    return (
      <div className="flex items-center gap-2 text-success">
        <CheckCircle className="h-5 w-5" />
        <span className="font-medium">Payment Successful!</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        onClick={handlePayment}
        disabled={disabled || loading || !clientSecret}
        className={className}
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            <CreditCard className="mr-2 h-4 w-4" />
            Pay {formatAmount(amount)}
          </>
        )}
      </Button>

      {status === "error" && errorMessage && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};
