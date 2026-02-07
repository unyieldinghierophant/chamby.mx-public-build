import { useState } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  X
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AvailableJob } from "@/hooks/useAvailableJobs";
import { cn } from "@/lib/utils";

interface JobDetailSheetProps {
  job: AvailableJob | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (jobId: string) => Promise<void>;
  hasActiveJob?: boolean;
}

export const JobDetailSheet = ({ 
  job, 
  isOpen, 
  onClose, 
  onAccept,
  hasActiveJob = false
}: JobDetailSheetProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAccepting, setIsAccepting] = useState(false);

  if (!job) return null;

  const scheduledDate = job.scheduled_at ? new Date(job.scheduled_at) : null;
  const isNew = new Date(job.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);
  const hasPhotos = job.photos && job.photos.length > 0;

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(job.id);
      onClose();
    } catch (error) {
      console.error("Error accepting job:", error);
    } finally {
      setIsAccepting(false);
    }
  };

  const nextImage = () => {
    if (job.photos && currentImageIndex < job.photos.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  };

  const prevImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(prev => prev - 1);
    }
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[90vh] overflow-hidden">
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-background/80 backdrop-blur-sm border border-border"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="overflow-y-auto max-h-[calc(90vh-4rem)]">
          {/* Image Gallery */}
          <div className="relative w-full aspect-video bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10">
            {hasPhotos ? (
              <>
                <img 
                  src={job.photos![currentImageIndex]} 
                  alt={job.title}
                  className="w-full h-full object-cover"
                />
                
                {/* Image Navigation */}
                {job.photos!.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      disabled={currentImageIndex === 0}
                      className={cn(
                        "absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm",
                        currentImageIndex === 0 && "opacity-50"
                      )}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={nextImage}
                      disabled={currentImageIndex === job.photos!.length - 1}
                      className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-background/80 backdrop-blur-sm",
                        currentImageIndex === job.photos!.length - 1 && "opacity-50"
                      )}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      {currentImageIndex + 1}/{job.photos!.length}
                    </div>
                  </>
                )}
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <ImageIcon className="w-6 h-6" />
                  <span className="text-sm">Sin fotos</span>
                </div>
              </div>
            )}

            {/* Badges overlay */}
            <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
              {isNew && (
                <Badge className="bg-primary text-primary-foreground text-xs px-2">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Nuevo
                </Badge>
              )}
              {job.urgent && (
                <Badge variant="destructive" className="text-xs px-2 animate-pulse">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Urgente
                </Badge>
              )}
            </div>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Title & Category */}
            <div>
              <h2 className="text-xl font-bold text-foreground">
                {job.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {job.category} {job.service_type && `• ${job.service_type}`}
              </p>
            </div>

            {/* Description */}
            {(job.problem || job.description) && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <FileText className="w-4 h-4" />
                  Descripción
                </div>
                <p className="text-sm text-muted-foreground">
                  {job.problem || job.description}
                </p>
              </div>
            )}

            {/* Location */}
            {job.location && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <MapPin className="w-4 h-4" />
                  Ubicación
                </div>
                <p className="text-sm text-muted-foreground">
                  {job.location}
                </p>
              </div>
            )}

            {/* Date & Time */}
            {scheduledDate && (
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground mb-1">
                  <Calendar className="w-4 h-4" />
                  Fecha y hora
                </div>
                <p className="text-sm text-muted-foreground">
                  {format(scheduledDate, "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                </p>
              </div>
            )}

            {/* Price & Trust Badge */}
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Tarifa</p>
                <p className="text-2xl font-bold text-foreground">
                  ${job.rate.toLocaleString('es-MX')} <span className="text-sm font-normal text-muted-foreground">MXN</span>
                </p>
              </div>
              
              {job.visit_fee_paid && (
                <Badge variant="outline" className="text-xs px-2 py-1 border-green-500/50 text-green-600 bg-green-50">
                  <CheckCircle2 className="w-3 h-3 mr-1" />
                  Visita pagada
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Accept Button - Fixed at bottom */}
        <div className="p-4 border-t border-border bg-background">
          {hasActiveJob ? (
            <div className="text-center py-2">
              <p className="text-sm text-muted-foreground">
                Finaliza tu trabajo activo para aceptar otro
              </p>
            </div>
          ) : (
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleAccept}
              disabled={isAccepting}
            >
              {isAccepting ? "Aceptando..." : "Aceptar Trabajo"}
            </Button>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
