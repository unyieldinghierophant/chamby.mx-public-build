import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, DollarSign } from "lucide-react";

interface CancellationSummaryProps {
  jobStatus: string;
  visitFeeAmount?: number;
}

/**
 * Shows compensation rules when cancelling.
 * Rules:
 * - Before "on_site": Provider receives visit fee only
 * - After "on_site": Provider receives visit fee + $250 MXN compensation
 * - Platform retains $100 MXN from visit fee
 */
export const CancellationSummary = ({ jobStatus, visitFeeAmount = 350 }: CancellationSummaryProps) => {
  const afterOnSite = ["on_site", "quoted", "in_progress"].includes(jobStatus);
  const compensation = afterOnSite ? 250 : 0;
  const platformRetention = 100;
  const providerReceives = visitFeeAmount - platformRetention + compensation;

  return (
    <Card className="border-destructive/30 bg-destructive/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
          <AlertTriangle className="w-4 h-4" />
          Resumen de cancelación
        </div>

        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Visita</span>
            <span>${visitFeeAmount} MXN</span>
          </div>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Retención plataforma</span>
            <span>-${platformRetention} MXN</span>
          </div>
          {afterOnSite && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Compensación</span>
              <span>+${compensation} MXN</span>
            </div>
          )}
          <div className="flex justify-between font-semibold border-t border-border/50 pt-1.5">
            <span>Proveedor recibe</span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5" />
              ${providerReceives} MXN
            </span>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground italic">
          ⚠️ Montos de referencia. No se procesará pago automático.
        </p>
      </CardContent>
    </Card>
  );
};
