import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2, Check, Phone, Mail, MapPin, AlertTriangle, RotateCcw } from "lucide-react";
import { ClientQuoteReview } from "@/components/quotes/ClientQuoteReview";
import { QuotePaymentCard } from "@/components/payments/QuotePaymentCard";
import { formatMXN, PRICING } from "@/utils/pricingConfig";
import { SearchingForProvider } from "@/components/client/SearchingForProvider";
import { SomethingWentWrongSheet } from "@/components/client/SomethingWentWrongSheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const SUPPORT_PHONE = "+523312345678";
const ASSIGNMENT_WINDOW_MINUTES = 20;

interface ClientStatusSectionsProps {
  job: {
    id: string;
    status: string;
    provider_id: string | null;
    location?: string | null;
    invoice: any;
    provider?: {
      full_name: string;
      avatar_url: string;
      rating: number;
      total_reviews: number;
    };
  };
  transitioning: boolean;
  onTransition: (newStatus: string) => void;
  onRefresh: () => void;
}

export const ClientStatusSections = ({
  job,
  transitioning,
  onTransition,
  onRefresh,
}: ClientStatusSectionsProps) => {
  const navigate = useNavigate();
  const [problemSheetOpen, setProblemSheetOpen] = useState(false);
  const [noMatchBusy, setNoMatchBusy] = useState<null | "retry" | "cancel">(null);
  const { status, invoice, provider } = job;
  const initials = provider?.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'P';

  const handleNoMatchRetry = async () => {
    setNoMatchBusy("retry");
    const newDeadline = new Date(Date.now() + ASSIGNMENT_WINDOW_MINUTES * 60 * 1000).toISOString();
    const { error } = await supabase.from("jobs").update({
      status: "searching",
      assignment_deadline: newDeadline,
      hold_expires_at: null,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    setNoMatchBusy(null);
    if (error) { toast.error("Error al reintentar"); return; }
    toast.success("¡Búsqueda reiniciada!");
    navigate(`/esperando-proveedor?job_id=${job.id}`);
  };

  const handleNoMatchCancel = async () => {
    setNoMatchBusy("cancel");
    const { data, error: fnErr } = await supabase.functions.invoke("cancel-job", {
      body: { job_id: job.id, cancelled_by: "client" },
    });
    setNoMatchBusy(null);
    if (fnErr || data?.error) {
      toast.error(data?.error || fnErr?.message || "Error al cancelar");
      return;
    }
    toast.success("Solicitud cancelada. Tu cargo será reembolsado.");
    onRefresh();
  };

  /* ====== SEARCHING / PENDING ====== */
  if (status === 'searching' || status === 'pending') {
    return (
      <SearchingForProvider
        job={{ id: job.id, status, location: job.location, provider: job.provider }}
        onTransition={onTransition}
      />
    );
  }

  /* ====== ASSIGNED / CONFIRMED — Provider en camino ====== */
  if (status === 'assigned') {
    return (
      <div className="font-['DM_Sans',sans-serif]">
        {/* Dark hero */}
        <div className="bg-[hsl(0,0%,6%)] px-6 py-8 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mx-auto mb-4 animate-[pop-in_0.4s_cubic-bezier(0.34,1.56,0.64,1)_both]">
            <Check className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-[20px] font-bold text-white mb-1.5">¡Técnico confirmado!</h3>
          <p className="text-[13px] text-white/60">
            {provider?.full_name || 'Tu técnico'} está en camino a tu domicilio
          </p>
          <div className="inline-block bg-white/10 text-white/90 rounded-full px-[14px] py-[5px] text-[12px] font-semibold mt-3 tracking-[0.04em]">
            Job #{job.id.slice(0, 8).toUpperCase()}
          </div>
        </div>

        {/* Map */}
        <div className="w-full h-[140px] relative overflow-hidden">
          <svg width="375" height="140" viewBox="0 0 375 140" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <rect width="375" height="140" fill="#E8EAD8"/>
            <line x1="0" y1="70" x2="375" y2="70" stroke="white" strokeWidth="10"/>
            <line x1="190" y1="0" x2="190" y2="140" stroke="white" strokeWidth="10"/>
            <line x1="100" y1="0" x2="100" y2="140" stroke="white" strokeWidth="5" opacity="0.6"/>
            <rect x="108" y="40" width="74" height="24" rx="3" fill="#CECFBA"/>
            <rect x="196" y="40" width="76" height="24" rx="3" fill="#CECFBA"/>
            <rect x="108" y="76" width="74" height="24" rx="3" fill="#CECFBA"/>
            <circle cx="190" cy="66" r="12" fill="#0F0F0F"/>
            <rect x="185" y="62" width="10" height="7" rx="1" fill="white"/>
            <polygon points="190,59 183,65 197,65" fill="white"/>
            <circle cx="120" cy="38" r="14" fill="#0D9E6A"/>
            <circle cx="120" cy="38" r="7" fill="white"/>
            <circle cx="120" cy="38" r="3.5" fill="#0D9E6A"/>
            <line x1="120" y1="38" x2="190" y2="66" stroke="#0D9E6A" strokeWidth="2" strokeDasharray="5,4" opacity="0.7"/>
            <rect x="10" y="116" width="110" height="18" rx="5" fill="white" opacity="0.9"/>
            <text x="18" y="128.5" fontSize="10" fill="#0F0F0F" fontFamily="system-ui" fontWeight="600">~8 min de distancia</text>
          </svg>
        </div>

        {/* Provider */}
        <div className="px-4 py-4 border-b border-[hsl(40,8%,88%)]">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Tu técnico</div>
          <div className="flex items-center gap-3 bg-[hsl(40,8%,95%)] rounded-[14px] p-3">
            <div className="w-[42px] h-[42px] rounded-full bg-[hsl(155,60%,78%)] flex items-center justify-center text-[14px] font-bold text-[hsl(155,65%,18%)] flex-shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-[hsl(0,0%,6%)]">{provider?.full_name || 'Proveedor'}</div>
              <div className="text-[11px] text-[hsl(0,0%,40%)] mt-0.5">
                <span className="text-[hsl(42,75%,52%)]">★★★★★</span>
                <span> {provider?.rating?.toFixed(1) || 'N/A'} · {provider?.total_reviews || 0} trabajos</span>
              </div>
            </div>
            <div className="bg-[hsl(152,60%,94%)] text-[hsl(155,85%,34%)] rounded-full px-[10px] py-1 text-[11px] font-semibold flex-shrink-0">Verificado</div>
          </div>
          <div className="flex gap-2 mt-[10px]">
            <a
              href={`tel:${SUPPORT_PHONE}`}
              className="flex-1 p-[9px] border border-[hsl(40,8%,88%)] rounded-lg bg-white text-[12px] font-semibold cursor-pointer font-['DM_Sans',sans-serif] flex items-center justify-center gap-1.5 hover:border-[hsl(40,4%,65%)] transition-colors no-underline text-[hsl(0,0%,6%)]"
            >
              <Phone className="w-[14px] h-[14px]" /> Llamar a soporte
            </a>
            <button
              type="button"
              onClick={() => navigate(`/messages?jobId=${job.id}`)}
              className="flex-1 p-[9px] border border-[hsl(40,8%,88%)] rounded-lg bg-white text-[12px] font-semibold cursor-pointer font-['DM_Sans',sans-serif] flex items-center justify-center gap-1.5 hover:border-[hsl(40,4%,65%)] transition-colors"
            >
              <Mail className="w-[14px] h-[14px]" /> Mensaje
            </button>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-4 py-4 border-b border-[hsl(40,8%,88%)]">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Estado del servicio</div>
          
          {[
            { status: 'done', icon: 'check', title: 'Pago en escrow', sub: '$429 MXN retenidos hasta que el trabajo se complete' },
            { status: 'next', icon: 'clock', title: 'Técnico en camino', sub: 'Llega aproximadamente en 8 minutos' },
            { status: 'pending', icon: null, title: 'Diagnóstico y cotización', sub: 'El técnico evaluará y te enviará una cotización' },
            { status: 'pending', icon: null, title: 'Trabajo completado', sub: 'Tu pago de escrow se libera al técnico' },
          ].map((item, i) => (
            <div key={i} className={`flex gap-3 py-3 relative ${item.status === 'pending' ? 'opacity-45' : ''}`}>
              {i < 3 && (
                <div className="absolute left-[15px] top-[42px] w-px bg-[hsl(40,8%,88%)]" style={{ height: 'calc(100% - 10px)' }} />
              )}
              <div className={`w-[30px] h-[30px] rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                item.status === 'done' ? 'bg-[hsl(155,85%,34%)]' : item.status === 'next' ? 'bg-[hsl(0,0%,6%)]' : 'bg-[hsl(40,8%,88%)] border-[1.5px] border-[hsl(40,6%,80%)]'
              }`}>
                {item.icon === 'check' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3"/></svg>}
                {item.icon === 'clock' && <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 1.5"/></svg>}
              </div>
              <div>
                <div className="text-[14px] font-semibold text-[hsl(0,0%,6%)]">{item.title}</div>
                <div className="text-[12px] text-[hsl(0,0%,40%)] mt-0.5 leading-[1.4]">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Payment summary */}
        <div className="px-4 py-4">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Resumen financiero</div>
          <div className="flex justify-between items-center bg-[hsl(152,60%,94%)] rounded-lg p-[12px_14px] mb-2">
            <span className="text-[12px] text-[hsl(155,80%,28%)] font-medium">Pagado en escrow hoy</span>
            <span className="text-[15px] font-bold text-[hsl(155,80%,28%)]">{formatMXN(PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS)} MXN</span>
          </div>
          <p className="text-[11px] text-[hsl(40,4%,65%)] leading-[1.6]">
            Si apruebas la cotización, este monto se reembolsa y pagas solo el trabajo.
          </p>
        </div>

        <style>{`@keyframes pop-in { from { transform: scale(0.6); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
      </div>
    );
  }

  /* ====== ON SITE ====== */
  if (status === 'on_site') {
    return (
      <div className="font-['DM_Sans',sans-serif] px-4 py-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-[30px] h-[30px] rounded-full bg-[hsl(270,60%,50%)] flex items-center justify-center">
            <MapPin className="w-4 h-4 text-white" />
          </div>
          <h3 className="text-[16px] font-semibold text-[hsl(0,0%,6%)]">El proveedor está en tu domicilio</h3>
        </div>
        <p className="text-[13px] text-[hsl(0,0%,40%)] leading-[1.5]">
          Está realizando el diagnóstico. En breve recibirás una cotización.
        </p>
      </div>
    );
  }

  /* ====== QUOTED ====== */
  if (status === 'quoted' && invoice?.status === 'sent') {
    return <ClientQuoteReview jobId={job.id} invoice={invoice} onResponse={onRefresh} />;
  }

  /* ====== QUOTE ACCEPTED ====== */
  if (status === 'quote_accepted' && invoice?.status === 'accepted') {
    return <QuotePaymentCard jobId={job.id} invoice={invoice} />;
  }

  /* ====== IN PROGRESS ====== */
  if (status === 'job_paid' || status === 'in_progress') {
    return (
      <div className="font-['DM_Sans',sans-serif] px-4 py-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-[30px] h-[30px] rounded-full bg-[hsl(30,90%,55%)] flex items-center justify-center">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 1.5"/></svg>
          </div>
          <h3 className="text-[16px] font-semibold text-[hsl(0,0%,6%)]">
            {status === 'in_progress' ? 'El proveedor está trabajando' : 'Trabajo por iniciar'}
          </h3>
        </div>
        <p className="text-[13px] text-[hsl(0,0%,40%)] leading-[1.5]">
          {status === 'in_progress' ? 'El proveedor está realizando el trabajo solicitado.' : 'El pago fue procesado. El proveedor comenzará en breve.'}
        </p>
      </div>
    );
  }

  /* ====== PROVIDER DONE — Client confirms ====== */
  if (status === 'provider_done') {
    return (
      <div className="font-['DM_Sans',sans-serif]">
        <div className="bg-[hsl(0,0%,6%)] px-6 py-8 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-[20px] font-bold text-white mb-1.5">El proveedor terminó</h3>
          <p className="text-[13px] text-white/60">¿Confirmas que el trabajo está completo?</p>
        </div>
        <div className="px-4 py-4">
          <p className="text-[12px] text-[hsl(0,0%,40%)] mb-4 leading-[1.5]">
            Al confirmar, se procesará el reembolso de $429 a tu método de pago y el pago al proveedor.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onTransition('completed')}
              disabled={transitioning}
              className="flex-1 bg-[hsl(155,85%,34%)] text-white rounded-full py-4 text-[15px] font-semibold cursor-pointer font-['DM_Sans',sans-serif] flex items-center justify-center gap-2 hover:opacity-85 transition-opacity disabled:opacity-50"
            >
              {transitioning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
              Confirmar
            </button>
            <button
              type="button"
              onClick={() => setProblemSheetOpen(true)}
              className="flex-1 bg-transparent text-[hsl(0,0%,6%)] border-[1.5px] border-[hsl(40,6%,80%)] rounded-full py-4 text-[15px] font-semibold font-['DM_Sans',sans-serif] flex items-center justify-center gap-2 hover:border-[hsl(0,0%,6%)] transition-colors"
            >
              <AlertTriangle className="w-5 h-5" /> ¿Algo salió mal?
            </button>
          </div>
        </div>
        <SomethingWentWrongSheet
          jobId={job.id}
          open={problemSheetOpen}
          onOpenChange={setProblemSheetOpen}
          onResolved={onRefresh}
        />
      </div>
    );
  }

  /* ====== COMPLETED ====== */
  if (status === 'completed') {
    return (
      <div className="font-['DM_Sans',sans-serif]">
        <div className="bg-[hsl(0,0%,6%)] px-6 py-8 text-center">
          <div className="w-16 h-16 rounded-full border-2 border-white/30 flex items-center justify-center mx-auto mb-4">
            <Check className="w-7 h-7 text-white" />
          </div>
          <h3 className="text-[20px] font-bold text-white mb-1.5">Trabajo completado</h3>
          <p className="text-[13px] text-white/60">Se procesó el reembolso de $429 a tu método de pago original.</p>
        </div>
      </div>
    );
  }

  /* ====== NO MATCH — 2h grace window ====== */
  if (status === 'no_match') {
    return (
      <div className="font-['DM_Sans',sans-serif] px-4 py-6">
        <div className="w-14 h-14 rounded-full bg-[hsl(40,8%,92%)] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-[hsl(40,4%,50%)]" />
        </div>
        <h3 className="text-[17px] font-semibold text-[hsl(0,0%,6%)] text-center mb-1.5">
          No encontramos a nadie
        </h3>
        <p className="text-[13px] text-[hsl(0,0%,40%)] text-center leading-[1.5] mb-5 px-2">
          No encontramos un proveedor disponible. Tienes 2 horas para intentar
          de nuevo sin perder tu lugar.
        </p>
        <div className="flex flex-col gap-2 max-w-md mx-auto">
          <button
            onClick={handleNoMatchRetry}
            disabled={noMatchBusy !== null}
            className="w-full h-[50px] rounded-full bg-[hsl(0,0%,6%)] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:opacity-85 transition-opacity"
          >
            {noMatchBusy === "retry" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
            {noMatchBusy === "retry" ? "Reintentando…" : "Intentar de nuevo"}
          </button>
          <button
            onClick={handleNoMatchCancel}
            disabled={noMatchBusy !== null}
            className="w-full h-[50px] rounded-full border-[1.5px] border-[hsl(40,6%,80%)] text-[hsl(0,0%,6%)] text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-60 hover:border-[hsl(0,0%,6%)] transition-colors"
          >
            {noMatchBusy === "cancel" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {noMatchBusy === "cancel" ? "Cancelando…" : "Cancelar y reembolsar"}
          </button>
        </div>
      </div>
    );
  }

  /* ====== QUOTE REJECTED ====== */
  if (status === 'quote_rejected') {
    return (
      <div className="font-['DM_Sans',sans-serif] px-4 py-6 text-center">
        <div className="w-16 h-16 rounded-full bg-[hsl(0,85%,55%)]/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7 text-[hsl(0,75%,55%)]" />
        </div>
        <h3 className="text-[16px] font-semibold text-[hsl(0,0%,6%)] mb-2">Cotización rechazada</h3>
        <p className="text-[13px] text-[hsl(0,0%,40%)] leading-[1.5]">
          La cuota de diagnóstico ($429) no es reembolsable. El proveedor recibió $250 por su visita.
        </p>
      </div>
    );
  }

  return null;
};
