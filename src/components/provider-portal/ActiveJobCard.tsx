import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { ActiveJob } from "@/hooks/useActiveJobs";

interface ActiveJobCardProps {
  job: ActiveJob;
}

export const ActiveJobCard = ({ job }: ActiveJobCardProps) => {
  const navigate = useNavigate();
  const scheduledDate = job.scheduled_at ? new Date(job.scheduled_at) : null;

  const getCity = (location: string | null) => {
    if (!location) return null;
    const parts = location.split(',');
    return parts.length > 1 ? parts[parts.length - 2]?.trim() : parts[0]?.trim();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(`/provider-portal/jobs/${job.id}`)}
      className="bg-background border border-border/60 rounded-2xl p-3.5 shadow-sm cursor-pointer"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2">
        <Badge className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 font-medium border-0">
          Trabajo activo
        </Badge>
        <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
      </div>

      {/* Job title */}
      <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-2">
        {job.title}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
        {scheduledDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {format(scheduledDate, "d MMM", { locale: es })}
          </span>
        )}
        {scheduledDate && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {format(scheduledDate, "HH:mm")}
          </span>
        )}
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {getCity(job.location)}
          </span>
        )}
      </div>

      {/* Subtle helper text */}
      <p className="text-[10px] text-muted-foreground/50 mt-2">
        Finaliza este trabajo para aceptar otro
      </p>
    </motion.div>
  );
};
