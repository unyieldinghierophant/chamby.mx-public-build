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

const categoryEmoji: Record<string, string> = {
  'handyman': '🔧',
  'plumbing': '🔧',
  'plomería': '🔧',
  'electrical': '⚡',
  'electricidad': '⚡',
  'cleaning': '🧹',
  'limpieza': '🧹',
  'gardening': '🌿',
  'jardinería': '🌿',
  'auto': '🚗',
  'auto-wash': '🚗',
  'lavado': '🚗',
};

const categoryGradient: Record<string, string> = {
  'handyman': 'linear-gradient(135deg, #0c55ad 0%, #1a6fd4 50%, #2e8fff 100%)',
  'plumbing': 'linear-gradient(135deg, #0c55ad 0%, #1a6fd4 50%, #2e8fff 100%)',
  'plomería': 'linear-gradient(135deg, #0c55ad 0%, #1a6fd4 50%, #2e8fff 100%)',
  'electrical': 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
  'electricidad': 'linear-gradient(135deg, #d97706 0%, #f59e0b 50%, #fbbf24 100%)',
  'cleaning': 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
  'limpieza': 'linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)',
  'gardening': 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
  'jardinería': 'linear-gradient(135deg, #16a34a 0%, #22c55e 50%, #4ade80 100%)',
  'auto': 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 60%, #38bdf8 100%)',
  'auto-wash': 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 60%, #38bdf8 100%)',
  'lavado': 'linear-gradient(135deg, #0369a1 0%, #0ea5e9 60%, #38bdf8 100%)',
};

export const JobCardMobile = ({ job, onAccept, onViewDetails, isMatch = false, index = 0, disabled = false, distanceKm }: JobCardMobileProps) => {
  const hasPhotos = job.photos && job.photos.length > 0;
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

  const catKey = (job.category || '').toLowerCase();
  const emoji = categoryEmoji[catKey] || '🔧';
  const gradient = categoryGradient[catKey] || 'linear-gradient(135deg, #0c55ad 0%, #1a6fd4 50%, #2e8fff 100%)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + index * 0.08, duration: 0.4 }}
      onClick={handleCardClick}
      whileTap={disabled ? {} : { scale: 0.98 }}
      className={cn(
        "rounded-[20px] overflow-hidden cursor-pointer transition-all duration-250 w-full max-w-full relative",
        disabled ? 'opacity-50 grayscale pointer-events-none' : ''
      )}
      style={{
        background: 'white',
        border: isMatch ? '1.5px solid #fde68a' : '1.5px solid transparent',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* ─── Category Image Banner ─── */}
      <div className="relative h-[140px] overflow-hidden">
        {hasPhotos ? (
          <img
            src={job.photos![0]}
            alt={job.title}
            className="absolute inset-0 w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: gradient }}>
            <div className="absolute -top-5 -right-5 w-[120px] h-[120px] rounded-full" style={{ background: 'rgba(255,255,255,0.08)' }} />
            <div className="absolute -bottom-[30px] -left-2.5 w-[100px] h-[100px] rounded-full" style={{ background: 'rgba(0,0,0,0.08)' }} />
            <span className="text-[64px] relative z-10 drop-shadow-lg" style={{ animation: 'floatEmoji 3s ease-in-out infinite' }}>
              {emoji}
            </span>
          </div>
        )}

        {/* "Nuevo" badge top-left */}
        {isNew && (
          <div className="absolute top-3 left-3 flex items-center gap-[5px] rounded-full px-2.5 py-1 z-10" style={{
            background: 'rgba(255,255,255,0.95)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          }}>
            <span className="text-[9px]">✦</span>
            <span className="text-[10.5px] font-extrabold" style={{ color: '#0c55ad' }}>
              Nuevo
            </span>
          </div>
        )}

        {/* Price badge top-right */}
        <div className="absolute top-3 right-3 rounded-[10px] px-2.5 py-[5px] z-10" style={{
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: 'blur(8px)',
        }}>
          <span className="text-[15px] font-extrabold text-white" style={{  }}>
            ${job.rate.toLocaleString('es-MX')}
          </span>
          <span className="text-[9px] font-medium text-white/70 ml-0.5">MXN</span>
        </div>

        {/* Urgent badge */}
        {job.urgent && (
          <div className="absolute bottom-3 left-3 flex items-center gap-1 rounded-full px-2.5 py-1 z-10 animate-pulse" style={{ background: 'rgba(255,77,106,0.9)' }}>
            <AlertCircle className="w-2.5 h-2.5 text-white" />
            <span className="text-[10px] font-bold text-white">Urgente</span>
          </div>
        )}

        {/* Photo count indicator */}
        {hasPhotos && job.photos!.length > 1 && (
          <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full px-2 py-0.5 z-10" style={{
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(8px)',
          }}>
            <ImageIcon className="w-3 h-3 text-white" />
            <span className="text-[10px] font-bold text-white">{job.photos!.length}</span>
          </div>
        )}
      </div>

      {/* ─── Card Body ─── */}
      <div className="p-[14px_16px_16px]">
        {/* Category label */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#2e8fff' }} />
          <span className="text-[11px] font-bold uppercase tracking-[0.07em]" style={{ color: '#1a6fd4' }}>
            {job.category} {job.service_type && `· ${job.service_type}`}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-[17px] font-extrabold leading-tight mb-1.5" style={{ color: '#060e1a', letterSpacing: '-0.02em' }}>
          {job.title}
        </h3>

        {/* Description */}
        {(job.problem || job.description) && (
          <p className="text-[12px] leading-[1.5] mb-3 line-clamp-2" style={{ color: '#64748b' }}>
            {job.problem || job.description}
          </p>
        )}

        {/* Footer chips */}
        <div className="flex items-center justify-between pt-[11px]" style={{ borderTop: '1px solid #f1f5f9' }}>
          <div className="flex items-center gap-1.5 flex-wrap">
            {scheduledDate && (
              <div className="flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-semibold" style={{ background: '#f2f6fd', color: '#475569' }}>
                <Calendar className="w-[11px] h-[11px]" />
                {format(scheduledDate, "d MMM", { locale: es })} · {format(scheduledDate, "HH:mm")}
              </div>
            )}
            {(formatDistance(distanceKm) || job.location) && (
              <div className="flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-semibold" style={{ background: '#f2f6fd', color: '#475569' }}>
                <MapPin className="w-[11px] h-[11px]" />
                {formatDistance(distanceKm) || getCity(job.location)}
              </div>
            )}
            {job.visit_fee_paid && (
              <div className="flex items-center gap-1 rounded-full px-[9px] py-1 text-[11px] font-bold" style={{ background: '#dcfce7', color: '#16a34a' }}>
                ✓ Visita pagada
              </div>
            )}
          </div>
          <span className="flex items-center gap-1 text-[12px] font-bold whitespace-nowrap" style={{ color: '#0c55ad' }}>
            Ver →
          </span>
        </div>
      </div>
    </motion.div>
  );
};
