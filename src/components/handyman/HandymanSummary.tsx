import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, MapPin, Calendar, Clock, Camera, Plus, ChevronRight, Lock, Info } from "lucide-react";
import { PRICING, formatMXN } from "@/utils/pricingConfig";

const workTypeLabels: Record<string, string> = {
  reparacion: "Reparación", instalacion: "Instalación", armado: "Armado", ajuste: "Ajuste / Mantenimiento"
};
const jobSizeLabels: Record<string, string> = {
  small: "Pequeño · ≤ 1 hora", medium: "Mediano · 1–3 horas", large: "Grande · 3+ horas"
};

interface Props {
  formData: {
    description: string;
    workType: string | null;
    jobSize: string | null;
    materialsProvider: string | null;
    toolsAvailable: string | null;
    importantDetails: string[];
    photos: { url: string; uploaded: boolean }[];
    accessTypes: string[];
    additionalNotes: string;
    serviceAddress?: string;
    serviceLatitude?: number | null;
    serviceLongitude?: number | null;
    scheduleMode?: string | null;
    scheduledDate?: Date | string | null;
    timeWindow?: string | null;
  };
  onConfirm: () => void;
  onGoBack: () => void;
  isSubmitting: boolean;
}

const baseCents = PRICING.VISIT_FEE.BASE_AMOUNT_CENTS;
const ivaCents = PRICING.VISIT_FEE.IVA_AMOUNT_CENTS;
const totalCents = PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS;

export const HandymanSummary = ({ formData, onConfirm, onGoBack, isSubmitting }: Props) => {
  const [countdown, setCountdown] = useState(15);
  const hasSubmittedRef = useRef(false);

  useEffect(() => {
    if (isSubmitting || hasSubmittedRef.current) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); hasSubmittedRef.current = true; onConfirm(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const getDateDisplay = () => {
    if (formData.scheduledDate) {
      const d = formData.scheduledDate instanceof Date ? formData.scheduledDate : new Date(formData.scheduledDate as string);
      return !isNaN(d.getTime()) ? d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" }) : "Lo antes posible";
    }
    if (formData.scheduleMode === 'asap') return "Lo antes posible";
    if (formData.scheduleMode === 'today') return "Hoy";
    return "Lo antes posible";
  };

  const getTimeDisplay = () => {
    const map: Record<string, string> = {
      morning: "Mañana (8–12)", midday: "Mediodía (12–15)", afternoon: "Tarde (15–19)", night: "Noche (19–21)"
    };
    return formData.timeWindow ? map[formData.timeWindow] || formData.timeWindow : null;
  };

  const uploadedPhotos = formData.photos.filter(p => p.uploaded);
  const categoryLabel = formData.workType ? workTypeLabels[formData.workType] || formData.workType : "Servicio general";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(40,10%,97%)] font-['DM_Sans',sans-serif]">
      {/* Nav bar */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 flex items-center gap-3 border-b border-[hsl(40,8%,88%)] bg-[hsl(40,10%,98%)]">
        <button onClick={onGoBack} disabled={isSubmitting} className="w-[34px] h-[34px] rounded-full bg-[hsl(40,8%,95%)] flex items-center justify-center hover:bg-[hsl(40,8%,90%)] transition-colors">
          <ArrowLeft className="w-[14px] h-[14px] text-[hsl(0,0%,6%)]" />
        </button>
        <span className="text-[16px] font-semibold text-[hsl(0,0%,6%)]">Confirma tu solicitud</span>
        <span className="ml-auto text-[12px] text-[hsl(40,4%,65%)] font-medium">Paso 4 de 4</span>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 flex gap-[5px] px-4 pt-[10px] pb-[6px]">
        <div className="h-[3px] flex-1 rounded-full bg-[hsl(155,85%,34%)]" />
        <div className="h-[3px] flex-1 rounded-full bg-[hsl(155,85%,34%)]" />
        <div className="h-[3px] flex-1 rounded-full bg-[hsl(155,85%,34%)]" />
        <div className="h-[3px] flex-1 rounded-full bg-[hsl(0,0%,6%)]" />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Map block */}
        <div className="w-full h-[168px] relative overflow-hidden flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 375 168" xmlns="http://www.w3.org/2000/svg">
            <rect width="375" height="168" fill="#E8EAD8"/>
            <rect x="0" y="0" width="375" height="168" fill="#DFE1CE"/>
            <line x1="0" y1="84" x2="375" y2="84" stroke="white" strokeWidth="10"/>
            <line x1="0" y1="44" x2="375" y2="44" stroke="white" strokeWidth="6" opacity="0.7"/>
            <line x1="0" y1="128" x2="375" y2="128" stroke="white" strokeWidth="6" opacity="0.7"/>
            <line x1="100" y1="0" x2="100" y2="168" stroke="white" strokeWidth="6" opacity="0.7"/>
            <line x1="190" y1="0" x2="190" y2="168" stroke="white" strokeWidth="10"/>
            <line x1="280" y1="0" x2="280" y2="168" stroke="white" strokeWidth="6" opacity="0.7"/>
            <rect x="56" y="50" width="36" height="28" rx="4" fill="#CECFBA"/>
            <rect x="56" y="90" width="36" height="32" rx="4" fill="#CECFBA"/>
            <rect x="108" y="50" width="74" height="28" rx="4" fill="#CECFBA"/>
            <rect x="108" y="90" width="74" height="32" rx="4" fill="#CECFBA"/>
            <rect x="196" y="50" width="76" height="28" rx="4" fill="#CECFBA"/>
            <rect x="196" y="90" width="76" height="32" rx="4" fill="#CECFBA"/>
            <rect x="286" y="50" width="36" height="28" rx="4" fill="#CECFBA"/>
            <rect x="286" y="90" width="36" height="32" rx="4" fill="#CECFBA"/>
            <circle cx="190" cy="80" r="18" fill="#0F0F0F" opacity="0.12"/>
            <circle cx="190" cy="76" r="14" fill="#0F0F0F"/>
            <circle cx="190" cy="76" r="6" fill="white"/>
            <polygon points="190,94 185,86 195,86" fill="#0F0F0F"/>
          </svg>
        </div>

        {/* Service */}
        <div className="px-4 py-4 border-b border-[hsl(40,8%,88%)]">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Servicio</div>
          <div className="flex items-center gap-3">
            <div className="w-[46px] h-[46px] rounded-lg bg-[hsl(230,100%,96%)] flex items-center justify-center flex-shrink-0">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="hsl(233,100%,55%)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[16px] font-semibold text-[hsl(0,0%,6%)]">{formData.description || categoryLabel}</div>
              <div className="text-[12px] text-[hsl(0,0%,40%)] mt-0.5">{categoryLabel} · {jobSizeLabels[formData.jobSize || ''] || '1–3 horas'}</div>
            </div>
          </div>
        </div>

        {/* Photos */}
        <div className="px-4 py-4 border-b border-[hsl(40,8%,88%)]">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Fotos del problema</div>
          <div className="flex gap-2 overflow-x-auto pb-0.5">
            {uploadedPhotos.map((photo, i) => (
              <div key={i} className="w-[68px] h-[68px] rounded-lg bg-[hsl(40,8%,95%)] border border-[hsl(40,8%,88%)] flex-shrink-0 overflow-hidden">
                <img src={photo.url} alt={`Foto ${i+1}`} className="w-full h-full object-cover" />
              </div>
            ))}
            {uploadedPhotos.length === 0 && (
              <div className="w-[68px] h-[68px] rounded-lg bg-[hsl(40,8%,95%)] border border-[hsl(40,8%,88%)] flex-shrink-0 flex items-center justify-center">
                <Camera className="w-5 h-5 text-[hsl(40,4%,65%)]" />
              </div>
            )}
            <div className="w-[68px] h-[68px] rounded-lg border-[1.5px] border-dashed border-[hsl(40,6%,80%)] flex-shrink-0 flex flex-col items-center justify-center gap-1 text-[hsl(40,4%,65%)] cursor-pointer hover:border-[hsl(40,4%,65%)] transition-colors">
              <Plus className="w-[18px] h-[18px]" />
              <span className="text-[11px] font-medium">Agregar</span>
            </div>
          </div>
          <p className="text-[11px] text-[hsl(40,4%,65%)] mt-2">Ayuda al técnico a llegar preparado</p>
        </div>

        {/* Visit details */}
        <div className="px-4 py-4 border-b border-[hsl(40,8%,88%)]">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Detalles de la visita</div>

          {/* Location */}
          <div className="flex items-start gap-3 py-[11px] border-b border-[hsl(40,8%,88%)]">
            <div className="w-[34px] h-[34px] rounded-lg bg-[hsl(40,8%,95%)] flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-[hsl(0,0%,40%)]" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-[hsl(40,4%,65%)] font-medium mb-[3px]">Ubicación</div>
              <div className="text-[13px] font-medium text-[hsl(0,0%,6%)] leading-[1.4]">{formData.serviceAddress || "Sin dirección"}</div>
              <div className="text-[11px] text-[hsl(233,100%,55%)] mt-0.5 font-medium cursor-pointer">Cambiar dirección</div>
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3 py-[11px] border-b border-[hsl(40,8%,88%)]">
            <div className="w-[34px] h-[34px] rounded-lg bg-[hsl(40,8%,95%)] flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[hsl(0,0%,40%)]" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-[hsl(40,4%,65%)] font-medium mb-[3px]">Fecha preferida</div>
              <div className="text-[13px] font-medium text-[hsl(0,0%,6%)]">{getDateDisplay()}</div>
              <div className="text-[11px] text-[hsl(233,100%,55%)] mt-0.5 font-medium cursor-pointer">Cambiar fecha</div>
            </div>
          </div>

          {/* Duration */}
          <div className="flex items-start gap-3 py-[11px]">
            <div className="w-[34px] h-[34px] rounded-lg bg-[hsl(40,8%,95%)] flex items-center justify-center flex-shrink-0">
              <Clock className="w-4 h-4 text-[hsl(0,0%,40%)]" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-[hsl(40,4%,65%)] font-medium mb-[3px]">Duración estimada</div>
              <div className="text-[13px] font-medium text-[hsl(0,0%,6%)]">{jobSizeLabels[formData.jobSize || ''] || 'Mediano · 1–3 horas'}</div>
            </div>
          </div>
        </div>

        {/* Cost breakdown */}
        <div className="px-4 py-4 border-b border-[hsl(40,8%,88%)]">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Desglose de pago</div>
          
          <div className="flex justify-between py-[7px]">
            <span className="text-[13px] text-[hsl(0,0%,40%)]">Cuota diagnóstico</span>
            <span className="text-[13px] font-medium text-[hsl(0,0%,6%)]">{formatMXN(baseCents)}</span>
          </div>
          <div className="flex justify-between py-[7px]">
            <span className="text-[13px] text-[hsl(0,0%,40%)]">IVA (16%)</span>
            <span className="text-[13px] font-medium text-[hsl(0,0%,6%)]">{formatMXN(ivaCents)}</span>
          </div>
          <hr className="border-[hsl(40,8%,88%)] my-[6px]" />
          <div className="flex justify-between items-center py-[8px]">
            <span className="text-[15px] font-semibold text-[hsl(0,0%,6%)]">Total hoy</span>
            <span className="text-[17px] font-semibold text-[hsl(0,0%,6%)]">{formatMXN(totalCents)} MXN</span>
          </div>

          {/* Info chip */}
          <div className="flex gap-2 items-start bg-[hsl(152,60%,94%)] rounded-lg p-[10px_12px] mt-3 text-[12px] text-[hsl(155,80%,28%)] font-medium leading-[1.5]">
            <Info className="w-[14px] h-[14px] flex-shrink-0 mt-0.5" />
            <span>Esta cuota se <strong>reembolsa</strong> si el trabajo se completa. Solo pagas la cotización aprobada.</span>
          </div>

          {/* Escrow chip */}
          <div className="flex items-center gap-[10px] bg-[hsl(40,8%,95%)] rounded-lg p-[10px_12px] mt-[10px]">
            <Lock className="w-[18px] h-[18px] text-[hsl(0,0%,40%)]" />
            <div>
              <div className="text-[12px] font-semibold text-[hsl(0,0%,6%)]">Pago retenido en escrow</div>
              <div className="text-[11px] text-[hsl(0,0%,40%)] mt-px">Se libera solo al completar el trabajo</div>
            </div>
          </div>
        </div>

        {/* Payment method */}
        <div className="px-4 py-4">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Método de pago</div>
          <div className="flex items-center gap-[10px] p-3 border border-[hsl(40,8%,88%)] rounded-[14px] cursor-pointer hover:border-[hsl(40,4%,65%)] transition-colors">
            <div className="w-8 h-[22px] rounded-[5px] bg-[hsl(0,0%,6%)] flex items-center justify-center flex-shrink-0">
              <svg width="20" height="13" viewBox="0 0 20 13" fill="none">
                <circle cx="7" cy="6.5" r="5" fill="#EB001B"/>
                <circle cx="13" cy="6.5" r="5" fill="#F79E1B"/>
                <path d="M10 2.5a5 5 0 0 1 0 8 5 5 0 0 1 0-8z" fill="#FF5F00"/>
              </svg>
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[hsl(0,0%,6%)]">Tarjeta / Apple Pay</div>
              <div className="text-[11px] text-[hsl(40,4%,65%)]">Se abrirá Stripe Checkout</div>
            </div>
            <ChevronRight className="w-[14px] h-[14px] ml-auto text-[hsl(40,6%,80%)]" />
          </div>
        </div>
      </div>

      {/* CTA area */}
      <div className="flex-shrink-0 px-4 pt-3 pb-7 border-t border-[hsl(40,8%,88%)] bg-[hsl(40,10%,98%)]">
        <button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full bg-[hsl(0,0%,6%)] text-white border-none rounded-full py-4 text-[15px] font-semibold cursor-pointer flex items-center justify-center gap-2 font-['DM_Sans',sans-serif] hover:opacity-85 transition-opacity disabled:opacity-50"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Procesando...
            </span>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 8l4 4 8-8"/></svg>
              Confirmar y pagar {formatMXN(totalCents)} MXN
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-[hsl(40,4%,65%)] mt-2">
          Al confirmar aceptas los <span className="text-[hsl(0,0%,6%)] underline cursor-pointer">términos de Chamby</span>
        </p>
      </div>
    </div>
  );
};
