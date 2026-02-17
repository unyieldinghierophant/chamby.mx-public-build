import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, User, Phone, MessageSquare, CheckCircle, Navigation, Loader2, HourglassIcon, ChevronRight } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { useNavigate } from "react-router-dom";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { getVisitFeeStatus, getInvoiceStatus } from "@/utils/jobPaymentStatus";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { ActiveJob } from "@/hooks/useActiveJobs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

interface JobCardActiveProps {
  job: ActiveJob & {
    provider_confirmed_visit?: boolean;
    client_confirmed_visit?: boolean;
    visit_confirmation_deadline?: string | null;
    visit_dispute_status?: string | null;
  };
  onComplete: (jobId: string) => Promise<{ error: any }>;
}

export const JobCardActive = ({ job, onComplete }: JobCardActiveProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleConfirmVisit = async () => {
    setLoading(true);
    console.log('[JobCardActive] Confirming visit for job:', job.id, 'current status:', job.status);
    
    const { error: updateError } = await supabase
      .from('jobs')
      .update({ 
        provider_confirmed_visit: true,
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', job.id)
      .eq('provider_id', user?.id);

    console.log('[JobCardActive] Update result - error:', updateError);
    setLoading(false);

    if (updateError) {
      toast.error('Error al confirmar la visita', {
        description: updateError.message
      });
      return;
    }

    toast.success('¡Trabajo completado!', {
      description: 'El trabajo ha sido marcado como completado.'
    });
    await onComplete(job.id);
  };

  const handleStartRoute = () => {
    if (job.location) {
      const encodedAddress = encodeURIComponent(job.location);
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`, '_blank');
    } else {
      toast.error('No hay dirección disponible');
    }
  };

  const handleCallCustomer = () => {
    if (job.client?.phone) {
      window.location.href = `tel:${job.client.phone}`;
    } else {
      toast.error('No hay número de teléfono disponible');
    }
  };

  const scheduledDate = job.scheduled_at ? new Date(job.scheduled_at) : new Date();
  const visitFeeStatus = getVisitFeeStatus(job);
  const invoiceStatus = getInvoiceStatus(job.invoice);

  // Determine confirmation status
  const providerConfirmed = job.provider_confirmed_visit === true;
  const clientConfirmed = job.client_confirmed_visit === true;
  const hasDispute = job.visit_dispute_status !== null && job.visit_dispute_status !== undefined;
  const deadline = job.visit_confirmation_deadline ? new Date(job.visit_confirmation_deadline) : null;

  // Render confirmation status section
  const renderConfirmationStatus = () => {
    if (clientConfirmed) {
      return (
        <div className="flex items-center gap-2 p-3 bg-success/10 rounded-lg border border-success/20">
          <CheckCircle className="h-5 w-5 text-success" />
          <span className="text-sm text-success font-medium">
            Visita confirmada por ambas partes
          </span>
        </div>
      );
    }

    if (hasDispute) {
      const isPending = job.visit_dispute_status === "pending_support";
      return (
        <div className={`flex items-center gap-2 p-3 rounded-lg border ${
          isPending ? "bg-warning/10 border-warning/20" : "bg-muted"
        }`}>
          <HourglassIcon className={`h-5 w-5 ${isPending ? "text-warning" : "text-muted-foreground"}`} />
          <span className={`text-sm font-medium ${isPending ? "text-warning" : "text-muted-foreground"}`}>
            {isPending ? "En revisión por soporte" : "Caso resuelto"}
          </span>
        </div>
      );
    }

    if (providerConfirmed) {
      const timeRemaining = deadline 
        ? formatDistanceToNow(deadline, { locale: es, addSuffix: true })
        : null;
      
      return (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span className="text-sm text-primary font-medium">
              Esperando confirmación del cliente
            </span>
          </div>
          {timeRemaining && (
            <Badge variant="outline" className="text-xs">
              {timeRemaining}
            </Badge>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="bg-gradient-card border-border/50 hover:shadow-raised transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {job.category}
            </p>
          </div>
          <StatusBadge status={job.status} size="sm" />
        </div>
        {/* Payment Status Badges */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          <PaymentStatusBadge type="visit_fee" status={visitFeeStatus} role="provider" />
          {invoiceStatus !== 'none' && (
            <PaymentStatusBadge type="invoice" status={invoiceStatus} role="provider" />
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Confirmation Status */}
        {renderConfirmationStatus()}

        {/* Customer Info */}
        {job.client && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>
                  <User className="w-4 h-4" />
                </AvatarFallback>
              </Avatar>
              <span className="text-sm text-foreground">
                {job.client.full_name || 'Cliente'}
              </span>
            </div>
            {job.client.phone && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleCallCustomer}
                className="gap-2"
              >
                <Phone className="w-4 h-4" />
                Llamar
              </Button>
            )}
          </div>
        )}

        {/* Schedule */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(scheduledDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{format(scheduledDate, "HH:mm", { locale: es })} • {job.duration_hours || 1}h</span>
        </div>

        {/* Location */}
        {job.location && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{job.location}</span>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-2">
            {job.description}
          </p>
        )}

        {/* Payment Breakdown */}
        <div className="mt-4 space-y-1">
          {(() => {
            const visitFee = job.visit_fee_amount || 350;
            const chambyFee = job.amount_booking_fee || Math.round(visitFee * 0.2857);
            const providerPayout = visitFee - chambyFee;
            return (
              <>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Cobro al cliente</span>
                  <span>${visitFee} MXN</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-primary">Tu pago</span>
                  <span className="font-bold text-primary">${providerPayout} MXN</span>
                </div>
              </>
            );
          })()}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
        {/* Primary: Go to timeline */}
        <Button 
          onClick={() => navigate(`/provider-portal/jobs/${job.id}`)}
          className="w-full gap-2"
        >
          <ChevronRight className="w-4 h-4" />
          Ver seguimiento
        </Button>
        <div className="w-full grid grid-cols-2 gap-2">
          <Button 
            onClick={handleStartRoute}
            variant="outline"
            className="gap-2"
          >
            <Navigation className="w-4 h-4" />
            Iniciar Ruta
          </Button>
          <Button 
            variant="outline"
            className="gap-2"
            onClick={() => navigate(`/provider-portal/jobs/${job.id}`)}
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </Button>
        </div>
        
        {/* Show confirm button only if not already confirmed and no dispute */}
        {!providerConfirmed && !hasDispute && (
          <Button 
            onClick={handleConfirmVisit}
            disabled={loading}
            className="w-full bg-success hover:bg-success/90 text-success-foreground gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4" />
            )}
            Confirmar Visita Completada
          </Button>
        )}
      </CardFooter>
    </Card>
  );
};
