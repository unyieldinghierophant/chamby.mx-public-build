import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernButton } from "@/components/ui/modern-button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Loader2, 
  ShieldCheck, 
  CreditCard, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Lock,
  Calendar,
  ArrowLeft,
  User
} from "lucide-react";
import { useVisitAuthorizationStatus } from "@/hooks/useVisitAuthorizationStatus";
import { useVisitAuthorization } from "@/hooks/useVisitAuthorization";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Stripe publishable key for Chamby (LIVE mode)
const STRIPE_PUBLISHABLE_KEY = "pk_live_51RRBQ1RwXHQJiN84LxJOOY7p8s1eCMsDBd1W38VNjDECgJH5f4zLqyR0f1cqjXMfmBx5r2qM3Df3qNl0cqO1eL8400qK3sMxKt";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// Payment form component
const VisitPaymentForm = ({ 
  onSuccess,
  onError
}: { 
  onSuccess: () => void;
  onError: (error: string) => void;
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isElementReady, setIsElementReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Timeout fallback: if element doesn't report ready after 8 seconds, enable the button anyway
  useEffect(() => {
    if (stripe && elements && !isElementReady) {
      const timeout = setTimeout(() => {
        console.log('[VisitPaymentForm] Timeout reached, enabling button as fallback');
        setIsElementReady(true);
      }, 8000);
      return () => clearTimeout(timeout);
    }
  }, [stripe, elements, isElementReady]);

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
        setErrorMessage(error.message || "Error al autorizar el pago");
        onError(error.message || "Error al autorizar el pago");
      } else if (paymentIntent) {
        const isSuccessful = 
          paymentIntent.status === "requires_capture" || 
          paymentIntent.status === "succeeded" ||
          paymentIntent.status === "processing";
        
        if (isSuccessful) {
          onSuccess();
        } else if (paymentIntent.status === "requires_action") {
          setErrorMessage("Se requiere autenticación adicional");
        } else {
          setErrorMessage("No se pudo completar la autorización");
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error inesperado";
      setErrorMessage(message);
      onError(message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
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
            Autorizar pago de visita
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

const VisitFeePaymentPage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { status, loading, error, fetchStatus, reload } = useVisitAuthorizationStatus();
  const { createAuthorization, loading: creatingAuth } = useVisitAuthorization();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreatingPI, setIsCreatingPI] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  useEffect(() => {
    if (jobId) {
      fetchStatus(jobId);
    }
  }, [jobId, fetchStatus]);

  useEffect(() => {
    // If we have a status with clientSecret, use it
    if (status?.clientSecret) {
      setClientSecret(status.clientSecret);
    }
    // If already authorized or paid, show success
    if (status?.status === "authorized" || status?.status === "paid") {
      setPaymentSuccess(true);
    }
  }, [status]);

  const handleCreateAuthorization = async () => {
    if (!jobId) return;
    
    setIsCreatingPI(true);
    try {
      const result = await createAuthorization(jobId);
      setClientSecret(result.client_secret);
    } catch (err) {
      console.error("Failed to create authorization:", err);
    } finally {
      setIsCreatingPI(false);
    }
  };

  const handlePaymentSuccess = () => {
    setPaymentSuccess(true);
  };

  const handlePaymentError = (errorMsg: string) => {
    console.error("Payment error:", errorMsg);
  };

  const handleRetry = async () => {
    setClientSecret(null);
    if (jobId) {
      await reload();
    }
  };

  const getStatusBadge = () => {
    if (!status) return null;

    switch (status.status) {
      case "authorized":
      case "paid":
        return (
          <Badge variant="outline" className="bg-success/10 text-success border-success/20">
            <ShieldCheck className="w-4 h-4 mr-1" />
            Pago asegurado
          </Badge>
        );
      case "requires_payment_method":
      case "requires_confirmation":
      case "requires_action":
      case "needs_creation":
        return (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
            <AlertCircle className="w-4 h-4 mr-1" />
            Pendiente de pago
          </Badge>
        );
      case "canceled":
        return (
          <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
            <AlertCircle className="w-4 h-4 mr-1" />
            Pago cancelado
          </Badge>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Cargando información de pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto pt-8">
          <Card className="border-destructive/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex gap-3">
                <ModernButton
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={() => reload()}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reintentar
                </ModernButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-lg mx-auto pt-8">
          <Card className="border-success/20">
            <CardContent className="py-12">
              <div className="text-center space-y-6">
                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-success" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-foreground">
                    ¡Visita asegurada!
                  </h1>
                  <p className="text-muted-foreground">
                    Tu pago de visita ha sido preautorizado correctamente. 
                    El cargo solo se realizará cuando el proveedor complete la primera visita.
                  </p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  $350 MXN preautorizados
                </Badge>
                <ModernButton
                  variant="primary"
                  onClick={() => navigate("/active-jobs")}
                  className="w-full"
                >
                  Ver mis trabajos
                </ModernButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto pt-4 space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-foreground">
            Asegurar pago de visita
          </h1>
          <p className="text-muted-foreground">
            Completa el pago para asegurar tu visita
          </p>
        </div>

        {/* Job info card */}
        {status?.job && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                {status.provider ? (
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={status.provider.avatarUrl || undefined} />
                    <AvatarFallback>
                      <User className="w-6 h-6" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 space-y-1">
                  <h3 className="font-semibold text-foreground">
                    {status.job.title}
                  </h3>
                  {status.provider?.displayName && (
                    <p className="text-sm text-muted-foreground">
                      Proveedor: {status.provider.displayName}
                    </p>
                  )}
                  {status.job.scheduledAt && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3" />
                      <span>
                        {format(new Date(status.job.scheduledAt), "PPP", { locale: es })}
                      </span>
                    </div>
                  )}
                </div>
                {getStatusBadge()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Amount card */}
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Monto a preautorizar</p>
                <p className="text-3xl font-bold text-foreground">
                  ${status?.amount || 350} <span className="text-lg">MXN</span>
                </p>
              </div>
              <ShieldCheck className="w-10 h-10 text-primary opacity-50" />
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Este monto se preautoriza en tu tarjeta pero no se cobra hasta que el proveedor complete la visita.
            </p>
          </CardContent>
        </Card>

        {/* Payment form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-primary" />
              Método de pago
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Need to create new PI */}
            {(status?.needsCreation || status?.status === "canceled") && !clientSecret && (
              <div className="space-y-4">
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {status.status === "canceled" 
                      ? "La autorización anterior fue cancelada. Necesitas crear una nueva."
                      : "Necesitas autorizar el pago de visita para continuar."}
                  </AlertDescription>
                </Alert>
                <ModernButton
                  variant="primary"
                  onClick={handleCreateAuthorization}
                  disabled={isCreatingPI || creatingAuth}
                  className="w-full"
                >
                  {isCreatingPI || creatingAuth ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Preparando...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Iniciar autorización
                    </>
                  )}
                </ModernButton>
              </div>
            )}

            {/* Have client secret - show Stripe form */}
            {clientSecret && (
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
                <VisitPaymentForm 
                  onSuccess={handlePaymentSuccess} 
                  onError={handlePaymentError}
                />
              </Elements>
            )}

            {/* Retry button if there's an issue */}
            {!clientSecret && !status?.needsCreation && status?.status !== "canceled" && (
              <ModernButton
                variant="outline"
                onClick={handleRetry}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Actualizar estado
              </ModernButton>
            )}
          </CardContent>
        </Card>

        {/* Help link */}
        <div className="text-center">
          <button className="text-sm text-muted-foreground hover:text-primary transition-colors">
            ¿Tienes dudas sobre este pago?
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisitFeePaymentPage;
