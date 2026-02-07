import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ImageIcon,
  Sparkles,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AvailableJob } from "@/hooks/useAvailableJobs";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobCardMobileProps {
  job: AvailableJob;
  onAccept: (jobId: string) => Promise<void>;
  isMatch?: boolean;
  index?: number;
}

export const JobCardMobile = ({ job, onAccept, isMatch = false, index = 0 }: JobCardMobileProps) => {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const scheduledDate = job.scheduled_at ? new Date(job.scheduled_at) : null;
  const isNew = new Date(job.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

  const handleAccept = async () => {
    setIsAccepting(true);
    try {
      await onAccept(job.id);
      toast.success('¡Trabajo aceptado!', {
        description: 'El cliente será notificado de tu aceptación.'
      });
      setShowConfirmDialog(false);
    } catch (error: any) {
      toast.error('Error al aceptar', {
        description: error.message || 'Intenta de nuevo'
      });
    } finally {
      setIsAccepting(false);
    }
  };

  // Get city from location string
  const getCity = (location: string | null) => {
    if (!location) return null;
    const parts = location.split(',');
    return parts.length > 1 ? parts[parts.length - 2]?.trim() : parts[0]?.trim();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.03, duration: 0.2 }}
        className={cn(
          "bg-card rounded-xl overflow-hidden shadow-sm border transition-all duration-200 active:scale-[0.98] w-full max-w-full",
          isMatch ? 'border-amber-400/50 ring-1 ring-amber-400/20' : 'border-border'
        )}
      >
        {/* Mobile: Vertical layout / Desktop: Horizontal */}
        <div className="flex flex-col sm:flex-row w-full max-w-full overflow-hidden">
          {/* Image Section - Full width on mobile, 40% on desktop */}
          <div className="relative w-full sm:w-2/5 aspect-[16/10] sm:aspect-square bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 overflow-hidden flex-shrink-0">
            {job.photos && job.photos.length > 0 ? (
              <img 
                src={job.photos[0]} 
                alt={job.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                    <ImageIcon className="w-5 h-5 sm:w-6 sm:h-6 text-primary/50" />
                  </div>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">{job.category}</p>
                </div>
              </div>
            )}

            {/* Badges - Positioned in corner */}
            <div className="absolute top-2 left-2 flex flex-wrap gap-1.5">
              {isNew && (
                <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Nuevo
                </Badge>
              )}
              {job.urgent && (
                <Badge variant="destructive" className="text-[10px] px-2 py-0.5 animate-pulse">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  Urgente
                </Badge>
              )}
              {isMatch && (
                <Badge className="bg-amber-500 text-white text-[10px] px-2 py-0.5">
                  ✨ Match
                </Badge>
              )}
            </div>

            {/* Photo count indicator */}
            {job.photos && job.photos.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                {job.photos.length}
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="flex-1 p-3 sm:p-4 flex flex-col min-w-0 overflow-hidden">
            {/* Title + Category */}
            <div className="mb-1.5 sm:mb-2 overflow-hidden">
              <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">
                {job.title}
              </h3>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {job.category} {job.service_type && `• ${job.service_type}`}
              </p>
            </div>

            {/* Problem/Description - 2 lines max */}
            {(job.problem || job.description) && (
              <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mb-2 flex-grow">
                {job.problem || job.description}
              </p>
            )}

            {/* Metadata Row - Horizontal scroll on mobile */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground mb-2 sm:mb-3 overflow-x-auto scrollbar-hide -mx-1 px-1">
              {scheduledDate && (
                <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap bg-muted/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  <Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                  {format(scheduledDate, "d MMM", { locale: es })}
                </span>
              )}
              {scheduledDate && (
                <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap bg-muted/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                  {format(scheduledDate, "HH:mm")}
                </span>
              )}
              {job.location && (
                <span className="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap bg-muted/50 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full">
                  <MapPin className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                  {getCity(job.location)}
                </span>
              )}
            </div>

            {/* Price + Button Row */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50 mt-auto">
              <div className="flex items-baseline gap-0.5 sm:gap-1">
                <span className="text-base sm:text-lg font-bold text-foreground">
                  ${job.rate.toLocaleString('es-MX')}
                </span>
                <span className="text-[10px] sm:text-xs text-muted-foreground">MXN</span>
              </div>
              <Button 
                onClick={() => setShowConfirmDialog(true)}
                size="sm"
                className="bg-primary hover:bg-primary/90 h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm"
              >
                Aceptar
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="max-w-sm mx-4">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aceptar este trabajo?</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p className="font-medium text-foreground">{job.title}</p>
                <p className="text-lg font-bold text-primary">
                  ${job.rate.toLocaleString('es-MX')} MXN
                </p>
                {job.location && (
                  <p className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4" />
                    {job.location}
                  </p>
                )}
                {scheduledDate && (
                  <p className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    {format(scheduledDate, "d 'de' MMMM, yyyy 'a las' HH:mm", { locale: es })}
                  </p>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row gap-2">
            <AlertDialogCancel className="flex-1 m-0">Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleAccept}
              disabled={isAccepting}
              className="flex-1 m-0 bg-primary hover:bg-primary/90"
            >
              {isAccepting ? 'Aceptando...' : 'Confirmar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
