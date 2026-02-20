import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  FileText,
  Plus,
  Trash2,
  Send,
  Loader2,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  XCircle,
  Edit,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { toFixedSafe } from "@/utils/formatSafe";

// Invoice status labels
export const INVOICE_STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  sent: "Enviada",
  accepted: "Aceptada",
  rejected: "Rechazada",
  paid: "Pagada",
  cancelled: "Cancelada",
};

const INVOICE_STATUS_CONFIG: Record<string, { bg: string; text: string }> = {
  draft: { bg: "bg-muted", text: "text-muted-foreground" },
  sent: { bg: "bg-amber-100", text: "text-amber-800" },
  accepted: { bg: "bg-blue-100", text: "text-blue-800" },
  rejected: { bg: "bg-red-100", text: "text-red-800" },
  paid: { bg: "bg-emerald-100", text: "text-emerald-800" },
  cancelled: { bg: "bg-muted", text: "text-muted-foreground" },
};

interface LineItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
}

interface InvoiceData {
  id: string;
  status: string;
  subtotal_provider: number;
  chamby_commission_amount: number;
  total_customer_amount: number;
  provider_notes: string | null;
  created_at: string;
  items: { id: string; description: string; unit_price: number; quantity: number; total: number }[];
}

interface InvoiceCardProps {
  jobId: string;
  clientId: string;
  jobStatus: string;
  invoice: InvoiceData | null;
  onInvoiceCreated: () => void;
  isProvider: boolean;
}

export const InvoiceCard = ({
  jobId,
  clientId,
  jobStatus,
  invoice,
  onInvoiceCreated,
  isProvider,
}: InvoiceCardProps) => {
  const { user } = useAuth();
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [description, setDescription] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: crypto.randomUUID(), description: "Mano de obra", amount: 0, quantity: 1 },
  ]);

  // Can create invoice only when on_site or quoted (provider only)
  const canCreateInvoice =
    isProvider &&
    !invoice &&
    (jobStatus === "on_site" || jobStatus === "in_progress");

  // Can edit invoice (only if draft or rejected)
  const canEditInvoice =
    isProvider &&
    invoice &&
    (invoice.status === "draft" || invoice.status === "rejected");

  // Can accept/reject (client only, invoice sent)
  const canActOnInvoice =
    !isProvider &&
    invoice &&
    invoice.status === "sent";

  const addLineItem = () => {
    setLineItems([
      ...lineItems,
      { id: crypto.randomUUID(), description: "", amount: 0, quantity: 1 },
    ]);
  };

  const removeLineItem = (id: string) => {
    if (lineItems.length <= 1) return;
    setLineItems(lineItems.filter((item) => item.id !== id));
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(
      lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.amount * item.quantity,
    0
  );
  const customerFee = Math.round(subtotal * 0.1 * 100) / 100;
  const totalCustomer = subtotal + customerFee;

  const handleSubmitInvoice = async () => {
    if (!user || subtotal <= 0) {
      toast.error("El total debe ser mayor a cero");
      return;
    }

    // Validate line items
    const invalidItems = lineItems.filter(
      (item) => !item.description.trim() || item.amount <= 0
    );
    if (invalidItems.length > 0) {
      toast.error("Completa todos los conceptos con descripción y monto");
      return;
    }

    setSubmitting(true);

    try {
      const providerFee = Math.round(subtotal * 0.1 * 100) / 100;
      const chambyCommission = providerFee + customerFee;
      const subtotalProviderNet = subtotal - providerFee;

      // Create invoice
      const { data: newInvoice, error: invError } = await supabase
        .from("invoices")
        .insert({
          job_id: jobId,
          provider_id: user.id,
          user_id: clientId,
          subtotal_provider: subtotalProviderNet,
          chamby_commission_amount: chambyCommission,
          total_customer_amount: totalCustomer,
          status: "sent",
          provider_notes: description || null,
        })
        .select()
        .single();

      if (invError) throw invError;

      // Create invoice items
      const itemsToInsert = lineItems.map((item) => ({
        invoice_id: newInvoice.id,
        description: item.description,
        unit_price: item.amount,
        quantity: item.quantity,
        total: item.amount * item.quantity,
      }));

      const { error: itemsError } = await supabase
        .from("invoice_items")
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      // Update job status to 'quoted'
      await supabase
        .from("jobs")
        .update({ status: "quoted", updated_at: new Date().toISOString() })
        .eq("id", jobId);

      // System message
      await supabase.from("messages").insert({
        job_id: jobId,
        sender_id: user.id,
        receiver_id: clientId,
        message_text: `🧾 El proveedor envió una factura por $${toFixedSafe(totalCustomer, 2, '0.00')} MXN para aprobación`,
        is_system_message: true,
        system_event_type: "invoice_sent",
        read: false,
      });

      toast.success("Factura enviada al cliente");
      setShowForm(false);
      onInvoiceCreated();
    } catch (err) {
      console.error("Invoice creation error:", err);
      toast.error("Error al crear la factura");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClientAction = async (action: "accepted" | "rejected") => {
    if (!user || !invoice) return;
    setSubmitting(true);

    try {
      // Update invoice status
      await supabase
        .from("invoices")
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq("id", invoice.id);

      if (action === "accepted") {
        // Move job to in_progress
        await supabase
          .from("jobs")
          .update({ status: "in_progress", updated_at: new Date().toISOString() })
          .eq("id", jobId);

        // System messages
        await supabase.from("messages").insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: clientId === user.id ? invoice.id : clientId, // will fix below
          message_text: "✅ La factura fue aceptada. El trabajo puede continuar.",
          is_system_message: true,
          system_event_type: "invoice_accepted",
          read: false,
        });
      } else {
        // System message for rejection
        await supabase.from("messages").insert({
          job_id: jobId,
          sender_id: user.id,
          receiver_id: clientId === user.id ? invoice.id : clientId,
          message_text: "❌ El cliente solicitó ajustes a la factura",
          is_system_message: true,
          system_event_type: "invoice_rejected",
          read: false,
        });
      }

      toast.success(
        action === "accepted"
          ? "Factura aceptada"
          : "Se solicitaron ajustes"
      );
      onInvoiceCreated();
    } catch (err) {
      console.error("Invoice action error:", err);
      toast.error("Error al procesar la factura");
    } finally {
      setSubmitting(false);
    }
  };

  // ─── No invoice yet, show create button ───
  if (!invoice && canCreateInvoice) {
    if (!showForm) {
      return (
        <Card className="border-dashed border-2 border-border/60">
          <CardContent className="p-4 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground mb-3">
              Crea una factura para el cliente
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <FileText className="w-4 h-4" /> Crear factura
            </Button>
          </CardContent>
        </Card>
      );
    }

    // ─── Invoice creation form ───
    return (
      <Card className="border-border/50">
        <CardHeader className="p-4 pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="w-4 h-4" /> Nueva Factura
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          <Textarea
            placeholder="Notas o descripción general (opcional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="text-sm min-h-[60px]"
          />

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Conceptos</p>
            {lineItems.map((item, i) => (
              <div key={item.id} className="flex gap-2 items-start">
                <Input
                  placeholder="Descripción"
                  value={item.description}
                  onChange={(e) =>
                    updateLineItem(item.id, "description", e.target.value)
                  }
                  className="flex-1 text-sm h-9"
                />
                <Input
                  type="number"
                  placeholder="Monto"
                  value={item.amount || ""}
                  onChange={(e) =>
                    updateLineItem(item.id, "amount", parseFloat(e.target.value) || 0)
                  }
                  className="w-24 text-sm h-9"
                  min={0}
                />
                <Input
                  type="number"
                  placeholder="Cant."
                  value={item.quantity}
                  onChange={(e) =>
                    updateLineItem(item.id, "quantity", parseInt(e.target.value) || 1)
                  }
                  className="w-16 text-sm h-9"
                  min={1}
                />
                {lineItems.length > 1 && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 shrink-0 text-muted-foreground"
                    onClick={() => removeLineItem(item.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                )}
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1 text-xs"
              onClick={addLineItem}
            >
              <Plus className="w-3 h-3" /> Agregar concepto
            </Button>
          </div>

          {/* Totals */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>${toFixedSafe(subtotal, 2, '0.00')}</span>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Cargo por servicio (10%)</span>
              <span>+${toFixedSafe(customerFee, 2, '0.00')}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border/50 pt-1.5">
              <span>Total cliente</span>
              <span className="text-primary">${toFixedSafe(totalCustomer, 2, '0.00')} MXN</span>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShowForm(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleSubmitInvoice}
              disabled={submitting || subtotal <= 0}
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              Enviar factura
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ─── No invoice and can't create ───
  if (!invoice) return null;

  // ─── Existing invoice display ───
  const statusCfg = INVOICE_STATUS_CONFIG[invoice.status] || INVOICE_STATUS_CONFIG.draft;

  return (
    <Card className="border-border/50">
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" /> Factura
            </CardTitle>
            <Badge className={cn("text-[10px] px-2 py-0.5", statusCfg.bg, statusCfg.text)}>
              {INVOICE_STATUS_LABELS[invoice.status] || invoice.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-3">
          {/* Total highlight */}
          <div className="flex items-center justify-between bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              <span className="text-lg font-bold text-primary">
                ${toFixedSafe(invoice.total_customer_amount, 2)} MXN
              </span>
            </div>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
                Detalles
                {detailsOpen ? (
                  <ChevronUp className="w-3 h-3" />
                ) : (
                  <ChevronDown className="w-3 h-3" />
                )}
              </Button>
            </CollapsibleTrigger>
          </div>

          {/* Collapsible details */}
          <CollapsibleContent>
            <div className="space-y-2 text-sm">
              {(invoice.items ?? []).map((item) => (
                <div key={item.id} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {item.description}{" "}
                    {item.quantity > 1 && (
                      <span className="text-xs">×{item.quantity}</span>
                    )}
                  </span>
                  <span>${toFixedSafe(item.total, 2)}</span>
                </div>
              ))}
              <div className="border-t border-border/50 pt-2">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Subtotal</span>
                  <span>
                    $
                    {toFixedSafe(
                      (invoice.items ?? []).reduce((s, i) => s + (i.total ?? 0), 0),
                      2
                    )}
                  </span>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Cargo servicio</span>
                  <span>
                    +$
                    {toFixedSafe(
                      (invoice.total_customer_amount ?? 0) -
                      (invoice.items ?? []).reduce((s, i) => s + (i.total ?? 0), 0),
                      2
                    )}
                  </span>
                </div>
              </div>
              {invoice.provider_notes && (
                <p className="text-xs text-muted-foreground italic mt-2">
                  {invoice.provider_notes}
                </p>
              )}
            </div>
          </CollapsibleContent>

          {/* Client actions: accept / reject */}
          {canActOnInvoice && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleClientAction("rejected")}
                disabled={submitting}
              >
                <XCircle className="w-4 h-4" /> Solicitar ajuste
              </Button>
              <Button
                className="flex-1 gap-2"
                onClick={() => handleClientAction("accepted")}
                disabled={submitting}
              >
                {submitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Aceptar
              </Button>
            </div>
          )}

          {/* Client: Pay accepted invoice */}
          {!isProvider && invoice && invoice.status === "accepted" && (
            <PayInvoiceSection invoiceId={invoice.id} totalAmount={invoice.total_customer_amount} />
          )}

          {/* Paid badge */}
          {invoice && invoice.status === "paid" && (
            <div className="flex items-center justify-center gap-2 py-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-sm font-medium">Factura pagada</span>
            </div>
          )}

          {/* Provider: edit if rejected */}
          {canEditInvoice && (
            <Button
              variant="outline"
              className="w-full gap-2 text-sm"
              onClick={() => {
                setLineItems(
                  (invoice.items ?? []).map((item) => ({
                    id: item.id,
                    description: item.description,
                    amount: item.unit_price,
                    quantity: item.quantity,
                  }))
                );
                setDescription(invoice.provider_notes || "");
                setShowForm(true);
              }}
            >
              <Edit className="w-4 h-4" /> Editar y reenviar
            </Button>
          )}
        </CardContent>
      </Collapsible>
    </Card>
  );
};

// ─── Pay Invoice Section (client-side) ───
const PayInvoiceSection = ({ invoiceId, totalAmount }: { invoiceId: string; totalAmount: number }) => {
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-payment", {
        body: { invoice_id: invoiceId },
      });

      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("No se recibió enlace de pago");

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Error al iniciar el pago");
      setPaying(false);
    }
  };

  return (
    <Button
      className="w-full gap-2"
      onClick={handlePay}
      disabled={paying}
    >
      {paying ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <DollarSign className="w-4 h-4" />
      )}
      Pagar factura — ${toFixedSafe(totalAmount, 2, '0.00')} MXN
    </Button>
  );
};
