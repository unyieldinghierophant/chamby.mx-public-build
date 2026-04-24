import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN } from "@/utils/pricingConfig";
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

  // Invoice display — never show visit fee here; visit fee is a separate
  // transaction. Subtotal / IVA / Total only.
  const total = invoice.total_customer_amount;
  const subtotal = total / 1.16;
  const vat = total - subtotal;
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
        {/* Breakdown — subtotal / IVA / total only. Visit fee is NOT on the invoice. */}
        <div className="bg-muted/50 rounded-xl p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA (16%)</span>
            <span>${vat.toLocaleString("es-MX", { minimumFractionDigits: 2 })} MXN</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-border/50 pt-2">
            <span>Total a pagar</span>
            <span className="text-primary">{formatMXN(totalCents)}</span>
          </div>
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
