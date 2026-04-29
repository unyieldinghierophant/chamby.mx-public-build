import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { X, MapPin, Clock, Briefcase, ArrowRight } from "lucide-react";
import { extractCity } from "@/hooks/usePublicAvailableJobs";
import { format } from "date-fns";

interface AlertJob {
  title: string;
  category: string;
  rate: number;
  location: string | null;
  created_at: string;
  assignment_deadline?: string | null;
}

interface AvailableJobsAlertProps {
  jobCount: number;
  isOpen: boolean;
  onClose: () => void;
  previewJob?: AlertJob | null;
}

const categoryEmoji: Record<string, string> = {
  handyman: "🔧",
  plumbing: "🔧",
  cleaning: "🧹",
  electrical: "⚡",
  gardening: "🌿",
  "auto-wash": "🚗",
  medusa: "🪼",
};

export const AvailableJobsAlert = ({
  jobCount,
  isOpen,
  onClose,
  previewJob,
}: AvailableJobsAlertProps) => {
  const navigate = useNavigate();
  const [hasPlayedSound, setHasPlayedSound] = useState(false);
  const [autoDismiss, setAutoDismiss] = useState(30);
  const [urgencyTimer, setUrgencyTimer] = useState(299);
  const autoRef = useRef<ReturnType<typeof setInterval>>();
  const urgencyRef = useRef<ReturnType<typeof setInterval>>();

  // Sound effect
  useEffect(() => {
    if (isOpen && jobCount > 0 && !hasPlayedSound) {
      try {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const beep = (t: number, f: number, d: number) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.connect(g);
          g.connect(ctx.destination);
          o.frequency.value = f;
          o.type = "sine";
          g.gain.setValueAtTime(0, t);
          g.gain.linearRampToValueAtTime(0.3, t + 0.01);
          g.gain.linearRampToValueAtTime(0.3, t + d - 0.01);
          g.gain.linearRampToValueAtTime(0, t + d);
          o.start(t);
          o.stop(t + d);
        };
        const now = ctx.currentTime;
        beep(now, 523.25, 0.15);
        beep(now + 0.2, 659.25, 0.15);
        beep(now + 0.4, 783.99, 0.25);
        setHasPlayedSound(true);
      } catch {}
    }
  }, [isOpen, jobCount, hasPlayedSound]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setHasPlayedSound(false);
      setAutoDismiss(30);
      setUrgencyTimer(299);
      clearInterval(autoRef.current);
      clearInterval(urgencyRef.current);
    }
  }, [isOpen]);

  // Auto-dismiss countdown
  useEffect(() => {
    if (!isOpen) return;
    autoRef.current = setInterval(() => {
      setAutoDismiss((p) => {
        if (p <= 1) {
          clearInterval(autoRef.current);
          onClose();
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(autoRef.current);
  }, [isOpen, onClose]);

  // Urgency countdown
  useEffect(() => {
    if (!isOpen) return;
    urgencyRef.current = setInterval(() => {
      setUrgencyTimer((p) => {
        if (p <= 0) {
          clearInterval(urgencyRef.current);
          return 0;
        }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(urgencyRef.current);
  }, [isOpen]);

  const handleViewJobs = () => {
    onClose();
    navigate("/provider-portal/available-jobs");
  };

  if (jobCount === 0) return null;

  const emoji = previewJob
    ? categoryEmoji[(previewJob.category || "").toLowerCase()] || "🔧"
    : "🔧";
  const city = previewJob ? extractCity(previewJob.location) : "Zona metro";
  const timeLabel = previewJob
    ? `Hoy · ${format(new Date(previewJob.created_at), "HH:mm")}`
    : "Reciente";
  const price = previewJob ? previewJob.rate : 0;
  const jobTitle = previewJob?.title || "Nuevo trabajo";

  const urgencyMin = Math.floor(urgencyTimer / 60);
  const urgencySec = urgencyTimer % 60;
  const urgencyStr = `${String(urgencyMin).padStart(2, "0")}:${String(urgencySec).padStart(2, "0")}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{
            background: "rgba(6,14,26,0.7)",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.85, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.5, type: "spring", damping: 18, stiffness: 200 }}
            className="w-full max-w-[380px] rounded-[28px] overflow-hidden relative"
            style={{
              background: "white",
              boxShadow: "0 32px 80px rgba(6,14,26,0.35), 0 8px 24px rgba(6,14,26,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── HERO ── */}
            <div className="relative text-center overflow-hidden" style={{ background: "#060e1a", padding: "32px 24px 28px" }}>
              {/* Mesh gradient */}
              <div
                className="absolute inset-0 animate-pulse"
                style={{
                  background:
                    "radial-gradient(ellipse 80% 80% at 80% 20%, rgba(12,85,173,0.7) 0%, transparent 60%), radial-gradient(ellipse 60% 60% at 20% 80%, rgba(46,143,255,0.3) 0%, transparent 55%)",
                  animationDuration: "4s",
                }}
              />
              {/* Dot grid */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.05) 1px, transparent 1px)",
                  backgroundSize: "20px 20px",
                }}
              />

              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3.5 right-3.5 w-[30px] h-[30px] rounded-lg flex items-center justify-center z-10 transition-colors"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
              >
                <X className="w-3 h-3" style={{ color: "rgba(255,255,255,0.7)" }} />
              </button>

              {/* Bell */}
              <div className="relative w-[76px] h-[76px] mx-auto mb-[18px] z-[1]">
                {/* Pulse rings */}
                <div
                  className="absolute rounded-[28px]"
                  style={{
                    inset: "-8px",
                    border: "2px solid rgba(46,143,255,0.3)",
                    animation: "alertRingExpand 2s ease-out infinite",
                  }}
                />
                <div
                  className="absolute rounded-[34px]"
                  style={{
                    inset: "-16px",
                    border: "2px solid rgba(46,143,255,0.15)",
                    animation: "alertRingExpand 2s ease-out infinite 0.4s",
                  }}
                />

                {/* Bell container */}
                <div
                  className="w-[76px] h-[76px] rounded-[22px] flex items-center justify-center"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1.5px solid rgba(255,255,255,0.15)",
                    backdropFilter: "blur(8px)",
                    animation: "alertBellShake 0.6s 0.4s cubic-bezier(0.36,0.07,0.19,0.97) both",
                  }}
                >
                  <svg width="34" height="34" viewBox="0 0 34 34" fill="none">
                    <path
                      d="M17 3a2 2 0 0 1 2 2v.5A8 8 0 0 1 25 13v5l2.5 4H6.5L9 18v-5a8 8 0 0 1 6-7.5V5a2 2 0 0 1 2-2z"
                      fill="white"
                      opacity="0.9"
                    />
                    <path
                      d="M14 27a3 3 0 0 0 6 0"
                      stroke="white"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                {/* Count badge */}
                <div
                  className="absolute flex items-center justify-center"
                  style={{
                    top: "-6px",
                    right: "-6px",
                    minWidth: "24px",
                    height: "24px",
                    background: "linear-gradient(135deg, #ff4d6a, #ff2d55)",
                    borderRadius: "99px",
                    border: "2.5px solid #060e1a",
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "white",
                    padding: "0 4px",
                    boxShadow: "0 2px 8px rgba(255,77,106,0.4)",
                    animation: "alertBadgePop 0.4s 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
                  }}
                >
                  {jobCount}
                </div>
              </div>

              {/* Title */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                style={{
                  fontSize: "22px",
                  fontWeight: 800,
                  color: "white",
                  letterSpacing: "-0.03em",
                  lineHeight: 1.2,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                ¡Tienes {jobCount} {jobCount === 1 ? "trabajo" : "trabajos"} disponible{jobCount === 1 ? "" : "s"}!
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="mt-1.5 relative z-[1]"
                style={{
                  fontSize: "13px",
                  color: "rgba(255,255,255,0.55)",
                }}
              >
                Hay nuevas oportunidades esperándote cerca
              </motion.div>
            </div>

            {/* ── JOB PREVIEW ── */}
            {previewJob && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mx-4 mt-4 flex items-center gap-3.5 rounded-2xl"
                style={{
                  background: "#f8fafc",
                  padding: "14px 16px",
                  border: "1.5px solid #e8f0fb",
                }}
              >
                {/* Emoji icon */}
                <div
                  className="flex-shrink-0 flex items-center justify-center rounded-[13px]"
                  style={{
                    width: "44px",
                    height: "44px",
                    background: "linear-gradient(135deg, #0c55ad, #2e8fff)",
                    fontSize: "22px",
                  }}
                >
                  {emoji}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div
                    className="truncate"
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#060e1a",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {jobTitle}
                  </div>
                  <div className="flex items-center gap-2 mt-[3px]">
                    <span className="flex items-center gap-1" style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                      <MapPin className="w-[11px] h-[11px]" />
                      {city}
                    </span>
                    <span className="flex items-center gap-1" style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
                      <Clock className="w-[11px] h-[11px]" />
                      {timeLabel}
                    </span>
                  </div>
                </div>

                {/* Price */}
                <div
                  className="whitespace-nowrap"
                  style={{
                    fontSize: "16px",
                    fontWeight: 800,
                    color: "#0c55ad",
                  }}
                >
                  ${price}
                  <br />
                  <small style={{ fontSize: "10px", fontWeight: 500, color: "#94a3b8" }}>MXN</small>
                </div>
              </motion.div>
            )}

            {/* ── URGENCY STRIP ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="mx-4 mt-2.5 flex items-center gap-2 rounded-xl"
              style={{
                background: "rgba(255,179,64,0.08)",
                border: "1px solid rgba(255,179,64,0.25)",
                padding: "9px 14px",
              }}
            >
              <div
                className="flex-shrink-0"
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#ffb340",
                  animation: "alertBlink 1.5s ease-in-out infinite",
                }}
              />
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#92400e",
                }}
              >
                Expira pronto — sé el primero
              </span>
              <span
                className="ml-auto"
                style={{
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "#ffb340",
                }}
              >
                {urgencyStr}
              </span>
            </motion.div>

            {/* ── ACTIONS ── */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col gap-2"
              style={{ padding: "16px 16px 20px" }}
            >
              {/* Primary CTA */}
              <button
                onClick={handleViewJobs}
                className="w-full flex items-center justify-center gap-2.5 relative overflow-hidden transition-all"
                style={{
                  height: "52px",
                  background: "linear-gradient(135deg, #0c55ad, #2e8fff)",
                  border: "none",
                  borderRadius: "15px",
                  fontSize: "15px",
                  fontWeight: 800,
                  color: "white",
                  letterSpacing: "-0.01em",
                  boxShadow: "0 8px 24px rgba(12,85,173,0.35)",
                  cursor: "pointer",
                }}
              >
                {/* Shine sweep */}
                <div
                  className="absolute top-0 h-full pointer-events-none"
                  style={{
                    width: "60%",
                    background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent)",
                    animation: "alertShine 3s ease-in-out infinite",
                    left: "-100%",
                  }}
                />
                <Briefcase className="w-[18px] h-[18px]" />
                Ver trabajos disponibles
                <ArrowRight className="w-[18px] h-[18px]" />
              </button>

              {/* Secondary */}
              <button
                onClick={onClose}
                className="w-full transition-colors"
                style={{
                  height: "44px",
                  background: "none",
                  border: "1.5px solid #e2e8f0",
                  borderRadius: "12px",
                  fontSize: "14px",
                  fontWeight: 700,
                  color: "#64748b",
                  cursor: "pointer",
                }}
              >
                Ver más tarde
              </button>

              {/* Auto-dismiss */}
              <div
                className="text-center"
                style={{
                  fontSize: "11px",
                  color: "#94a3b8",
                  fontWeight: 600,
                  paddingBottom: "4px",
                }}
              >
                Este aviso desaparece en{" "}
                <span style={{ color: "#0c55ad", fontWeight: 800 }}>{autoDismiss}</span>s
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
