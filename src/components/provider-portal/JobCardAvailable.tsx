import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Calendar, Clock, DollarSign, User } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AvailableJob } from "@/hooks/useAvailableJobs";
import { toast } from "sonner";

interface JobCardAvailableProps {
  job: AvailableJob;
  onAccept: (jobId: string) => Promise<{ error: any }>;
}

export const JobCardAvailable = ({ job, onAccept }: JobCardAvailableProps) => {
  const handleAccept = async () => {
    const { error } = await onAccept(job.id);
    if (error) {
      toast.error('Error al aceptar el trabajo', {
        description: error.message
      });
    } else {
      toast.success('¡Trabajo aceptado!', {
        description: 'El trabajo ha sido asignado a tu cuenta'
      });
    }
  };

  const scheduledDate = new Date(job.scheduled_date);

  return (
    <Card className="bg-gradient-card border-border/50 hover:shadow-raised transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="font-semibold text-lg text-foreground">{job.title}</h3>
            {job.service && (
              <p className="text-sm text-muted-foreground mt-1">
                {job.service.category} • {job.service.name}
              </p>
            )}
          </div>
          <StatusBadge status={job.status} size="sm" />
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Customer Info */}
        {job.customer && (
          <div className="flex items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={job.customer.avatar_url || undefined} />
              <AvatarFallback>
                <User className="w-4 h-4" />
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-foreground">
              {job.customer.full_name || 'Cliente'}
            </span>
          </div>
        )}

        {/* Schedule */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>{format(scheduledDate, "d 'de' MMMM, yyyy", { locale: es })}</span>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>{format(scheduledDate, "HH:mm", { locale: es })} • {job.duration_hours}h</span>
        </div>

        {/* Location */}
        {job.address && (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span className="line-clamp-2">{job.address}</span>
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
          <span>${job.total_amount.toFixed(2)} MXN</span>
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