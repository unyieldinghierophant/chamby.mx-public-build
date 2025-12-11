import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernButton } from "@/components/ui/modern-button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, CreditCard, CheckCircle, AlertCircle, RefreshCw, Lock } from "lucide-react";
import { useVisitAuthorization } from "@/hooks/useVisitAuthorization";

// Stripe publishable key for Chamby (LIVE mode)
const STRIPE_PUBLISHABLE_KEY = "pk_live_51RRBQ1RwXHQJiN84LxJOOY7p8s1eCMsDBd1W38VNjDECgJH5f4zLqyR0f1cqjXMfmBx5r2qM3Df3qNl0cqO1eL8400qK3sMxKt";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

interface VisitFeeAuthorizationSectionProps {
  jobId: string;
  onAuthorized?: () => void;
  onFailed?: (error: string) => void;
  onSkip?: () => void;
}

// Inner component that uses Stripe hooks
const VisitFeeForm = ({ 
  onAuthorized, 
  onFailed 
}: { 
  onAuthorized?: () => void; 
  onFailed?: (error: string) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/visit-authorization-complete`,
        },
        redirect: "if_required",
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message || "Error al autorizar el pago");
        onFailed?.(error.message || "Error al autorizar el pago");
      } else if (paymentIntent) {
        // For manual capture, 'requires_capture' means authorization was successful
        const isSuccessful = 
          paymentIntent.status === "requires_capture" || 
          paymentIntent.status === "succeeded" ||
          paymentIntent.status === "processing";
        
        if (isSuccessful) {
          setStatus("success");
          onAuthorized?.();
        } else if (paymentIntent.status === "requires_action") {
          setStatus("error");
          setErrorMessage("Se requiere autenticación adicional");
        } else {
          setStatus("error");
          setErrorMessage("No se pudo completar la autorización");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setStatus("error");
      setErrorMessage(message);
      onFailed?.(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRetry = () => {
    setStatus("idle");
    setErrorMessage(null);
  };

  if (status === "success") {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            Pago de visita preautorizado correctamente
          </h3>
          <p className="text-sm text-muted-foreground">
            $350 MXN han sido preautorizados en tu tarjeta. No se ha realizado ningún cargo todavía.
          </p>
        </div>
        <Badge variant="outline" className="bg-success/10 text-success border-success/20">
          <ShieldCheck className="w-4 h-4 mr-1" />
          Visita asegurada
        </Badge>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {status === "error" && errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={handleRetry}
              className="flex items-center gap-1 text-sm font-medium hover:underline"
            >
              <RefreshCw className="w-3 h-3" />
              Reintentar
            </button>
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-4">
        <PaymentElement 
          options={{
            layout: "tabs",
          }}
          onReady={() => setIsElementReady(true)}
          onLoadError={(error) => console.error('PaymentElement load error:', error)}
        />
      </div>

      <ModernButton
        type="submit"
        variant="primary"
        className="w-full h-14 rounded-xl"
        disabled={!stripe || !isElementReady || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Autorizando...
          </>
        ) : !isElementReady ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Cargando...
          </>
        ) : (
          <>
            <Lock className="w-5 h-5 mr-2" />
            Autorizar $350 MXN
          </>
        )}
      </ModernButton>

      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Lock className="w-3 h-3" />
        <span>Pago seguro procesado por Stripe</span>
      </div>
    </form>
  );
};

export const VisitFeeAuthorizationSection = ({
  jobId,
  onAuthorized,
  onFailed,
  onSkip,
}: VisitFeeAuthorizationSectionProps) => {
  const { createAuthorization, loading: authLoading, error: authError } = useVisitAuthorization();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const initializeAuthorization = async () => {
      try {
        setIsInitializing(true);
        setInitError(null);
        const result = await createAuthorization(jobId);
        setClientSecret(result.client_secret);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Error al inicializar";
        setInitError(message);
        onFailed?.(message);
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuthorization();
  }, [jobId]);

  if (isInitializing || authLoading) {
    return (
      <Card className="border-primary/20 bg-card">
        <CardContent className="py-12">
          <div className="flex flex-col items-center justify-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Preparando la autorización de pago...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (initError || authError) {
    return (
      <Card className="border-destructive/20 bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertCircle className="w-5 h-5" />
            Error de autorización
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {initError || authError || "No se pudo asegurar el pago de la visita. Intenta con otra tarjeta o método de pago."}
            </AlertDescription>
          </Alert>
          <div className="flex gap-3">
            <ModernButton
              variant="outline"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </ModernButton>
            {onSkip && (
              <ModernButton
                variant="outline"
                onClick={onSkip}
                className="flex-1 text-muted-foreground"
              >
                Continuar sin pagar
              </ModernButton>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!clientSecret) {
    return null;
  }

  return (
    <Card className="border-primary/20 bg-card overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10">
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-primary" />
          Asegurar tu visita
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {/* Explanation */}
        <div className="bg-muted/50 rounded-xl p-4 space-y-2">
          <div className="flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Para asegurar tu visita, vamos a preautorizar $350 MXN en tu tarjeta.
              </p>
              <p className="text-xs text-muted-foreground">
                No se te cobrará todavía; el cargo solo se realizará si el proveedor marca la primera visita como completada.
              </p>
            </div>
          </div>
        </div>

        {/* Stripe Elements */}
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "stripe",
              variables: {
                colorPrimary: "#22c55e",
                colorBackground: "#ffffff",
                colorText: "#1a1a2e",
                colorDanger: "#ef4444",
                fontFamily: "Inter, system-ui, sans-serif",
                borderRadius: "12px",
              },
            },
          }}
        >
          <VisitFeeForm onAuthorized={onAuthorized} onFailed={onFailed} />
        </Elements>
      </CardContent>
    </Card>
  );
};
