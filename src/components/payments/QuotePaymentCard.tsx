import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, Info, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN, PRICING } from "@/utils/pricingConfig";
import { toast } from "sonner";

interface QuotePaymentCardProps {
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
  onPaymentStarted?: () => void;
}

export const QuotePaymentCard = ({ jobId, invoice, onPaymentStarted }: QuotePaymentCardProps) => {
  const [paying, setPaying] = useState(false);

  const handlePay = async () => {
    setPaying(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-invoice-payment", {
        body: { invoice_id: invoice.id },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      if (data?.url) {
        onPaymentStarted?.();
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (err: any) {
      toast.error(err.message || "Error al iniciar el pago");
    } finally {
      setPaying(false);
    }
  };

  const providerQuote = invoice.subtotal_provider;
  const surcharge = invoice.client_surcharge_amount ?? providerQuote * 0.10;
  const subtotal = providerQuote + surcharge;
  const vat = invoice.vat_amount;
  const total = invoice.total_customer_amount;
  const totalCents = Math.round(total * 100);

  return (
    <Card className="border-emerald-500/30 bg-card">
      <CardHeader className="pb-3 px-4 pt-4">
        <CardTitle className="text-sm flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          Cotización aprobada — Procede al pago
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 space-y-4">
        {/* Breakdown */}
        <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cotización del proveedor</span>
            <span className="font-semibold">
              ${providerQuote.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN
            </span>
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
            <span>Total a pagar</span>
            <span className="text-primary">{formatMXN(totalCents)}</span>
          </div>
        </div>

        {/* Refund note */}
        <div className="flex items-start gap-2 bg-emerald-500/5 rounded-lg p-2.5 border border-emerald-500/20">
          <Info className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
          <p className="text-xs text-emerald-700">
            Tu pago de diagnóstico ({formatMXN(PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS)}) será reembolsado al completarse el trabajo.
          </p>
        </div>

        {/* Pay button */}
        <Button
          onClick={handlePay}
          disabled={paying}
          className="w-full h-12 gap-2 bg-emerald-600 hover:bg-emerald-700 text-base font-semibold"
        >
          {paying ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <CreditCard className="w-5 h-5" />
          )}
          Pagar {formatMXN(totalCents)}
        </Button>
      </CardContent>
    </Card>
  );
};
