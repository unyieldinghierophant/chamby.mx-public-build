import { Card, CardContent } from "@/components/ui/card";
import { DollarSign } from "lucide-react";
import {
  VAT_LABEL,
  VISIT_DISPLAY,
  formatPesosShort,
  calcInvoiceVat,
} from "@/lib/pricing";
import { toFixedSafe } from "@/utils/formatSafe";

interface PaymentBreakdownCardProps {
  /** 'client' shows base + IVA + total; 'provider' adds commission + net */
  variant: "client" | "provider";
  /** 'visit' uses fixed visit pricing; 'invoice' uses dynamic amounts */
  type: "visit" | "invoice";
  /** For invoice type: subtotal in pesos */
  subtotalPesos?: number;
  /** For invoice type: total in pesos (subtotal + IVA) */
  totalPesos?: number;
  className?: string;
}

export const PaymentBreakdownCard = ({
  variant,
  type,
  subtotalPesos,
  totalPesos,
  className,
}: PaymentBreakdownCardProps) => {
  if (type === "visit") {
    return (
      <Card className={className}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">
              Desglose de visita
            </span>
          </div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{VISIT_DISPLAY.subtotal}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{VAT_LABEL}</span>
              <span>{VISIT_DISPLAY.vat}</span>
            </div>
            <div className="flex justify-between font-semibold border-t border-border/50 pt-1.5">
              <span>Total</span>
              <span className="text-primary">{VISIT_DISPLAY.total}</span>
            </div>
            {variant === "provider" && (
              <>
                <div className="border-t border-border/50 pt-1.5" />
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Comisión Chamby</span>
                  <span className="text-destructive">-{VISIT_DISPLAY.platformFee}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{VAT_LABEL}</span>
                  <span className="text-destructive">-{VISIT_DISPLAY.vat}</span>
                </div>
                <div className="flex justify-between font-bold border-t border-border/50 pt-1.5">
                  <span>Tu ganancia neta</span>
                  <span className="text-primary">{VISIT_DISPLAY.providerNet}</span>
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Invoice breakdown
  const sub = subtotalPesos ?? 0;
  const vat = calcInvoiceVat(sub);
  const total = totalPesos ?? sub + vat;

  return (
    <Card className={className}>
      <CardContent className="p-4 space-y-2">
        <div className="flex items-center gap-2 mb-1">
          <DollarSign className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">
            Desglose de factura
          </span>
        </div>
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>${toFixedSafe(sub, 2, "0.00")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">{VAT_LABEL}</span>
            <span>+${toFixedSafe(vat, 2, "0.00")}</span>
          </div>
          <div className="flex justify-between font-semibold border-t border-border/50 pt-1.5">
            <span>Total</span>
            <span className="text-primary">${toFixedSafe(total, 2, "0.00")} MXN</span>
          </div>
          {variant === "provider" && (
            <>
              <div className="border-t border-border/50 pt-1.5" />
              <div className="flex justify-between font-bold">
                <span>Tu ganancia</span>
                <span className="text-primary">${toFixedSafe(sub, 2, "0.00")} MXN</span>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
