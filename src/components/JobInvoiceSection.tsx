import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FileText,
  Send,
  CheckCircle,
  XCircle,
  RefreshCw,
  Loader2,
  CreditCard,
} from "lucide-react";
import { toast } from "sonner";
import { toFixedSafe } from "@/utils/formatSafe";
import { VAT_LABEL } from "@/lib/pricing";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface ActiveInvoice {
  id: string;
  status: string;
  subtotal_provider: number;
  chamby_commission_amount: number;
  total_customer_amount: number;
  vat_amount: number;
  provider_notes: string | null;
  revision_number: number;
  valid_until: string | null;
  requires_followup_visit: boolean;
  created_at: string;
}

const STATUS_BADGE_CONFIG: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; className: string; label: string }> = {
  draft:      { variant: "secondary",    className: "bg-muted text-muted-foreground",                   label: "Borrador" },
  sent:       { variant: "default",      className: "bg-blue-100 text-blue-800 border-blue-200",        label: "Enviada" },
  accepted:   { variant: "default",      className: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Aceptada" },
  rejected:   { variant: "destructive",  className: "bg-red-100 text-red-800 border-red-200",           label: "Rechazada" },
  countered:  { variant: "default",      className: "bg-orange-100 text-orange-800 border-orange-200",  label: "Contraoferta" },
  paid:       { variant: "default",      className: "bg-emerald-100 text-emerald-800 border-emerald-200", label: "Pagada" },
  expired:    { variant: "secondary",    className: "bg-muted text-muted-foreground",                   label: "Expirada" },
};

interface JobInvoiceSectionProps {
  jobId: string;
  role: "client" | "provider";
  onUpdate?: () => void;
}

export const JobInvoiceSection = ({ jobId, role, onUpdate }: JobInvoiceSectionProps) => {
  const { user } = useAuth();
  const [invoice, setInvoice] = useState<ActiveInvoice | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [counterOpen, setCounterOpen] = useState(false);

  const fetchInvoice = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, status, subtotal_provider, chamby_commission_amount, total_customer_amount, vat_amount, provider_notes, revision_number, valid_until, requires_followup_visit, created_at")
        .eq("job_id", jobId)
        .not("status", "in", '("superseded","withdrawn","expired")')
        .order("revision_number", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching invoice:", error);
        setInvoice(null);
        setItems([]);
        setLoading(false);
        return;
      }

      if (data) {
        setInvoice(data);
        // Fetch items
        const { data: itemsData } = await supabase
          .from("invoice_items")
          .select("id, description, quantity, unit_price, total")
          .eq("invoice_id", data.id)
          .order("created_at", { ascending: true });
        setItems(itemsData || []);
      } else {
        setInvoice(null);
        setItems([]);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();

    // Real-time subscription
    const channel = supabase
      .channel(`invoice-section-${jobId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "invoices",
        filter: `job_id=eq.${jobId}`,
      }, () => {
        fetchInvoice();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [jobId]);

  // Provider: Send draft invoice
  const handleSendInvoice = async () => {
    if (!invoice || !user) return;
    setActing(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-invoice", {
        body: { invoice_id: invoice.id },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Error al enviar factura");
        return;
      }
      toast.success("Factura enviada al cliente");
      fetchInvoice();
      onUpdate?.();
    } catch (err) {
      toast.error("Error inesperado");
    } finally {
      setActing(false);
    }
  };

  // Redirect to Stripe Checkout for an invoice
  const redirectToCheckout = async (invoiceId: string) => {
    setActing(true);
    try {
      toast.loading("Preparando pago seguro...", { id: "checkout-loading" });
      const { data, error } = await supabase.functions.invoke("create-invoice-payment", {
        body: { invoice_id: invoiceId },
      });
      toast.dismiss("checkout-loading");
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Error al crear sesión de pago");
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      } else {
        toast.error("No se recibió la URL de pago");
      }
    } catch (err) {
      toast.dismiss("checkout-loading");
      toast.error("Error inesperado al preparar el pago");
    } finally {
      setActing(false);
    }
  };

  // Client: Accept invoice then redirect to payment
  const handleAccept = async () => {
    if (!invoice || !user) return;
    setActing(true);
    try {
      const { data, error } = await supabase.functions.invoke("respond-to-invoice", {
        body: { invoice_id: invoice.id, action: "accept" },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Error al aceptar");
        setActing(false);
        return;
      }
      toast.success("Factura aceptada — redirigiendo al pago...");
      // Don't setActing(false) — we're redirecting
      await redirectToCheckout(invoice.id);
    } catch (err) {
      toast.error("Error inesperado");
      setActing(false);
    }
  };

  // Client: Reject invoice
  const handleReject = async () => {
    if (!invoice || !user) return;
    setActing(true);
    try {
      const { data, error } = await supabase.functions.invoke("respond-to-invoice", {
        body: { invoice_id: invoice.id, action: "reject" },
      });
      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Error al rechazar");
        return;
      }
      toast.success("Factura rechazada");
      fetchInvoice();
      onUpdate?.();
    } catch (err) {
      toast.error("Error inesperado");
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-border/50">
        <CardContent className="p-4">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-8 bg-muted rounded w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!invoice) return null;

  const badgeConfig = STATUS_BADGE_CONFIG[invoice.status] || STATUS_BADGE_CONFIG.draft;
  const subtotalFromItems = items.reduce((s, i) => s + i.total, 0);
  const vatAmount = invoice.total_customer_amount - subtotalFromItems;

  return (
    <>
      <Card className="border-border/50">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Factura
              {invoice.revision_number > 1 && (
                <span className="text-xs text-muted-foreground">
                  (Rev. {invoice.revision_number})
                </span>
              )}
            </CardTitle>
            <Badge className={`text-[10px] px-2 py-0.5 border ${badgeConfig.className}`}>
              {badgeConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-4 pt-0 space-y-3">
          {/* Total highlight */}
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <span className="text-lg font-bold text-primary">
              ${toFixedSafe(invoice.total_customer_amount, 2)} MXN
            </span>
            {invoice.valid_until && invoice.status === "sent" && (
              <span className="text-[10px] text-muted-foreground">
                Válida hasta {new Date(invoice.valid_until).toLocaleDateString("es-MX")}
              </span>
            )}
          </div>

          {/* Line items table */}
          {items.length > 0 && (
            <div className="rounded-lg border border-border/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead className="text-xs py-2">Concepto</TableHead>
                    <TableHead className="text-xs py-2 text-right w-16">Cant.</TableHead>
                    <TableHead className="text-xs py-2 text-right w-24">Precio</TableHead>
                    <TableHead className="text-xs py-2 text-right w-24">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-xs py-2">{item.description}</TableCell>
                      <TableCell className="text-xs py-2 text-right">{item.quantity}</TableCell>
                      <TableCell className="text-xs py-2 text-right">${toFixedSafe(item.unit_price, 2)}</TableCell>
                      <TableCell className="text-xs py-2 text-right font-medium">${toFixedSafe(item.total, 2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="border-t border-border/50 p-2 space-y-1 bg-muted/20">
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>Subtotal</span>
                  <span>${toFixedSafe(subtotalFromItems, 2)}</span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-1">
                  <span>{VAT_LABEL}</span>
                  <span>+${toFixedSafe(vatAmount, 2)}</span>
                </div>
                <div className="flex justify-between text-xs font-semibold border-t border-border/30 pt-1 px-1">
                  <span>Total</span>
                  <span className="text-primary">${toFixedSafe(invoice.total_customer_amount, 2)} MXN</span>
                </div>
              </div>
            </div>
          )}

          {/* Provider notes */}
          {invoice.provider_notes && (
            <p className="text-xs text-muted-foreground italic">
              📝 {invoice.provider_notes}
            </p>
          )}

          {/* Follow-up badge */}
          {invoice.requires_followup_visit && (
            <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">
              Requiere visita de seguimiento
            </Badge>
          )}

          {/* PROVIDER ACTIONS */}
          {role === "provider" && invoice.status === "draft" && (
            <Button
              onClick={handleSendInvoice}
              disabled={acting}
              className="w-full gap-2"
            >
              {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Enviar al cliente
            </Button>
          )}

          {/* CLIENT ACTIONS */}
          {role === "client" && invoice.status === "sent" && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10 text-sm"
                onClick={handleReject}
                disabled={acting}
              >
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                Rechazar
              </Button>
              <Button
                variant="outline"
                className="flex-1 gap-1.5 text-orange-600 border-orange-300 hover:bg-orange-50 text-sm"
                onClick={() => setCounterOpen(true)}
                disabled={acting}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Contraoferta
              </Button>
              <Button
                className="flex-1 gap-1.5 text-sm"
                onClick={handleAccept}
                disabled={acting}
              >
                {acting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                Aceptar y pagar
              </Button>
            </div>
          )}

          {/* CLIENT: Pay now for accepted but unpaid invoices */}
          {role === "client" && invoice.status === "accepted" && (
            <Button
              onClick={() => redirectToCheckout(invoice.id)}
              disabled={acting}
              className="w-full gap-2"
            >
              {acting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CreditCard className="w-4 h-4" />
              )}
              Pagar ahora — ${toFixedSafe(invoice.total_customer_amount, 2)} MXN
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Counter-proposal placeholder dialog */}
      <Dialog open={counterOpen} onOpenChange={setCounterOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">Contraoferta</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Aquí podrás modificar los conceptos y enviar una contraoferta al proveedor.
            </p>
            {/* Show current line items for reference */}
            {items.length > 0 && (
              <div className="rounded-lg border border-border/50 overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs py-2">Concepto</TableHead>
                      <TableHead className="text-xs py-2 text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-xs py-2">{item.description}</TableCell>
                        <TableCell className="text-xs py-2 text-right">${toFixedSafe(item.total, 2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              Esta función estará disponible próximamente.
            </p>
            <Button variant="outline" className="w-full" onClick={() => setCounterOpen(false)}>
              Cerrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
