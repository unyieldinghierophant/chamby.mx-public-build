import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, Clock, DollarSign, AlertCircle, Image as ImageIcon } from "lucide-react";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { getVisitFeeStatus } from "@/utils/jobPaymentStatus";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AvailableJob } from "@/hooks/useAvailableJobs";
import { toast } from "sonner";
import { toFixedSafe } from "@/utils/formatSafe";

interface JobCardAvailableProps {
  job: AvailableJob;
  onAccept: (jobId: string) => Promise<void>;
}

export const JobCardAvailable = ({ job, onAccept }: JobCardAvailableProps) => {
  const handleAccept = async () => {
    try {
      await onAccept(job.id);
      toast.success('¡Trabajo aceptado!', {
        description: 'El trabajo ha sido asignado a tu cuenta'
      });
    } catch (error: any) {
      toast.error('Error al aceptar el trabajo', {
        description: error.message
      });
    }
  };

  const scheduledDate = job.scheduled_at ? new Date(job.scheduled_at) : null;
  const visitFeeStatus = getVisitFeeStatus(job);
  return (
    <Card className="bg-gradient-card border-border/50 hover:shadow-raised transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
              {job.urgent && (
                <Badge variant="destructive" className="animate-pulse">
                  Urgente
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {job.category} {job.service_type && `• ${job.service_type}`}
            </p>
          </div>
          <Badge variant="outline" className="bg-green-500/10 text-green-700">
            Nuevo
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Problem Description */}
        {job.problem && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
            <p className="text-foreground line-clamp-2">{job.problem}</p>
          </div>
        )}

        {/* Description */}
        {job.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {job.description}
          </p>
        )}

        {/* Photos indicator */}
        {job.photos && job.photos.length > 0 && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ImageIcon className="w-4 h-4" />
            <span>{job.photos.length} foto{job.photos.length > 1 ? 's' : ''} adjunta{job.photos.length > 1 ? 's' : ''}</span>
          </div>
        )}

        {/* Schedule */}
        {scheduledDate && (
          <>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="w-4 h-4" />
              <span>{format(scheduledDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>{format(scheduledDate, "HH:mm", { locale: es })}</span>
            </div>
          </>
        )}

        {/* Location */}
        {job.location && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{job.location}</span>
          </div>
        )}

        {/* Contact */}
        {job.clients && (
          <div className="text-sm text-muted-foreground">
            <p>Cliente: {job.clients.email}</p>
            
          </div>
        )}

        {/* Price */}
        <div className="flex items-center gap-2 text-lg font-semibold text-primary mt-4">
          <DollarSign className="w-5 h-5" />
          <span>${toFixedSafe(job.rate, 2)} MXN</span>
        </div>

        {/* Payment status */}
        <div className="flex items-center gap-2">
          <PaymentStatusBadge type="visit_fee" status={visitFeeStatus} role="provider" />
        </div>
      </CardContent>

      <CardFooter>
        <Button 
          onClick={handleAccept}
          className="w-full bg-gradient-button hover:shadow-button-hover"
        >
          Aceptar Trabajo
        </Button>
      </CardFooter>
    </Card>
  );
};
