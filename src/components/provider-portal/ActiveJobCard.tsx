import { motion } from "framer-motion";
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
      className="rounded-[20px] overflow-hidden cursor-pointer transition-all duration-200 relative"
      style={{
        background: '#0f1e33',
        boxShadow: '0 8px 32px rgba(6,14,26,0.25)',
      }}
    >
      {/* Subtle blue gradient overlay */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse 70% 50% at 100% 0%, rgba(46,143,255,0.2) 0%, transparent 60%)',
      }} />

      <div className="p-4 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          {/* Active pill with glowing green dot */}
          <div className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{
            background: 'rgba(0,208,132,0.15)',
            border: '1px solid rgba(0,208,132,0.3)',
          }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#00d084', animation: 'blink 1.5s ease-in-out infinite' }} />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.08em]" style={{ color: '#00d084' }}>
              Trabajo activo
            </span>
          </div>
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.08)' }}>
            <ChevronRight className="w-3.5 h-3.5 text-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-[22px] font-extrabold text-white leading-tight mb-2.5" style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-0.03em' }}>
          {job.title}
        </h3>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2.5">
          {scheduledDate && (
            <span className="flex items-center gap-[5px] text-[11.5px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <Calendar className="w-3 h-3" />
              {format(scheduledDate, "d MMM", { locale: es })}
            </span>
          )}
          {scheduledDate && (
            <span className="flex items-center gap-[5px] text-[11.5px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <Clock className="w-3 h-3" />
              {format(scheduledDate, "HH:mm")}
            </span>
          )}
          {job.location && (
            <span className="flex items-center gap-[5px] text-[11.5px] font-semibold" style={{ color: 'rgba(255,255,255,0.55)' }}>
              <MapPin className="w-3 h-3" />
              {getCity(job.location)}
            </span>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 px-[18px] py-2.5" style={{ background: 'rgba(255,255,255,0.04)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#ffb340' }} />
        <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.4)' }}>
          Finaliza este trabajo para aceptar otro
        </span>
      </div>
    </motion.div>
  );
};
