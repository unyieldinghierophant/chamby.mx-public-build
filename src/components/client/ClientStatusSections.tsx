import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Search, MapPin, Wrench, CheckCircle, Clock, CreditCard, AlertTriangle, Star } from "lucide-react";
import { ClientQuoteReview } from "@/components/quotes/ClientQuoteReview";
import { QuotePaymentCard } from "@/components/payments/QuotePaymentCard";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ClientStatusSectionsProps {
  job: {
    id: string;
    status: string;
    provider_id: string | null;
    invoice: any;
    provider?: {
      full_name: string;
      avatar_url: string;
      rating: number;
      total_reviews: number;
    };
  };
  transitioning: boolean;
  onTransition: (newStatus: string) => void;
  onRefresh: () => void;
}

export const ClientStatusSections = ({
  job,
  transitioning,
  onTransition,
  onRefresh,
}: ClientStatusSectionsProps) => {
  const { status, invoice, provider } = job;

  if (status === 'searching' || status === 'pending') {
    return (
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="p-4 space-y-2 text-center">
          <Search className="w-8 h-8 text-blue-600 mx-auto animate-pulse" />
          <h3 className="text-sm font-semibold text-foreground">Buscando proveedor disponible...</h3>
          <p className="text-xs text-muted-foreground">
            Te notificaremos cuando un proveedor acepte tu solicitud.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'assigned') {
    return (
      <Card className="border-indigo-500/30 bg-indigo-500/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-semibold text-foreground">Tu proveedor va en camino</h3>
          </div>
          {provider && (
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl">
              <Avatar className="h-10 w-10">
                <AvatarImage src={provider.avatar_url} />
                <AvatarFallback>{provider.full_name?.charAt(0) || "P"}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{provider.full_name}</p>
                <p className="text-xs text-muted-foreground">
                  ⭐ {provider.rating?.toFixed(1) || "N/A"} • {provider.total_reviews || 0} reseñas
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  if (status === 'on_site') {
    return (
      <Card className="border-purple-500/30 bg-purple-500/5">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h3 className="text-sm font-semibold text-foreground">El proveedor está en tu domicilio</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Está realizando el diagnóstico. En breve recibirás una cotización.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'quoted' && invoice?.status === 'sent') {
    return (
      <ClientQuoteReview
        jobId={job.id}
        invoice={invoice}
        onResponse={onRefresh}
      />
    );
  }

  if (status === 'quote_accepted' && invoice?.status === 'accepted') {
    return (
      <QuotePaymentCard
        jobId={job.id}
        invoice={invoice}
      />
    );
  }

  if (status === 'job_paid' || status === 'in_progress') {
    return (
      <Card className="border-orange-500/30 bg-orange-500/5">
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-orange-600" />
            <h3 className="text-sm font-semibold text-foreground">
              {status === 'in_progress' ? 'El proveedor está trabajando' : 'Trabajo por iniciar'}
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            {status === 'in_progress'
              ? 'El proveedor está realizando el trabajo solicitado.'
              : 'El pago fue procesado. El proveedor comenzará en breve.'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'provider_done') {
    return (
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">
              El proveedor terminó. ¿Confirmas que el trabajo está completo?
            </h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Al confirmar, se procesará el reembolso de $429 a tu método de pago y el pago al proveedor.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={() => onTransition('completed')}
              disabled={transitioning}
              className="flex-1 h-12 gap-2 text-base font-semibold"
            >
              {transitioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              Confirmar
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-12 border-destructive/30 text-destructive hover:bg-destructive/5 gap-2"
              disabled
            >
              <AlertTriangle className="w-5 h-5" />
              Reportar problema
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (status === 'completed') {
    return (
      <Card className="border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-4 space-y-2 text-center">
          <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Trabajo completado</h3>
          <p className="text-xs text-muted-foreground">
            Se procesó el reembolso de $429 a tu método de pago original.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (status === 'quote_rejected') {
    return (
      <Card className="border-red-500/30 bg-red-500/5">
        <CardContent className="p-4 space-y-2 text-center">
          <AlertTriangle className="w-8 h-8 text-red-600 mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Cotización rechazada</h3>
          <p className="text-xs text-muted-foreground">
            La cuota de diagnóstico ($429) no es reembolsable. El proveedor recibió $250 por su visita.
          </p>
        </CardContent>
      </Card>
    );
  }

  return null;
};
