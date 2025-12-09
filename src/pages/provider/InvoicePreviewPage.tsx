import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  FileText, 
  User, 
  MapPin, 
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Receipt,
  Wallet,
  Users,
  Calendar
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface InvoiceItem {
  id: string;
  description: string;
  unit_price: number;
  quantity: number;
  total: number;
}

interface InvoiceData {
  id: string;
  job_id: string;
  provider_id: string;
  user_id: string;
  subtotal_provider: number;
  chamby_commission_amount: number;
  total_customer_amount: number;
  status: string;
  provider_notes: string | null;
  created_at: string;
}

interface JobData {
  title: string;
  category: string;
  location: string | null;
}

interface ClientData {
  full_name: string | null;
  email: string | null;
}

export default function InvoicePreviewPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [job, setJob] = useState<JobData | null>(null);
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId || !user) return;

    const fetchInvoiceData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch invoice
        const { data: invoiceData, error: invoiceError } = await supabase
          .from('invoices')
          .select('*')
          .eq('id', invoiceId)
          .maybeSingle();

        if (invoiceError) throw invoiceError;
        if (!invoiceData) {
          setError("Factura no encontrada");
          return;
        }

        // Verify provider owns this invoice
        if (invoiceData.provider_id !== user.id) {
          setError("No tienes permiso para ver esta factura");
          return;
        }

        setInvoice(invoiceData);

        // Fetch invoice items
        const { data: itemsData } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceId)
          .order('created_at', { ascending: true });

        setInvoiceItems(itemsData || []);

        // Fetch job info
        const { data: jobData } = await supabase
          .from('jobs')
          .select('title, category, location')
          .eq('id', invoiceData.job_id)
          .maybeSingle();

        setJob(jobData);

        // Fetch client info
        const { data: clientData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', invoiceData.user_id)
          .maybeSingle();

        setClient(clientData);
      } catch (err) {
        console.error('Error fetching invoice:', err);
        setError("Error al cargar la factura");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoiceData();
  }, [invoiceId, user]);

  const handleSendToClient = async () => {
    if (!invoice) return;

    setSending(true);
    try {
      const { data, error: invokeError } = await supabase.functions.invoke(
        "send-invoice-to-client",
        {
          body: { invoiceId: invoice.id },
        }
      );

      if (invokeError) throw invokeError;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "✅ Factura enviada",
        description: "El cliente ha sido notificado y puede pagar la factura.",
      });

      // Navigate to provider invoices list (to be built in Prompt 4)
      navigate('/provider/invoices');
    } catch (err) {
      console.error('Error sending invoice:', err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "No se pudo enviar la factura",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
            <CheckCircle className="mr-1 h-3 w-3" />
            Pagada
          </Badge>
        );
      case "pending_payment":
        return (
          <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-amber-500/20">
            <Clock className="mr-1 h-3 w-3" />
            Pendiente de pago
          </Badge>
        );
      case "draft":
      default:
        return (
          <Badge variant="outline" className="border-muted-foreground/30">
            <FileText className="mr-1 h-3 w-3" />
            Borrador
          </Badge>
        );
    }
  };

  const formatCurrency = (amount: number) => {
    return amount.toLocaleString('es-MX', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Calculate the original subtotal from items
  const calculateSubtotal = () => {
    return invoiceItems.reduce((sum, item) => sum + item.total, 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-8 w-48" />
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-background p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
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
              <h2 className="text-xl font-semibold mb-2">Error</h2>
              <p className="text-muted-foreground text-center">
                {error || "No se pudo cargar la factura"}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/provider-portal/jobs')}
                className="mt-6"
              >
                Ir a mis trabajos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const providerFee = subtotal * 0.10;
  const customerFee = subtotal * 0.10;
  const canSend = invoice.status !== 'paid' && invoice.status !== 'pending_payment';

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          {getStatusBadge(invoice.status)}
        </div>

        {/* Invoice Document Card */}
        <Card className="overflow-hidden">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 border-b">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Receipt className="h-6 w-6 text-primary" />
                  <h1 className="text-2xl font-bold text-foreground">Factura</h1>
                </div>
                <p className="text-sm text-muted-foreground">
                  ID: {invoice.id.slice(0, 8).toUpperCase()}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-4 w-4" />
                  {format(new Date(invoice.created_at), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total a cobrar</p>
                <p className="text-3xl font-bold text-primary">
                  ${formatCurrency(invoice.total_customer_amount)}
                </p>
                <p className="text-xs text-muted-foreground">MXN</p>
              </div>
            </div>
          </div>

          <CardContent className="p-6 space-y-6">
            {/* Client & Job Info */}
            <div className="grid md:grid-cols-2 gap-4">
              {/* Client */}
              <div className="p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-muted-foreground">Cliente</span>
                </div>
                <p className="font-semibold">{client?.full_name || 'Cliente'}</p>
                {client?.email && (
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                )}
              </div>

              {/* Job */}
              {job && (
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Trabajo</span>
                  </div>
                  <p className="font-semibold">{job.title}</p>
                  <p className="text-sm text-muted-foreground">{job.category}</p>
                  {job.location && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <MapPin className="h-3 w-3" />
                      {job.location}
                    </p>
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Line Items Table */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Conceptos
              </h3>
              <div className="border rounded-lg overflow-hidden">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-2 p-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  <div className="col-span-6">Descripción</div>
                  <div className="col-span-2 text-right">Cant.</div>
                  <div className="col-span-2 text-right">Precio</div>
                  <div className="col-span-2 text-right">Total</div>
                </div>
                
                {/* Table Body */}
                {invoiceItems.map((item, index) => (
                  <div 
                    key={item.id} 
                    className={`grid grid-cols-12 gap-2 p-3 text-sm ${
                      index % 2 === 0 ? 'bg-background' : 'bg-muted/20'
                    }`}
                  >
                    <div className="col-span-6 font-medium">{item.description}</div>
                    <div className="col-span-2 text-right text-muted-foreground">{item.quantity}</div>
                    <div className="col-span-2 text-right text-muted-foreground">
                      ${formatCurrency(item.unit_price)}
                    </div>
                    <div className="col-span-2 text-right font-semibold">
                      ${formatCurrency(item.total)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Totals Summary */}
            <div className="flex justify-end">
              <div className="w-full md:w-80 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>${formatCurrency(subtotal)} MXN</span>
                </div>
                
                <Separator className="my-2" />
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Tu comisión (10%)</span>
                  <span className="text-destructive">−${formatCurrency(providerFee)} MXN</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cargo al cliente (10%)</span>
                  <span className="text-primary">+${formatCurrency(customerFee)} MXN</span>
                </div>
                
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Comisión total Chamby (20%)</span>
                  <span>${formatCurrency(invoice.chamby_commission_amount)} MXN</span>
                </div>
                
                <Separator className="my-2" />
                
                {/* Customer pays */}
                <div className="flex justify-between items-center">
                  <span className="font-medium flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    Cliente paga
                  </span>
                  <span className="text-xl font-bold text-primary">
                    ${formatCurrency(invoice.total_customer_amount)} MXN
                  </span>
                </div>
                
                {/* Provider receives */}
                <div className="flex justify-between items-center p-3 bg-green-500/10 rounded-lg -mx-1">
                  <span className="font-medium flex items-center gap-1 text-green-700 dark:text-green-400">
                    <Wallet className="h-4 w-4" />
                    Tú recibes
                  </span>
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">
                    ${formatCurrency(invoice.subtotal_provider)} MXN
                  </span>
                </div>
              </div>
            </div>

            {/* Provider Notes */}
            {invoice.provider_notes && (
              <>
                <Separator />
                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="text-sm font-medium mb-2">Notas</h4>
                  <p className="text-sm text-muted-foreground">{invoice.provider_notes}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={sending}
          >
            Editar
          </Button>
          
          {canSend ? (
            <Button
              onClick={handleSendToClient}
              disabled={sending}
              size="lg"
              className="min-w-[180px]"
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar al cliente
                </>
              )}
            </Button>
          ) : (
            <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">
                {invoice.status === 'paid' ? 'Factura pagada' : 'Factura enviada'}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
