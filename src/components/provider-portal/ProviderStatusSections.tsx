import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, CheckCircle, Clock, Wrench, DollarSign, Star, Search, CreditCard } from "lucide-react";
import { ProviderQuoteForm } from "@/components/quotes/ProviderQuoteForm";
import { getStatusLabel } from "@/utils/jobStateMachine";
import { formatMXN } from "@/utils/pricingConfig";
import { cn } from "@/lib/utils";

interface ProviderStatusSectionsProps {
  status: string;
  jobId: string;
  invoice: any;
  transitioning: boolean;
  onTransition: (newStatus: string) => void;
  onQuoteSubmitted: () => void;
}

export const ProviderStatusSections = ({
  status,
  jobId,
  invoice,
  transitioning,
  onTransition,
  onQuoteSubmitted,
}: ProviderStatusSectionsProps) => {
  
  if (status === 'assigned') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Dirígete al domicilio</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Cuando llegues al sitio del cliente, presiona el botón para continuar con el diagnóstico.
          </p>
          <Button
            onClick={() => onTransition('on_site')}
            disabled={transitioning}
            className="w-full h-12 gap-2 text-base font-semibold"
          >
            {transitioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <MapPin className="w-5 h-5" />}
            Llegué al sitio
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'on_site') {
    return (
      <div className="space-y-4">
        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-foreground">Realiza el diagnóstico</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Evalúa el trabajo y envía tu cotización al cliente.
            </p>
          </CardContent>
        </Card>
        {!invoice && (
          <ProviderQuoteForm jobId={jobId} onQuoteSubmitted={onQuoteSubmitted} />
        )}
      </div>
    );
  }

  if (status === 'quoted') {
    return (
      <Card className="border-yellow-500/30 bg-yellow-500/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-yellow-600" />
            <h3 className="text-sm font-semibold text-foreground">Esperando respuesta del cliente</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Tu cotización fue enviada. El cliente está revisándola.
          </p>
          {invoice && (
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tu cotización</span>
                <span className="font-semibold">{formatMXN(Math.round(invoice.subtotal_provider * 100))}</span>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>El cliente pagará</span>
                <span>~{formatMXN(Math.round(invoice.total_customer_amount * 100))}</span>
              </div>
              {invoice.provider_payout_amount && (
                <div className="flex justify-between font-semibold text-primary border-t border-border/50 pt-1.5">
                  <span>Tú recibirás</span>
                  <span>{formatMXN(Math.round(invoice.provider_payout_amount * 100))}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (status === 'quote_accepted' || status === 'job_paid') {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-semibold text-foreground">
              {status === 'job_paid' ? 'Cliente pagó — listo para trabajar' : 'Cotización aprobada'}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {status === 'job_paid'
              ? 'El cliente realizó el pago. Puedes comenzar el trabajo.'
              : 'El cliente aprobó tu cotización. Esperando su pago.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'in_progress') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Trabajo en progreso</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Cuando termines el trabajo, márcalo como completado.
          </p>
          {invoice && invoice.provider_payout_amount && (
            <div className="bg-muted/50 rounded-xl p-3 text-sm">
              <div className="flex justify-between font-semibold text-primary">
                <span>Tú recibirás</span>
                <span>{formatMXN(Math.round(invoice.provider_payout_amount * 100))}</span>
              </div>
            </div>
          )}
          <Button
            onClick={() => onTransition('provider_done')}
            disabled={transitioning}
            className="w-full h-12 gap-2 text-base font-semibold"
          >
            {transitioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
            Trabajo terminado
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (status === 'provider_done') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-2 text-center">
          <Clock className="w-8 h-8 text-primary mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Esperando confirmación del cliente</h3>
          <p className="text-xs text-muted-foreground">
            Si el cliente no confirma en 24 horas, se auto-completará.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'completed') {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 space-y-3 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Trabajo completado</h3>
          {invoice && (
            <div className="bg-muted/50 rounded-xl p-3 space-y-1.5 text-sm text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cotización</span>
                <span className="font-semibold">{formatMXN(Math.round(invoice.subtotal_provider * 100))}</span>
              </div>
              {invoice.provider_payout_amount && (
                <div className="flex justify-between font-semibold text-primary border-t border-border/50 pt-1.5">
                  <span>Tu pago</span>
                  <span>{formatMXN(Math.round(invoice.provider_payout_amount * 100))}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return null;
};
