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
      whileTap={{ scale: 0.97 }}
      onClick={() => navigate(`/provider-portal/jobs/${job.id}`)}
      className="bg-background border-2 border-foreground/80 rounded-2xl p-4 shadow-md hover:shadow-lg cursor-pointer transition-shadow"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-2.5">
        <Badge className="bg-foreground text-background text-[11px] px-2.5 py-0.5 font-bold border-0 uppercase tracking-wide">
          Trabajo activo
        </Badge>
        <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-foreground/70" />
        </div>
      </div>

      {/* Job title */}
      <h3 className="font-bold text-lg md:text-xl text-foreground line-clamp-1 mb-2.5">
        {job.title}
      </h3>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        {scheduledDate && (
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(scheduledDate, "d MMM", { locale: es })}
          </span>
        )}
        {scheduledDate && (
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {format(scheduledDate, "HH:mm")}
          </span>
        )}
        {job.location && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" />
            {getCity(job.location)}
          </span>
        )}
      </div>

      {/* Helper text */}
      <p className="text-[10px] text-muted-foreground/60 mt-2.5">
        Finaliza este trabajo para aceptar otro
      </p>
    </motion.div>
  );
};
