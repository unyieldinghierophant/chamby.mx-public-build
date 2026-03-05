import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2, CheckCircle, XCircle, DollarSign, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN, PRICING } from "@/utils/pricingConfig";
import { toast } from "sonner";

interface ClientQuoteReviewProps {
  jobId: string;
  invoice: {
    id: string;
    status: string;
    subtotal_provider: number;
    chamby_commission_amount: number;
    client_surcharge_amount?: number;
    vat_amount: number;
    total_customer_amount: number;
    provider_payout_amount?: number;
  };
  onResponse: () => void;
}

export const ClientQuoteReview = ({ jobId, invoice, onResponse }: ClientQuoteReviewProps) => {
  const [responding, setResponding] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleRespond = async (action: "accept" | "reject") => {
    setResponding(true);
    try {
      const { data, error } = await supabase.functions.invoke("respond-to-quote", {
        body: {
          job_id: jobId,
          invoice_id: invoice.id,
          action,
          rejection_reason: action === "reject" ? rejectionReason : undefined,
        },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      toast.success(
        action === "accept"
          ? "Cotización aprobada. El siguiente paso es el pago."
          : "Cotización rechazada."
      );
      onResponse();
    } catch (err: any) {
      toast.error(err.message || "Error al responder");
    } finally {
      setResponding(false);
    }
  };

  // Amounts are stored in pesos in the DB
  const providerQuote = invoice.subtotal_provider;
  const surcharge = invoice.client_surcharge_amount ?? providerQuote * 0.10;
  const subtotal = providerQuote + surcharge;
  const vat = invoice.vat_amount;
  const total = invoice.total_customer_amount;

  return (
    <Card className="border-primary/30 bg-card">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          Cotización del proveedor
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Breakdown */}
        <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cotización del proveedor</span>
            <span className="font-semibold">${providerQuote.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Comisión de servicio (10%)</span>
            <span>+${surcharge.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between border-t border-border/50 pt-1.5">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>IVA (16%)</span>
            <span>+${vat.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-border/50 pt-2">
            <span>Total estimado</span>
            <span className="text-primary">~${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
          </div>
        </div>

        {/* Refund note */}
        <div className="flex items-start gap-2 bg-emerald-500/5 rounded-lg p-2.5 border border-emerald-500/20">
          <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-700">
            Tu pago de diagnóstico ({formatMXN(PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS)}) será reembolsado al completarse el trabajo.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={() => handleRespond("accept")}
            disabled={responding}
            className="flex-1 h-11 gap-2 bg-emerald-600 hover:bg-emerald-700"
          >
            {responding ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Aprobar cotización
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                disabled={responding}
                className="flex-1 h-11 gap-2 border-destructive/30 text-destructive hover:bg-destructive/5"
              >
                <XCircle className="w-4 h-4" />
                Rechazar
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Rechazar esta cotización?</AlertDialogTitle>
                <AlertDialogDescription>
                  Al rechazar, el proveedor será notificado. El pago de diagnóstico ($429) no se reembolsa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-2">
                <Textarea
                  placeholder="Motivo del rechazo (opcional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value.slice(0, 500))}
                  className="resize-none"
                  rows={3}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => handleRespond("reject")}
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Confirmar rechazo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
};
