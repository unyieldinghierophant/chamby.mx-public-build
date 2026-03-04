import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
  User,
  Clock
} from "lucide-react";
import { useVisitAuthorizationStatus } from "@/hooks/useVisitAuthorizationStatus";
import { useVisitAuthorization } from "@/hooks/useVisitAuthorization";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import { stripePromise } from "@/lib/stripe";

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

    // Note: PaymentElement doesn't return a reference via getElement,
    // we rely on onReady callback and timeout fallback instead

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      // Submit the elements first to ensure they're ready
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setErrorMessage(submitError.message || "Error al procesar el formulario");
        setIsProcessing(false);
        return;
      }

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
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      {errorMessage && (
        <Alert variant="destructive" className="text-sm">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs sm:text-sm">{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-3 sm:space-y-4">
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
        className="w-full h-12 sm:h-14 rounded-xl text-sm sm:text-base"
        disabled={!stripe || !isElementReady || isProcessing}
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            <span>Autorizando...</span>
          </>
        ) : !isElementReady ? (
          <>
            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
            <span>Cargando...</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            <span>Autorizar pago de visita</span>
          </>
        )}
      </ModernButton>

      <div className="flex items-center justify-center gap-1.5 sm:gap-2 text-xs text-muted-foreground">
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
      <div className="min-h-screen bg-background flex items-center justify-center px-4">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <Loader2 className="w-6 h-6 sm:w-8 sm:h-8 animate-spin text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground text-center">Cargando información de pago...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background px-3 py-4 sm:p-4">
        <div className="max-w-lg mx-auto pt-4 sm:pt-8">
          <Card className="border-destructive/20">
            <CardHeader className="pb-3 sm:pb-4">
              <CardTitle className="flex items-center gap-2 text-destructive text-base sm:text-lg">
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                Error
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
              </Alert>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <ModernButton
                  variant="outline"
                  onClick={() => navigate(-1)}
                  className="flex-1 h-10 sm:h-11 text-sm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </ModernButton>
                <ModernButton
                  variant="primary"
                  onClick={() => reload()}
                  className="flex-1 h-10 sm:h-11 text-sm"
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
      <div className="min-h-screen bg-background px-3 py-4 sm:p-4">
        <div className="max-w-lg mx-auto pt-4 sm:pt-8">
          <Card className="border-success/20">
            <CardContent className="py-8 sm:py-12 px-4 sm:px-6">
              <div className="text-center space-y-4 sm:space-y-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-success" />
                </div>
                <div className="space-y-2">
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    ¡Pago confirmado!
                  </h1>
                  <p className="text-sm sm:text-base text-muted-foreground px-2">
                    Estamos buscando un profesional verificado para tu servicio.
                    Te notificaremos en cuanto uno acepte (máximo 4 horas).
                  </p>
                </div>
                <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs sm:text-sm">
                  <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
                  $350 MXN — Visita asegurada
                </Badge>
                <ModernButton
                  variant="primary"
                  onClick={() => navigate(`/esperando-proveedor?job_id=${jobId}`)}
                  className="w-full h-11 sm:h-12 text-sm sm:text-base"
                >
                  Ver estado de búsqueda
                </ModernButton>
                <ModernButton
                  variant="outline"
                  onClick={() => navigate("/user-landing")}
                  className="w-full h-10 sm:h-11 text-sm"
                >
                  Volver al inicio
                </ModernButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-3 py-4 sm:p-4">
      <div className="max-w-lg mx-auto pt-2 sm:pt-4 space-y-4 sm:space-y-6">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver</span>
        </button>

        {/* Header */}
        <div className="text-center space-y-1.5 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl font-bold text-foreground">
            Visita y gestión de asignación
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Este pago cubre la visita técnica y la búsqueda de un profesional verificado
          </p>
        </div>

        {/* Job info card */}
        {status?.job && (
          <Card>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <div className="flex items-start gap-3 sm:gap-4">
                {status.provider ? (
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    <AvatarImage src={status.provider.avatarUrl || undefined} />
                    <AvatarFallback>
                      <User className="w-5 h-5 sm:w-6 sm:h-6" />
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <CreditCard className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  </div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <h3 className="font-semibold text-foreground text-sm sm:text-base truncate">
                    {status.job.title}
                  </h3>
                  {status.provider?.displayName && (
                    <p className="text-xs sm:text-sm text-muted-foreground truncate">
                      Proveedor: {status.provider.displayName}
                    </p>
                  )}
                  {status.job.scheduledAt && (
                    <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                      <Calendar className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">
                        {format(new Date(status.job.scheduledAt), "PPP", { locale: es })}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-shrink-0 hidden sm:block">
                  {getStatusBadge()}
                </div>
              </div>
              {/* Mobile status badge */}
              <div className="mt-3 sm:hidden">
                {getStatusBadge()}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Amount card */}
        <Card className="bg-primary/5 border-primary/10">
          <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5 sm:space-y-1">
                <p className="text-xs sm:text-sm text-muted-foreground">Visita + gestión de asignación</p>
                <p className="text-2xl sm:text-3xl font-bold text-foreground">
                  ${status?.amount || 350} <span className="text-base sm:text-lg">MXN</span>
                </p>
              </div>
              <ShieldCheck className="w-8 h-8 sm:w-10 sm:h-10 text-primary opacity-50 flex-shrink-0" />
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <Clock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                <span>Asignación de proveedor en máximo <strong>4 horas</strong></span>
              </div>
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <ShieldCheck className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-primary" />
                <span>Si no se asigna proveedor, puedes reagendar o solicitar reembolso</span>
              </div>
            </div>
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
