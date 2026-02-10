import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { 
  MapPin, 
  Calendar, 
  Clock, 
  ImageIcon,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Navigation
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { AvailableJob } from "@/hooks/useAvailableJobs";
import { cn } from "@/lib/utils";

interface JobCardMobileProps {
  job: AvailableJob;
  onAccept: (jobId: string) => Promise<void>;
  onViewDetails?: (job: AvailableJob) => void;
  isMatch?: boolean;
  index?: number;
  disabled?: boolean;
  distanceKm?: number | null;
}

export const JobCardMobile = ({ job, onAccept, onViewDetails, isMatch = false, index = 0, disabled = false, distanceKm }: JobCardMobileProps) => {
  const scheduledDate = job.scheduled_at ? new Date(job.scheduled_at) : null;
  const isNew = new Date(job.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000);

  const getCity = (location: string | null) => {
    if (!location) return null;
    const parts = location.split(',');
    return parts.length > 1 ? parts[parts.length - 2]?.trim() : parts[0]?.trim();
  };

  const formatDistance = (km: number | null | undefined) => {
    if (km === null || km === undefined) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km.toFixed(1)} km`;
  };

  const handleCardClick = () => {
    if (disabled) return;
    if (onViewDetails) {
      onViewDetails(job);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={handleCardClick}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cn(
        "bg-background rounded-2xl overflow-hidden shadow-sm border transition-all duration-200 w-full max-w-full cursor-pointer",
        isMatch ? 'border-amber-400/40 ring-1 ring-amber-400/10' : 'border-border/50',
        disabled ? 'opacity-50 grayscale pointer-events-none' : ''
      )}
    >
      <div className="flex flex-col w-full max-w-full overflow-hidden">
        {/* Image Section */}
        <div className="relative w-full aspect-[3/1] bg-muted/40 overflow-hidden">
          {job.photos && job.photos.length > 0 ? (
            <>
              <div className="absolute inset-0 animate-pulse bg-muted/60" />
              <img 
                src={job.photos[0]} 
                alt={job.title}
                className="absolute inset-0 w-full h-full object-cover"
                loading="lazy"
                onLoad={(e) => {
                  const prev = e.currentTarget.previousElementSibling as HTMLElement;
                  if (prev) prev.style.display = 'none';
                }}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 text-muted-foreground/50">
                <ImageIcon className="w-4 h-4" />
                <span className="text-[11px]">{job.category}</span>
              </div>
            </div>
          )}

          {/* Badges - Top left */}
          <div className="absolute top-1.5 left-1.5 flex flex-wrap gap-1">
            {isNew && (
              <Badge className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                Nuevo
              </Badge>
            )}
            {job.urgent && (
              <Badge variant="destructive" className="text-[9px] px-1.5 py-0 animate-pulse">
                <AlertCircle className="w-2.5 h-2.5 mr-0.5" />
                Urgente
              </Badge>
            )}
          </div>

          {/* Distance badge - Top right */}
          {formatDistance(distanceKm) && (
            <div className="absolute top-1.5 right-1.5 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <Navigation className="w-2.5 h-2.5" />
              {formatDistance(distanceKm)}
            </div>
          )}

          {/* Photo count */}
          {job.photos && job.photos.length > 1 && (
            <div className="absolute bottom-1.5 right-1.5 bg-black/50 text-white text-[9px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
              <ImageIcon className="w-2.5 h-2.5" />
              {job.photos.length}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="p-3 flex flex-col min-w-0 overflow-hidden">
          {/* Category + Title */}
          <div className="flex items-start gap-2 mb-1">
            <div className="w-6 h-6 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ImageIcon className="w-3 h-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-primary font-medium truncate">
                {job.category} {job.service_type && `• ${job.service_type}`}
              </p>
              <h3 className="font-semibold text-sm text-foreground line-clamp-1">
                {job.title}
              </h3>
            </div>
          </div>

          {/* Description */}
          {(job.problem || job.description) && (
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2 pl-8">
              {job.problem || job.description}
            </p>
          )}

          {/* Meta Row */}
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-2 pl-8 flex-wrap">
            {scheduledDate && (
              <span className="flex items-center gap-0.5">
                <Calendar className="w-2.5 h-2.5" />
                {format(scheduledDate, "d MMM", { locale: es })}
              </span>
            )}
            {scheduledDate && (
              <span className="flex items-center gap-0.5">
                <Clock className="w-2.5 h-2.5" />
                {format(scheduledDate, "HH:mm")}
              </span>
            )}
            {job.location && (
              <span className="flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                {getCity(job.location)}
              </span>
            )}
            {distanceKm === null && distanceKm === undefined ? null : !formatDistance(distanceKm) && (
              <span className="flex items-center gap-0.5 italic">
                <Navigation className="w-2.5 h-2.5" />
                Distancia no disponible
              </span>
            )}
          </div>

          {/* Price + Trust Badge + CTA Row */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50">
            <div className="flex items-center gap-2">
              <div className="flex items-baseline gap-0.5">
                <span className="text-base font-bold text-foreground">
                  ${job.rate.toLocaleString('es-MX')}
                </span>
                <span className="text-[10px] text-muted-foreground">MXN</span>
              </div>
              {job.visit_fee_paid && (
                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-green-500/50 text-green-600 bg-green-50">
                  <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
                  Visita pagada
                </Badge>
              )}
            </div>
            <span className="text-[10px] font-medium text-primary">
              Ver detalles →
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
