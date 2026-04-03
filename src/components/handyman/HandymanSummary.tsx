import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { ArrowLeft, MapPin, Calendar, Clock, Camera, Plus, Lock, RotateCcw } from "lucide-react";
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
    photos: {
      url: string;
      uploaded: boolean;
      uploadStatus?: 'idle' | 'uploading' | 'success' | 'error';
      errorMessage?: string;
    }[];
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
  onAddPhoto?: (files: FileList) => void;
  onRetryPhoto?: (photoIdx: number) => void;
  onNavigateToStep?: (step: number) => void;
  isSubmitting: boolean;
}

const baseCents = PRICING.VISIT_FEE.BASE_AMOUNT_CENTS;
const ivaCents = PRICING.VISIT_FEE.IVA_AMOUNT_CENTS;
const totalCents = PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS;

export const HandymanSummary = ({
  formData, onConfirm, onGoBack, onAddPhoto, onRetryPhoto, onNavigateToStep, isSubmitting
}: Props) => {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // Leaflet static preview map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const lat = formData.serviceLatitude ?? 20.6597;
    const lng = formData.serviceLongitude ?? -103.3496;

    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      touchZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    const pinIcon = L.divIcon({
      html: `<svg width="28" height="36" viewBox="0 0 28 36" fill="none" xmlns="http://www.w3.org/2000/svg">
        <ellipse cx="14" cy="33" rx="6" ry="3" fill="rgba(0,0,0,0.15)"/>
        <path d="M14 0C6.268 0 0 6.268 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.268 21.732 0 14 0z" fill="hsl(0,0%,6%)"/>
        <circle cx="14" cy="13" r="5" fill="white"/>
      </svg>`,
      iconSize: [28, 36],
      iconAnchor: [14, 36],
      className: '',
    });

    L.marker([lat, lng], { icon: pinIcon, interactive: false }).addTo(map);
    mapInstanceRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => { map.remove(); mapInstanceRef.current = null; };
  }, [formData.serviceLatitude, formData.serviceLongitude]);

  const getDateDisplay = () => {
    if (formData.scheduledDate) {
      const d = formData.scheduledDate instanceof Date
        ? formData.scheduledDate
        : new Date(formData.scheduledDate as string);
      return !isNaN(d.getTime())
        ? d.toLocaleDateString("es-MX", { weekday: "short", day: "numeric", month: "short" })
        : "Lo antes posible";
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

  const timeDisplay = getTimeDisplay();
  const categoryLabel = formData.workType ? workTypeLabels[formData.workType] || formData.workType : "Servicio general";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[hsl(40,10%,97%)] font-['DM_Sans',sans-serif]">
      {/* Nav bar */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 flex items-center gap-3 border-b border-[hsl(40,8%,88%)] bg-[hsl(40,10%,98%)]">
        <button
          onClick={onGoBack}
          disabled={isSubmitting}
          className="w-[34px] h-[34px] rounded-full bg-[hsl(40,8%,95%)] flex items-center justify-center hover:bg-[hsl(40,8%,90%)] transition-colors"
        >
          <ArrowLeft className="w-[14px] h-[14px] text-[hsl(0,0%,6%)]" />
        </button>
        <span className="text-[16px] font-semibold text-[hsl(0,0%,6%)]">Confirma tu solicitud</span>
        <span className="ml-auto text-[12px] text-[hsl(40,4%,65%)] font-medium">Paso 4 de 4</span>
      </div>

      {/* Progress bar */}
      <div className="flex-shrink-0 flex gap-[5px] px-4 pt-[10px] pb-[6px]">
        {[0,1,2,3].map(i => (
          <div key={i} className="h-[3px] flex-1 rounded-full bg-[hsl(0,0%,6%)]" />
        ))}
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">
        {/* Map block */}
        <div className="w-full h-[168px] relative overflow-hidden flex-shrink-0">
          <div ref={mapContainerRef} className="w-full h-full" />
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
            {formData.photos.map((photo, i) => {
              const status = photo.uploadStatus ?? (photo.uploaded ? 'success' : 'idle');
              return (
                <div
                  key={i}
                  className="relative w-[68px] h-[68px] rounded-lg bg-[hsl(40,8%,95%)] border border-[hsl(40,8%,88%)] flex-shrink-0 overflow-hidden"
                >
                  <img src={photo.url} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />

                  {/* Uploading overlay */}
                  {status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}

                  {/* Success badge */}
                  {status === 'success' && (
                    <div className="absolute bottom-1 right-1 w-[18px] h-[18px] rounded-full bg-[hsl(155,85%,34%)] flex items-center justify-center shadow-sm">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
                        <path d="M2 5l2 2 4-4" />
                      </svg>
                    </div>
                  )}

                  {/* Error overlay with retry */}
                  {status === 'error' && (
                    <div className="absolute inset-0 bg-black/55 flex flex-col items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={() => onRetryPhoto?.(i)}
                        className="flex flex-col items-center gap-0.5"
                      >
                        <RotateCcw className="w-4 h-4 text-white" />
                        <span className="text-[9px] text-white font-medium leading-none">Reintentar</span>
                      </button>
                    </div>
                  )}

                  {/* Idle (not yet uploaded, no action) */}
                  {status === 'idle' && (
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-white/70" />
                    </div>
                  )}
                </div>
              );
            })}

            {formData.photos.length === 0 && (
              <div className="w-[68px] h-[68px] rounded-lg bg-[hsl(40,8%,95%)] border border-[hsl(40,8%,88%)] flex-shrink-0 flex items-center justify-center">
                <Camera className="w-5 h-5 text-[hsl(40,4%,65%)]" />
              </div>
            )}

            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              disabled={isSubmitting}
              className="w-[68px] h-[68px] rounded-lg border-[1.5px] border-dashed border-[hsl(40,6%,80%)] flex-shrink-0 flex flex-col items-center justify-center gap-1 text-[hsl(40,4%,65%)] hover:border-[hsl(40,4%,65%)] transition-colors disabled:opacity-50"
            >
              <Plus className="w-[18px] h-[18px]" />
              <span className="text-[11px] font-medium">Agregar</span>
            </button>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => { if (e.target.files && onAddPhoto) { onAddPhoto(e.target.files); e.target.value = ''; } }}
            />
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
              {onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep(2)}
                  className="text-[11px] text-[hsl(233,100%,55%)] mt-0.5 font-medium"
                >
                  Cambiar dirección
                </button>
              )}
            </div>
          </div>

          {/* Date */}
          <div className="flex items-start gap-3 py-[11px] border-b border-[hsl(40,8%,88%)]">
            <div className="w-[34px] h-[34px] rounded-lg bg-[hsl(40,8%,95%)] flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-[hsl(0,0%,40%)]" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] text-[hsl(40,4%,65%)] font-medium mb-[3px]">Fecha preferida</div>
              <div className="text-[13px] font-medium text-[hsl(0,0%,6%)]">
                {getDateDisplay()}{timeDisplay ? ` · ${timeDisplay}` : ""}
              </div>
              {onNavigateToStep && (
                <button
                  type="button"
                  onClick={() => onNavigateToStep(4)}
                  className="text-[11px] text-[hsl(233,100%,55%)] mt-0.5 font-medium"
                >
                  Cambiar fecha
                </button>
              )}
            </div>
          </div>

          {/* Duration — display only, no edit */}
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
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Desglose</div>

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
            <div>
              <span className="text-[15px] font-semibold text-[hsl(0,0%,6%)]">Retención</span>
              <p className="text-[11px] text-[hsl(40,4%,65%)] mt-px">Solo se retiene, no se cobra aún</p>
            </div>
            <span className="text-[17px] font-semibold text-[hsl(0,0%,6%)]">{formatMXN(totalCents)} MXN</span>
          </div>

          {/* Escrow chip */}
          <div className="flex items-center gap-[10px] bg-[hsl(40,8%,95%)] rounded-lg p-[10px_12px] mt-3">
            <Lock className="w-[18px] h-[18px] text-[hsl(0,0%,40%)] flex-shrink-0" />
            <div>
              <div className="text-[12px] font-semibold text-[hsl(0,0%,6%)]">Pago protegido en escrow</div>
              <div className="text-[11px] text-[hsl(0,0%,40%)] mt-px">Se libera solo cuando el trabajo se completa satisfactoriamente</div>
            </div>
          </div>
        </div>

        {/* Stripe handoff */}
        <div className="px-4 py-4">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Pago seguro</div>
          <div className="rounded-[14px] border border-[hsl(40,8%,88%)] overflow-hidden">
            <div className="flex items-center gap-3 p-3.5 border-b border-[hsl(40,8%,88%)]">
              {/* Stripe pill */}
              <div className="flex-shrink-0 bg-[#635BFF] rounded-[6px] px-2.5 py-1 flex items-center">
                <span className="text-white font-bold text-[13px] tracking-tight">stripe</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-[hsl(0,0%,6%)]">Pago seguro con Stripe</div>
                <div className="text-[11px] text-[hsl(40,4%,65%)] mt-px">Elige tu método en el siguiente paso</div>
              </div>
              {/* Payment method icons */}
              <div className="flex-shrink-0 flex items-center gap-1">
                {/* Visa */}
                <div className="w-7 h-[18px] rounded-[3px] border border-[hsl(40,8%,88%)] bg-white flex items-center justify-center">
                  <span className="text-[#1A1F71] font-black text-[8px] tracking-tight">VISA</span>
                </div>
                {/* Mastercard */}
                <div className="w-7 h-[18px] rounded-[3px] border border-[hsl(40,8%,88%)] bg-white flex items-center justify-center">
                  <svg width="14" height="9" viewBox="0 0 20 13" fill="none">
                    <circle cx="7" cy="6.5" r="5" fill="#EB001B"/>
                    <circle cx="13" cy="6.5" r="5" fill="#F79E1B"/>
                    <path d="M10 2.5a5 5 0 0 1 0 8 5 5 0 0 1 0-8z" fill="#FF5F00"/>
                  </svg>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-2 px-3.5 py-3 bg-[hsl(40,8%,97%)]">
              <Lock className="w-[13px] h-[13px] text-[hsl(0,0%,50%)] flex-shrink-0 mt-[1px]" />
              <p className="text-[11px] text-[hsl(0,0%,45%)] leading-[1.55]">
                Solo se realizará una <strong className="text-[hsl(0,0%,15%)] font-semibold">retención</strong> en tu tarjeta.
                No se cobra nada hasta que el trabajo esté completado y aprobado.
              </p>
            </div>
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
            <>
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Redirigiendo a Stripe…
            </>
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="9" rx="1.5" stroke="white" strokeWidth="1.5"/>
                <path d="M1 6h12" stroke="white" strokeWidth="1.5"/>
              </svg>
              Continuar a Stripe · {formatMXN(totalCents)} MXN
            </>
          )}
        </button>
        <p className="text-center text-[11px] text-[hsl(40,4%,65%)] mt-2 leading-[1.5]">
          Solo se retendrá el importe — no se cobra hasta completar el trabajo.{" "}
          <span className="text-[hsl(0,0%,6%)] underline cursor-pointer">Términos de Chamby</span>
        </p>
      </div>
    </div>
  );
};
