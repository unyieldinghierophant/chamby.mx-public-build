import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, CheckCircle, AlertCircle, ShieldCheck } from "lucide-react";
import { confirmInvoicePayment, ConfirmPaymentResult } from "@/utils/confirmInvoicePayment";
import { cn } from "@/lib/utils";

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
  currency = "MXN",
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
      setErrorMessage("No hay información de pago disponible");
      setStatus("error");
      onError?.("No hay información de pago disponible");
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
        setErrorMessage(result.error || "El pago ha fallado");
        onError?.(result.error || "El pago ha fallado");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ha ocurrido un error inesperado";
      setStatus("error");
      setErrorMessage(message);
      onError?.(message);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amt);
  };

  if (status === "success") {
    return (
      <div className={cn(
        "flex flex-col items-center gap-2 sm:gap-3 p-4 sm:p-6 bg-green-50 rounded-xl border border-green-200 animate-in fade-in zoom-in duration-300",
        className
      )}>
        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-green-800 text-sm sm:text-base">¡Pago exitoso!</p>
          <p className="text-xs sm:text-sm text-green-600">Tu pago ha sido procesado</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2 sm:space-y-3", className)}>
      <Button
        onClick={handlePayment}
        disabled={disabled || loading || !clientSecret}
        size="lg"
        className={cn(
          "w-full h-12 sm:h-14 text-sm sm:text-base font-semibold transition-all duration-200",
          "bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl",
          loading && "opacity-90"
        )}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
            <span>Procesando pago...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Pagar {formatAmount(amount)}</span>
          </div>
        )}
      </Button>

      {/* Stripe Trust Badge */}
      {status !== "error" && (
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-green-600" />
          <span>Pago seguro con Stripe</span>
        </div>
      )}

      {/* Error State */}
      {status === "error" && errorMessage && (
        <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="w-7 h-7 sm:w-8 sm:h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-red-800 text-xs sm:text-sm">Error en el pago</p>
            <p className="text-xs sm:text-sm text-red-600 mt-0.5 break-words">{errorMessage}</p>
            <button
              onClick={handlePayment}
              className="text-xs sm:text-sm text-red-700 hover:text-red-800 font-medium mt-2 underline underline-offset-2"
            >
              Intentar de nuevo
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
