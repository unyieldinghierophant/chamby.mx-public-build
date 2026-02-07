import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Clock, ChevronRight, Briefcase } from "lucide-react";
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
      className="bg-primary/5 border-2 border-primary/30 rounded-xl p-3 mb-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
          <Briefcase className="w-3 h-3 text-primary" />
        </div>
        <Badge className="bg-primary text-primary-foreground text-[10px] px-2 py-0.5">
          Trabajo activo
        </Badge>
      </div>

      {/* Job Info */}
      <h3 className="font-semibold text-sm text-foreground line-clamp-1 mb-1.5">
        {job.title}
      </h3>

      {/* Meta row */}
      <div className="flex items-center gap-2 text-[10px] text-muted-foreground mb-3">
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

      {/* Client info */}
      {job.client && (
        <p className="text-xs text-muted-foreground mb-3">
          Cliente: <span className="font-medium text-foreground">{job.client.full_name}</span>
        </p>
      )}

      {/* Action */}
      <Button 
        size="sm" 
        className="w-full h-9"
        onClick={() => navigate(`/provider-portal/jobs`)}
      >
        Ver detalles
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </motion.div>
  );
};
