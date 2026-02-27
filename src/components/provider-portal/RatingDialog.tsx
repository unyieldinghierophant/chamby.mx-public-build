import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* ── Tags per role ─────────────────────────────────────── */
const CLIENT_TAGS = ["Puntual", "Profesional", "Trabajo limpio", "Buen precio", "Lo recomiendo"];
const PROVIDER_TAGS = ["Cliente amable", "Lugar accesible", "Instrucciones claras", "Pago rápido"];

const RATING_LABELS = ["", "Muy malo 😕", "Malo 😐", "Bueno 👍", "Muy bueno 😊", "Excelente! 🤩"];

const CONFETTI_COLORS = ["#0c55ad", "#2e8fff", "#00d084", "#ffb340", "#ff4d6a"];

/* ── Inline styles (pixel-for-pixel match) ─────────────── */
const STYLES = `
  .chamby-rating-backdrop {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(6,14,26,0.65);
    backdrop-filter: blur(6px);
    display: flex; align-items: flex-end; justify-content: center;
    animation: chambyFadeIn 0.3s ease;
    transition: opacity 0.3s;
  }
  @keyframes chambyFadeIn { from { opacity: 0; } to { opacity: 1; } }

  .chamby-rating-sheet {
    width: 100%; max-width: 430px;
    background: white; border-radius: 28px 28px 0 0;
    padding: 0 0 40px; overflow: hidden; position: relative;
    animation: chambySlideUp 0.45s cubic-bezier(0.34,1.2,0.64,1);
  }
  @keyframes chambySlideUp {
    from { transform: translateY(100%); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }

  .chamby-handle {
    width: 40px; height: 4px;
    background: #e2e8f0; border-radius: 99px;
    margin: 12px auto 0;
  }

  /* Hero */
  .chamby-hero {
    position: relative; padding: 24px 24px 20px;
    text-align: center; overflow: hidden;
  }
  .chamby-hero::before {
    content: ''; position: absolute; top: -40px; left: 50%;
    transform: translateX(-50%); width: 300px; height: 200px;
    background: radial-gradient(ellipse, rgba(12,85,173,0.08) 0%, transparent 70%);
    pointer-events: none;
  }

  /* Completion ring */
  .chamby-ring { width: 80px; height: 80px; margin: 0 auto 16px; position: relative; }
  .chamby-ring-bg {
    width: 80px; height: 80px; border-radius: 50%;
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    display: flex; align-items: center; justify-content: center;
    animation: chambyRingPop 0.5s 0.1s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  @keyframes chambyRingPop { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  .chamby-ring-bg svg { width: 36px; height: 36px; color: #16a34a; animation: chambyCheckDraw 0.4s 0.4s ease both; }
  @keyframes chambyCheckDraw { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }

  /* Confetti */
  .chamby-confetti { position: absolute; top: 0; left: 0; right: 0; height: 100px; pointer-events: none; overflow: hidden; }
  .chamby-dot { position: absolute; border-radius: 50%; animation: chambyConfettiFall 1s ease-out both; }
  @keyframes chambyConfettiFall { from { transform: translateY(-20px) scale(0); opacity: 1; } to { transform: translateY(80px) scale(1); opacity: 0; } }

  .chamby-title {
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 22px; font-weight: 800;
    color: #060e1a; letter-spacing: -0.03em; margin-bottom: 4px;
    animation: chambyFadeUpItem 0.4s 0.2s both;
  }
  .chamby-sub {
    font-size: 14px; color: #64748b; font-weight: 500;
    animation: chambyFadeUpItem 0.4s 0.25s both;
  }
  @keyframes chambyFadeUpItem { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

  /* Subject card */
  .chamby-subject-card {
    margin: 4px 20px 20px; background: #f8fafc; border-radius: 18px;
    padding: 14px 16px; display: flex; align-items: center; gap: 14px;
    animation: chambyFadeUpItem 0.4s 0.3s both;
  }
  .chamby-subject-avatar {
    width: 52px; height: 52px; border-radius: 15px;
    background: linear-gradient(135deg, #2e8fff, #0c55ad);
    display: flex; align-items: center; justify-content: center;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 20px;
    font-weight: 800; color: white; flex-shrink: 0; position: relative;
    overflow: hidden;
  }
  .chamby-subject-avatar img { width: 100%; height: 100%; object-fit: cover; }
  .chamby-verified-badge {
    position: absolute; bottom: -3px; right: -3px; width: 16px; height: 16px;
    background: #0c55ad; border-radius: 50%; border: 2px solid white;
    display: flex; align-items: center; justify-content: center;
  }
  .chamby-verified-badge svg { width: 7px; height: 7px; }
  .chamby-subject-info { flex: 1; }
  .chamby-subject-name { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700; color: #060e1a; letter-spacing: -0.01em; }
  .chamby-subject-service { font-size: 12px; color: #64748b; margin-top: 2px; font-weight: 500; }
  .chamby-job-tag {
    background: rgba(12,85,173,0.08); color: #0c55ad; font-size: 11px;
    font-weight: 700; padding: 4px 10px; border-radius: 99px;
    font-family: 'Plus Jakarta Sans', sans-serif; white-space: nowrap;
  }

  /* Stars */
  .chamby-stars-section { padding: 0 24px; text-align: center; animation: chambyFadeUpItem 0.4s 0.35s both; }
  .chamby-stars-label {
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 13px; font-weight: 700;
    color: #94a3b8; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 14px;
  }
  .chamby-stars-row { display: flex; justify-content: center; gap: 10px; margin-bottom: 10px; }
  .chamby-star {
    cursor: pointer; transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
    position: relative; background: none; border: none; padding: 0;
  }
  .chamby-star svg { width: 44px; height: 44px; transition: all 0.2s; }
  .chamby-star.empty svg { color: #e2e8f0; }
  .chamby-star.filled svg { color: #ffb340; filter: drop-shadow(0 2px 8px rgba(255,179,64,0.4)); }
  .chamby-star:hover { transform: scale(1.2); }
  .chamby-star.filled { transform: scale(1.1); }
  .chamby-star.bump { animation: chambyStarBump 0.3s cubic-bezier(0.34,1.56,0.64,1); }
  @keyframes chambyStarBump { 0% { transform: scale(1); } 50% { transform: scale(1.4); } 100% { transform: scale(1.1); } }
  .chamby-rating-label {
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 15px; font-weight: 700;
    color: #060e1a; min-height: 22px; transition: all 0.2s; margin-top: 6px;
  }

  /* Comment */
  .chamby-comment-section { padding: 16px 20px 0; animation: chambyFadeUpItem 0.4s 0.4s both; }
  .chamby-comment-wrap { position: relative; }
  .chamby-comment-input {
    width: 100%; background: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 14px;
    padding: 14px 16px 36px; font-family: 'Nunito', sans-serif; font-size: 14px;
    color: #060e1a; resize: none; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    min-height: 90px;
  }
  .chamby-comment-input::placeholder { color: #94a3b8; }
  .chamby-comment-input:focus { border-color: #0c55ad; box-shadow: 0 0 0 3px rgba(12,85,173,0.08); }
  .chamby-char-count { position: absolute; bottom: 10px; right: 14px; font-size: 11px; color: #94a3b8; font-weight: 600; }

  /* Quick tags */
  .chamby-quick-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
  .chamby-tag {
    background: white; border: 1.5px solid #e2e8f0; border-radius: 99px;
    padding: 6px 12px; font-size: 12px; font-weight: 600; color: #475569;
    cursor: pointer; transition: all 0.15s; font-family: 'Nunito', sans-serif;
  }
  .chamby-tag:hover { border-color: #0c55ad; color: #0c55ad; background: rgba(12,85,173,0.04); }
  .chamby-tag.selected { background: rgba(12,85,173,0.08); border-color: #0c55ad; color: #0c55ad; font-weight: 700; }

  /* Actions */
  .chamby-actions { padding: 20px 20px 0; display: flex; flex-direction: column; gap: 10px; animation: chambyFadeUpItem 0.4s 0.45s both; }
  .chamby-submit-btn {
    width: 100%; height: 54px;
    background: linear-gradient(135deg, #0c55ad, #2e8fff);
    border: none; border-radius: 16px;
    font-family: 'Plus Jakarta Sans', sans-serif; font-size: 16px; font-weight: 700;
    color: white; cursor: pointer; display: flex; align-items: center; justify-content: center;
    gap: 8px; letter-spacing: -0.01em;
    box-shadow: 0 8px 24px rgba(12,85,173,0.3);
    transition: all 0.2s cubic-bezier(0.34,1.2,0.64,1);
    position: relative; overflow: hidden;
  }
  .chamby-submit-btn::before {
    content: ''; position: absolute; top: 0; left: -100%; width: 60%; height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.15), transparent);
    animation: chambyBtnShine 3s ease-in-out infinite;
  }
  @keyframes chambyBtnShine { 0% { left: -100%; } 40%, 100% { left: 150%; } }
  .chamby-submit-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 32px rgba(12,85,173,0.35); }
  .chamby-submit-btn:active { transform: scale(0.98); }
  .chamby-submit-btn:disabled { opacity: 0.7; cursor: not-allowed; transform: none; }
  .chamby-submit-btn svg { width: 18px; height: 18px; }

  .chamby-skip-btn {
    width: 100%; height: 44px; background: none; border: none;
    font-family: 'Nunito', sans-serif; font-size: 14px; font-weight: 600;
    color: #94a3b8; cursor: pointer; transition: color 0.15s;
  }
  .chamby-skip-btn:hover { color: #64748b; }

  /* Success overlay */
  .chamby-success-overlay {
    position: absolute; inset: 0; background: white;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    gap: 16px; opacity: 0; pointer-events: none; transition: opacity 0.3s;
    padding: 40px; text-align: center; z-index: 10;
  }
  .chamby-success-overlay.show { opacity: 1; pointer-events: all; }
  .chamby-success-icon {
    width: 80px; height: 80px;
    background: linear-gradient(135deg, #dcfce7, #bbf7d0);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    animation: chambyRingPop 0.5s cubic-bezier(0.34,1.56,0.64,1) both;
  }
  .chamby-success-icon svg { width: 36px; height: 36px; color: #16a34a; }
  .chamby-success-title { font-family: 'Plus Jakarta Sans', sans-serif; font-size: 24px; font-weight: 800; color: #060e1a; letter-spacing: -0.03em; }
  .chamby-success-sub { font-size: 14px; color: #64748b; line-height: 1.5; }
`;

/* ── Props ─────────────────────────────────────────────── */
interface RatingDialogProps {
  jobId: string;
  otherUserId: string;
  reviewerRole: "client" | "provider";
  onComplete: () => void;
  onDismiss: () => void;
  /** Subject display info */
  subjectName?: string;
  subjectAvatarUrl?: string | null;
  jobCategory?: string;
  jobServiceType?: string;
  jobRate?: number;
}

export const RatingDialog = ({
  jobId,
  otherUserId,
  reviewerRole,
  onComplete,
  onDismiss,
  subjectName = "Proveedor",
  subjectAvatarUrl,
  jobCategory = "",
  jobServiceType = "",
  jobRate = 0,
}: RatingDialogProps) => {
  const { user } = useAuth();
  const [rating, setRatingState] = useState(0);
  const [bumpedStar, setBumpedStar] = useState<number | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const confettiRef = useRef<HTMLDivElement>(null);

  const tags = reviewerRole === "client" ? CLIENT_TAGS : PROVIDER_TAGS;

  const title = reviewerRole === "client" ? "¡Trabajo completado!" : "¿Cómo fue el cliente?";
  const subtitle = reviewerRole === "client"
    ? "¿Cómo estuvo tu experiencia con el servicio?"
    : "Tu opinión ayuda a mejorar la comunidad Chamby";
  const serviceLabel = reviewerRole === "client"
    ? `${jobCategory}${jobServiceType ? ` · ${jobServiceType}` : ""}`
    : `Cliente · ${jobCategory}`;

  const initials = subjectName.charAt(0).toUpperCase();

  // Spawn confetti dots on mount
  useEffect(() => {
    if (!confettiRef.current) return;
    const wrap = confettiRef.current;
    wrap.innerHTML = "";
    for (let i = 0; i < 18; i++) {
      const d = document.createElement("div");
      d.className = "chamby-dot";
      const size = Math.random() * 8 + 4;
      d.style.cssText = `
        width: ${size}px; height: ${size}px;
        background: ${CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)]};
        left: ${Math.random() * 100}%;
        top: 0;
        animation-delay: ${Math.random() * 0.6}s;
        animation-duration: ${Math.random() * 0.5 + 0.8}s;
      `;
      wrap.appendChild(d);
    }
  }, []);

  const handleSetRating = useCallback((val: number) => {
    setRatingState(val);
    setBumpedStar(val);
    setTimeout(() => setBumpedStar(null), 350);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      // Shake stars row
      const row = document.querySelector(".chamby-stars-row") as HTMLElement | null;
      if (row) {
        row.style.transform = "translateX(5px)";
        setTimeout(() => { row.style.transform = "translateX(-5px)"; setTimeout(() => { row.style.transform = ""; }, 100); }, 100);
      }
      return;
    }

    setSubmitting(true);

    try {
      // Check if other party already reviewed
      const { data: otherReview } = await supabase
        .from("reviews")
        .select("id")
        .eq("job_id", jobId)
        .eq("reviewer_role", reviewerRole === "client" ? "provider" : "client")
        .maybeSingle();

      const visibleAt = otherReview
        ? new Date().toISOString()
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const reviewData = {
        job_id: jobId,
        client_id: reviewerRole === "client" ? user.id : otherUserId,
        provider_id: reviewerRole === "provider" ? user.id : otherUserId,
        rating,
        comment: comment.trim() || null,
        tags: selectedTags,
        reviewer_role: reviewerRole,
        visible_at: visibleAt,
      };

      const { error } = await supabase.from("reviews").insert(reviewData);
      if (error) throw error;

      // If other party already reviewed, make their review visible
      if (otherReview) {
        await supabase
          .from("reviews")
          .update({ visible_at: new Date().toISOString() })
          .eq("id", otherReview.id);
      }

      // System message in chat
      const systemMsg = reviewerRole === "client"
        ? "⭐ El cliente calificó el trabajo"
        : "⭐ El proveedor calificó el trabajo";

      await supabase.from("messages").insert({
        job_id: jobId,
        sender_id: user.id,
        receiver_id: otherUserId,
        message_text: systemMsg,
        is_system_message: true,
        system_event_type: "rating_submitted",
        read: false,
      });

      // Show success overlay for 1.8s then close
      setShowSuccess(true);
      // Store dismissal in localStorage
      storeDismissal(jobId, reviewerRole);
      setTimeout(() => {
        onComplete();
      }, 1800);
    } catch (err: any) {
      console.error("Rating error:", err);
      toast.error("Error al enviar calificación");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSkip = () => {
    storeDismissal(jobId, reviewerRole);
    onDismiss();
  };

  /* ── Checkmark SVG path ── */
  const checkPath = "M8 18l7 7 13-13";

  return createPortal(
    <>
      <style>{STYLES}</style>
      <div className="chamby-rating-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleSkip(); }}>
        <div className="chamby-rating-sheet" onClick={e => e.stopPropagation()}>
          <div className="chamby-handle" />

          {/* Confetti */}
          <div className="chamby-confetti" ref={confettiRef} />

          {/* Hero */}
          <div className="chamby-hero">
            <div className="chamby-ring">
              <div className="chamby-ring-bg">
                <svg viewBox="0 0 36 36" fill="none">
                  <path d={checkPath} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="chamby-title">{title}</div>
            <div className="chamby-sub">{subtitle}</div>
          </div>

          {/* Subject card */}
          <div className="chamby-subject-card">
            <div className="chamby-subject-avatar">
              {subjectAvatarUrl ? (
                <img src={subjectAvatarUrl} alt={subjectName} />
              ) : (
                initials
              )}
              <div className="chamby-verified-badge">
                <svg viewBox="0 0 8 8" fill="none">
                  <path d="M1.5 4l1.5 1.5 3.5-3" stroke="white" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="chamby-subject-info">
              <div className="chamby-subject-name">{subjectName}</div>
              <div className="chamby-subject-service">{serviceLabel}</div>
            </div>
            {jobRate > 0 && (
              <div className="chamby-job-tag">${jobRate.toLocaleString("es-MX")} MXN</div>
            )}
          </div>

          {/* Stars */}
          <div className="chamby-stars-section">
            <div className="chamby-stars-label">Tu calificación</div>
            <div className="chamby-stars-row">
              {[1, 2, 3, 4, 5].map((val) => (
                <button
                  key={val}
                  className={`chamby-star ${val <= rating ? "filled" : "empty"} ${bumpedStar === val ? "bump" : ""}`}
                  onClick={() => handleSetRating(val)}
                  type="button"
                >
                  <svg viewBox="0 0 44 44" fill="currentColor">
                    <path d="M22 4l4.5 9 10 1.5-7.2 7 1.7 10L22 27l-9 4.7 1.7-10-7.2-7 10-1.5z" />
                  </svg>
                </button>
              ))}
            </div>
            <div className="chamby-rating-label">
              {rating > 0 ? RATING_LABELS[rating] : "Toca para calificar"}
            </div>
          </div>

          {/* Comment */}
          <div className="chamby-comment-section">
            <div className="chamby-comment-wrap">
              <textarea
                className="chamby-comment-input"
                placeholder="Cuéntanos más sobre tu experiencia (opcional)..."
                maxLength={280}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <span className="chamby-char-count">{comment.length}/280</span>
            </div>
            <div className="chamby-quick-tags">
              {tags.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  className={`chamby-tag ${selectedTags.includes(tag) ? "selected" : ""}`}
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="chamby-actions">
            <button
              className="chamby-submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
              type="button"
            >
              <svg viewBox="0 0 18 18" fill="none">
                <path d="M9 2l1.8 3.6 4 .6-2.9 2.8.7 4L9 11l-3.6 1.9.7-4L3.2 6.2l4-.6z" fill="white" />
              </svg>
              {submitting ? "Enviando..." : "Enviar calificación"}
            </button>
            <button className="chamby-skip-btn" onClick={handleSkip} type="button">
              Ahora no
            </button>
          </div>

          {/* Success overlay */}
          <div className={`chamby-success-overlay ${showSuccess ? "show" : ""}`}>
            <div className="chamby-success-icon">
              <svg viewBox="0 0 36 36" fill="none">
                <path d={checkPath} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="chamby-success-title">¡Gracias!</div>
            <div className="chamby-success-sub">Tu calificación ayuda a mantener la calidad de los servicios en Chamby.</div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

/* ── localStorage helpers ─────────────────────────────── */
const DISMISS_KEY = "chamby_rating_dismissed";

interface DismissedEntry {
  job_id: string;
  role: string;
  dismissed: true;
}

function storeDismissal(jobId: string, role: string) {
  try {
    const existing: DismissedEntry[] = JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]");
    if (!existing.find(e => e.job_id === jobId && e.role === role)) {
      existing.push({ job_id: jobId, role, dismissed: true });
      localStorage.setItem(DISMISS_KEY, JSON.stringify(existing));
    }
  } catch { /* ignore */ }
}

export function isDismissed(jobId: string, role: string): boolean {
  try {
    const existing: DismissedEntry[] = JSON.parse(localStorage.getItem(DISMISS_KEY) || "[]");
    return existing.some(e => e.job_id === jobId && e.role === role);
  } catch {
    return false;
  }
}
