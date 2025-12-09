import { useParams, useNavigate } from "react-router-dom";
import { useInvoice } from "@/hooks/useInvoice";
import { PayInvoiceButton } from "@/components/PayInvoiceButton";
import { Card, CardContent } from "@/components/ui/card";
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
  AlertCircle,
  Shield,
  CreditCard
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
          <Badge className="bg-green-500/20 text-green-600 border-green-500/30 px-3 py-1">
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Pagada
          </Badge>
        );
      case "pending_payment":
      case "requires_payment_method":
      case "requires_confirmation":
        return (
          <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30 px-3 py-1">
            <Clock className="mr-1.5 h-3.5 w-3.5" />
            Pendiente de pago
          </Badge>
        );
      case "processing":
        return (
          <Badge className="bg-blue-500/20 text-blue-600 border-blue-500/30 px-3 py-1">
            <Clock className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            Procesando
          </Badge>
        );
      case "failed":
      case "canceled":
        return (
          <Badge className="bg-red-500/20 text-red-600 border-red-500/30 px-3 py-1">
            <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
            Fallido
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="px-3 py-1">
            {status}
          </Badge>
        );
    }
  };

  const shortenId = (id: string) => {
    return `INV-${id.slice(0, 8).toUpperCase()}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const isPaid = invoice?.status === "paid" || paymentIntentStatus === "succeeded";
  const canPay = !isPaid && clientSecret && invoice?.status === "pending_payment";

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-32" />
          <Card className="border-0 shadow-xl">
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between">
                <Skeleton className="h-10 w-40" />
                <Skeleton className="h-6 w-24" />
              </div>
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          
          <Card className="border-destructive/20 shadow-xl">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Error al cargar la factura</h2>
              <p className="text-muted-foreground text-center max-w-md">
                {error || "No se pudo encontrar la factura solicitada."}
              </p>
              <Button
                onClick={() => refetch()}
                className="mt-6"
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        {/* Main Invoice Card */}
        <Card className="border-0 shadow-xl overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold">Factura</h1>
                </div>
                <p className="text-primary-foreground/80 font-mono text-sm">
                  {shortenId(invoice.id)}
                </p>
              </div>
              <div className="text-left md:text-right">
                {getStatusBadge(paymentIntentStatus || invoice.status)}
                <p className="text-primary-foreground/80 text-sm mt-2 flex items-center md:justify-end gap-1.5">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(invoice.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 md:p-8 space-y-8">
            {/* Provider & Job Info */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Provider Info */}
              {provider && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Proveedor
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">
                        {provider.full_name || "Proveedor"}
                      </p>
                      {provider.email && (
                        <p className="text-sm text-muted-foreground">{provider.email}</p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Job Info */}
              {job && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                    Trabajo
                  </p>
                  <p className="font-semibold text-foreground mb-1">{job.title}</p>
                  <p className="text-sm text-muted-foreground mb-2">{job.category}</p>
                  {job.location && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{job.location}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Invoice Items Table */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
                Detalle de servicios
              </p>
              <div className="border rounded-xl overflow-hidden">
                {/* Table Header */}
                <div className="hidden md:grid md:grid-cols-12 gap-4 bg-slate-50 p-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  <div className="col-span-6">Descripción</div>
                  <div className="col-span-2 text-center">Cantidad</div>
                  <div className="col-span-2 text-right">Precio Unit.</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                
                {/* Table Body */}
                <div className="divide-y divide-slate-100">
                  {invoiceItems.map((item) => (
                    <div
                      key={item.id}
                      className="grid md:grid-cols-12 gap-2 md:gap-4 p-4 items-center"
                    >
                      <div className="md:col-span-6">
                        <p className="font-medium text-foreground">{item.description}</p>
                        <p className="text-sm text-muted-foreground md:hidden">
                          {item.quantity} × {formatCurrency(item.unit_price)}
                        </p>
                      </div>
                      <div className="hidden md:block md:col-span-2 text-center text-muted-foreground">
                        {item.quantity}
                      </div>
                      <div className="hidden md:block md:col-span-2 text-right text-muted-foreground">
                        {formatCurrency(item.unit_price)}
                      </div>
                      <div className="md:col-span-2 text-right font-semibold">
                        {formatCurrency(item.total)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Totals Section */}
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-3 bg-slate-50 rounded-xl p-5 border border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium">{formatCurrency(invoice.subtotal_provider)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Comisión Chamby (20%)</span>
                  <span className="font-medium">{formatCurrency(invoice.chamby_commission_amount)}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">Total a pagar</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(invoice.total_customer_amount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Provider Notes */}
            {invoice.provider_notes && (
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <p className="text-xs font-medium text-amber-700 uppercase tracking-wider mb-2">
                  Notas del proveedor
                </p>
                <p className="text-sm text-amber-900">{invoice.provider_notes}</p>
              </div>
            )}

            {/* Payment Section */}
            {canPay && clientSecret && (
              <div className="border-t border-dashed pt-8">
                <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-1">
                        Completa tu pago
                      </h3>
                      <p className="text-sm text-muted-foreground mb-3">
                        Pago seguro procesado por Stripe
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-3.5 w-3.5 text-green-600" />
                        <span>Transacción encriptada y protegida</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-center md:items-end gap-3">
                      <div className="text-center md:text-right">
                        <p className="text-sm text-muted-foreground">Total</p>
                        <p className="text-2xl font-bold text-primary">
                          {formatCurrency(invoice.total_customer_amount)}
                        </p>
                      </div>
                      <PayInvoiceButton
                        clientSecret={clientSecret}
                        amount={invoice.total_customer_amount}
                        currency="MXN"
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        className="w-full md:w-auto min-w-48"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Already Paid Message */}
            {isPaid && (
              <div className="border-t border-dashed pt-8">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-green-800 mb-2">
                    ¡Pago recibido!
                  </h3>
                  <p className="text-green-700 mb-4">
                    Gracias por tu pago. Esta factura ha sido procesada exitosamente.
                  </p>
                  {provider && (
                    <p className="text-sm text-green-600">
                      El proveedor <strong>{provider.full_name}</strong> ha sido notificado.
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Note */}
        <p className="text-center text-xs text-muted-foreground">
          ¿Tienes preguntas sobre esta factura? Contacta a soporte en{" "}
          <a href="mailto:soporte@chamby.mx" className="text-primary hover:underline">
            soporte@chamby.mx
          </a>
        </p>
      </div>
    </div>
  );
};

export default InvoicePayPage;
