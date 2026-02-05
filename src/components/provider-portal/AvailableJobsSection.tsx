import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MapPin, Calendar, Clock, DollarSign, AlertCircle, Briefcase, ArrowRight, ImageIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AvailableJob } from "@/hooks/useAvailableJobs";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

interface AvailableJobsSectionProps {
  jobs: AvailableJob[];
  loading: boolean;
  onAcceptJob: (jobId: string) => Promise<void>;
}

export const AvailableJobsSection = ({ jobs, loading, onAcceptJob }: AvailableJobsSectionProps) => {
  const navigate = useNavigate();

  const handleAcceptJob = async (jobId: string) => {
    try {
      await onAcceptJob(jobId);
      toast.success('¡Trabajo aceptado!', {
        description: 'El trabajo ha sido asignado a tu cuenta'
      });
    } catch (error: any) {
      toast.error('Error al aceptar el trabajo', {
        description: error.message
      });
    }
  };

  if (loading) {
    return (
      <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-primary/10">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Trabajos Disponibles
              {jobs.length > 0 && (
                <Badge variant="default" className="animate-pulse bg-primary">
                  {jobs.length} nuevo{jobs.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              Oportunidades de trabajo cerca de ti
            </p>
          </div>
        </div>
        
        {jobs.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/provider-portal/available-jobs")}
          >
            Ver todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {jobs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No hay trabajos disponibles</p>
            <p className="text-sm">Te notificaremos cuando haya nuevas oportunidades</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {jobs.slice(0, 4).map((job) => {
              const scheduledDate = job.scheduled_at ? new Date(job.scheduled_at) : null;
              
              return (
                <Card 
                  key={job.id} 
                  className="bg-background border-border hover:border-primary/50 hover:shadow-md transition-all"
                >
                  <CardContent className="p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-foreground truncate">{job.title}</h4>
                          {job.urgent && (
                            <Badge variant="destructive" className="text-xs animate-pulse">
                              Urgente
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {job.category}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 shrink-0">
                        Nuevo
                      </Badge>
                    </div>

                    {/* Problem */}
                    {job.problem && (
                      <div className="flex items-start gap-2 text-sm">
                        <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-primary" />
                        <p className="text-foreground line-clamp-2">{job.problem}</p>
                      </div>
                    )}

                    {/* Photos indicator */}
                    {job.photos && job.photos.length > 0 && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>{job.photos.length} foto{job.photos.length > 1 ? 's' : ''}</span>
                      </div>
                    )}

                    {/* Details Row */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                      {scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(scheduledDate, "d MMM", { locale: es })}
                        </span>
                      )}
                      {scheduledDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {format(scheduledDate, "HH:mm", { locale: es })}
                        </span>
                      )}
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[120px]">{job.location.split(',')[0]}</span>
                        </span>
                      )}
                    </div>

                    {/* Price & Action */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <div className="flex items-center gap-1.5 text-lg font-bold text-primary">
                        <DollarSign className="w-5 h-5" />
                        <span>${job.rate.toFixed(0)} MXN</span>
                      </div>
                      <Button 
                        size="sm"
                        onClick={() => handleAcceptJob(job.id)}
                        className="bg-gradient-button hover:shadow-button-hover"
                      >
                        Aceptar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {jobs.length > 4 && (
          <div className="mt-4 text-center">
            <Button 
              variant="link"
              onClick={() => navigate("/provider-portal/available-jobs")}
              className="text-primary"
            >
              Ver {jobs.length - 4} trabajo{jobs.length - 4 !== 1 ? 's' : ''} más
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
