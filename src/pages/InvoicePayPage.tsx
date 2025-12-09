import { useParams, useNavigate } from "react-router-dom";
import { useInvoice } from "@/hooks/useInvoice";
import { PayInvoiceButton } from "@/components/PayInvoiceButton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  ArrowLeft, 
  FileText, 
  User, 
  MapPin, 
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const InvoicePayPage = () => {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  
  const {
    invoice,
    invoiceItems,
    provider,
    job,
    clientSecret,
    paymentIntentStatus,
    loading,
    error,
    refetch,
  } = useInvoice(invoiceId || null);

  const handlePaymentSuccess = () => {
    toast.success("¡Pago exitoso!", {
      description: "Tu factura ha sido pagada correctamente.",
    });
    refetch();
  };

  const handlePaymentError = (errorMsg: string) => {
    toast.error("Error en el pago", {
      description: errorMsg,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
      case "succeeded":
        return (
          <Badge variant="default" className="bg-success text-success-foreground">
            <CheckCircle className="mr-1 h-3 w-3" />
            Pagado
          </Badge>
        );
      case "pending_payment":
      case "requires_payment_method":
      case "requires_confirmation":
        return (
          <Badge variant="secondary">
            <Clock className="mr-1 h-3 w-3" />
            Pendiente
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline">
            <Clock className="mr-1 h-3 w-3 animate-spin" />
            Procesando
          </Badge>
        );
      case "failed":
      case "canceled":
        return (
          <Badge variant="destructive">
            <AlertCircle className="mr-1 h-3 w-3" />
            Fallido
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            {status}
          </Badge>
        );
    }
  };

  const isPaid = invoice?.status === "paid" || paymentIntentStatus === "succeeded";
  const canPay = !isPaid && clientSecret && invoice?.status === "pending_payment";

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-12 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          
          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Error al cargar la factura</h2>
              <p className="text-muted-foreground text-center">
                {error || "No se pudo encontrar la factura solicitada."}
              </p>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="mt-4"
              >
                Intentar de nuevo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          {getStatusBadge(paymentIntentStatus || invoice.status)}
        </div>

        {/* Invoice Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              <CardTitle>Factura</CardTitle>
            </div>
            <CardDescription>
              Creada el {format(new Date(invoice.created_at), "d 'de' MMMM, yyyy", { locale: es })}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Provider Info */}
            {provider && (
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                <div>
                  <p className="font-medium">{provider.full_name || "Proveedor"}</p>
                  {provider.email && (
                    <p className="text-sm text-muted-foreground">{provider.email}</p>
                  )}
                </div>
              </div>
            )}

            {/* Job Info */}
            {job && (
              <div className="space-y-2">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                  Trabajo
                </h3>
                <div className="p-4 border rounded-lg space-y-2">
                  <p className="font-medium">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.category}</p>
                  {job.location && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{job.location}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Invoice Items */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
                Conceptos
              </h3>
              <div className="space-y-2">
                {invoiceItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{item.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} x ${item.unit_price.toFixed(2)}
                      </p>
                    </div>
                    <p className="font-semibold">
                      ${item.total.toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal (Proveedor)</span>
                <span>${invoice.subtotal_provider.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Comisión de servicio (15%)</span>
                <span>${invoice.chamby_commission_amount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>Total</span>
                <span className="text-primary">
                  ${invoice.total_customer_amount.toFixed(2)} USD
                </span>
              </div>
            </div>

            {/* Provider Notes */}
            {invoice.provider_notes && (
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-medium text-sm mb-2">Notas del proveedor</h4>
                <p className="text-sm text-muted-foreground">{invoice.provider_notes}</p>
              </div>
            )}

            {/* Payment Button */}
            {canPay && clientSecret && (
              <div className="pt-4">
                <PayInvoiceButton
                  clientSecret={clientSecret}
                  amount={invoice.total_customer_amount}
                  currency="USD"
                  onSuccess={handlePaymentSuccess}
                  onError={handlePaymentError}
                  className="w-full"
                />
              </div>
            )}

            {/* Already Paid Message */}
            {isPaid && (
              <div className="flex items-center justify-center gap-2 p-4 bg-success/10 text-success rounded-lg">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Esta factura ya ha sido pagada</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InvoicePayPage;
