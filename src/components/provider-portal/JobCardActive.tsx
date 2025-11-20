import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, Clock, DollarSign, User, Phone, MessageSquare, CheckCircle, Navigation } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { ActiveJob } from "@/hooks/useActiveJobs";
import { toast } from "sonner";

interface JobCardActiveProps {
  job: ActiveJob;
  onComplete: (jobId: string) => Promise<{ error: any }>;
}

export const JobCardActive = ({ job, onComplete }: JobCardActiveProps) => {
  const handleComplete = async () => {
    const { error } = await onComplete(job.id);
    if (error) {
      toast.error('Error al completar el trabajo', {
        description: error.message
      });
    } else {
      toast.success('¡Trabajo completado!', {
        description: 'El trabajo ha sido marcado como completado'
      });
    }
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
      </CardHeader>

      <CardContent className="space-y-3">
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
                {job.client.email || 'Cliente'}
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

        {/* Price */}
        <div className="flex items-center gap-2 text-lg font-semibold text-primary mt-4">
          <DollarSign className="w-5 h-5" />
          <span>${(job.total_amount || 0).toFixed(2)} MXN</span>
        </div>
      </CardContent>

      <CardFooter className="flex flex-col gap-2">
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
          >
            <MessageSquare className="w-4 h-4" />
            Chat
          </Button>
        </div>
        <Button 
          onClick={handleComplete}
          className="w-full bg-success hover:bg-success/90 text-success-foreground gap-2"
        >
          <CheckCircle className="w-4 h-4" />
          Marcar como Completado
        </Button>
      </CardFooter>
    </Card>
  );
};