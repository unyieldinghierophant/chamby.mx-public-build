import { useState } from "react";
import {
  AlertDialog, AlertDialogContent,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Info, AlertTriangle } from "lucide-react";
import { PRICING, formatMXN } from "@/utils/pricingConfig";

interface RefundRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean>;
  submitting: boolean;
}

const REFUND_OPTIONS = [
  { id: 'price_high', title: 'El precio es muy alto', sub: 'La cotización supera mi presupuesto', icon: 'plus' },
  { id: 'need_time', title: 'Necesito más tiempo para decidir', sub: 'Quiero comparar opciones primero', icon: 'info' },
  { id: 'no_longer_need', title: 'Ya no necesito el servicio', sub: 'El problema fue resuelto de otra manera', icon: 'x' },
  { id: 'other', title: 'Otro motivo', sub: 'Cuéntanos qué pasó', icon: 'other' },
];

const chambyFeeCents = PRICING.VISIT_FEE.CHAMBY_SHARE_CENTS;
const providerShareCents = PRICING.VISIT_FEE.PROVIDER_SHARE_CENTS;
const totalPaidCents = PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS;
const refundAmountCents = totalPaidCents - chambyFeeCents - providerShareCents;

export function RefundRequestModal({ open, onOpenChange, onConfirm, submitting }: RefundRequestModalProps) {
  const [selectedOption, setSelectedOption] = useState('price_high');
  const [details, setDetails] = useState("");

  const handleConfirm = async () => {
    const option = REFUND_OPTIONS.find(o => o.id === selectedOption);
    const reason = `${option?.title || selectedOption}${details.trim() ? `: ${details.trim()}` : ''}`;
    const success = await onConfirm(reason);
    if (success) { setDetails(""); onOpenChange(false); }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[375px] p-0 rounded-[22px] overflow-hidden font-['DM_Sans',sans-serif] border-0 gap-0">
        {/* Nav */}
        <div className="px-4 pt-3 pb-3 flex items-center gap-3 border-b border-[hsl(40,8%,88%)]">
          <button onClick={() => onOpenChange(false)} className="w-[34px] h-[34px] rounded-full bg-[hsl(40,8%,95%)] flex items-center justify-center hover:bg-[hsl(40,8%,90%)] transition-colors">
            <ArrowLeft className="w-[14px] h-[14px] text-[hsl(0,0%,6%)]" />
          </button>
          <span className="text-[16px] font-semibold text-[hsl(0,0%,6%)]">Rechazar cotización</span>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {/* Options */}
          <div className="px-4 py-4 border-b border-[hsl(40,8%,88%)]">
            <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Motivo del rechazo</div>
            <div className="flex flex-col gap-[10px]">
              {REFUND_OPTIONS.map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt.id)}
                  className={`flex items-center gap-3 p-[14px] border-[1.5px] rounded-[14px] cursor-pointer transition-colors text-left ${
                    selectedOption === opt.id
                      ? 'border-[hsl(0,0%,6%)] bg-[hsl(40,8%,95%)]'
                      : 'border-[hsl(40,8%,88%)] hover:border-[hsl(0,0%,6%)]'
                  }`}
                >
                  <div className="w-[38px] h-[38px] rounded-lg bg-[hsl(40,8%,95%)] flex items-center justify-center flex-shrink-0">
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="hsl(0,0%,40%)" strokeWidth="1.5" strokeLinecap="round">
                      {opt.icon === 'plus' && <><path d="M2.5 9h13"/><path d="M9 2.5v13"/></>}
                      {opt.icon === 'info' && <><circle cx="9" cy="9" r="6.5"/><path d="M9 6v4M9 12v.5"/></>}
                      {opt.icon === 'x' && <><path d="M3 3l12 12"/><path d="M15 3L3 15"/></>}
                      {opt.icon === 'other' && <><circle cx="9" cy="9" r="6.5"/><path d="M9 9l-3-3M9 9l3 3"/></>}
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] font-semibold text-[hsl(0,0%,6%)]">{opt.title}</div>
                    <div className="text-[11px] text-[hsl(0,0%,40%)] mt-0.5">{opt.sub}</div>
                  </div>
                  <div className="w-[18px] h-[18px] rounded-full border-[1.5px] flex items-center justify-center flex-shrink-0 ml-auto" style={{ borderColor: selectedOption === opt.id ? 'hsl(0,0%,6%)' : 'hsl(40,6%,80%)' }}>
                    {selectedOption === opt.id && <div className="w-[10px] h-[10px] rounded-full bg-[hsl(0,0%,6%)]" />}
                  </div>
                </button>
              ))}
            </div>

            <textarea
              placeholder="Detalles adicionales (opcional)..."
              value={details}
              onChange={e => setDetails(e.target.value.slice(0, 500))}
              className="w-full border border-[hsl(40,8%,88%)] rounded-lg p-3 text-[13px] font-['DM_Sans',sans-serif] text-[hsl(0,0%,6%)] bg-[hsl(40,10%,98%)] resize-none h-[88px] outline-none mt-3 focus:border-[hsl(0,0%,6%)] transition-colors"
            />
          </div>

          {/* Money breakdown */}
          <div className="px-4 py-4">
            <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">¿Qué pasa con mi dinero?</div>

            <div className="flex gap-2 items-start bg-[hsl(0,85%,95%)] rounded-lg p-[12px_14px] text-[12px] text-[hsl(0,75%,55%)] font-medium leading-[1.5] mb-[14px]">
              <AlertTriangle className="w-[15px] h-[15px] flex-shrink-0 mt-0.5" />
              <span>Al rechazar, Chamby cobra {formatMXN(chambyFeeCents)} por el diagnóstico realizado. El resto ({formatMXN(refundAmountCents)}) se devuelve a tu tarjeta.</span>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between py-[7px]">
                <span className="text-[13px] text-[hsl(0,0%,40%)]">Cuota pagada</span>
                <span className="text-[13px] font-medium text-[hsl(0,0%,6%)]">{formatMXN(totalPaidCents)}</span>
              </div>
              <div className="flex justify-between py-[7px]">
                <span className="text-[13px] text-[hsl(0,0%,40%)]">Comisión por diagnóstico</span>
                <span className="text-[13px] font-medium text-[hsl(0,75%,55%)]">−{formatMXN(chambyFeeCents)}</span>
              </div>
              <div className="flex justify-between py-[7px]">
                <span className="text-[13px] text-[hsl(0,0%,40%)]">Pago al técnico</span>
                <span className="text-[13px] font-medium text-[hsl(0,75%,55%)]">−{formatMXN(providerShareCents)}</span>
              </div>
              <hr className="border-[hsl(40,8%,88%)] my-[6px]" />
              <div className="flex justify-between py-[7px]">
                <span className="text-[15px] font-semibold text-[hsl(0,0%,6%)]">Reembolso a tu tarjeta</span>
                <span className="text-[17px] font-semibold text-[hsl(155,85%,34%)]">{formatMXN(refundAmountCents)} MXN</span>
              </div>
            </div>

            <div className="flex gap-2 items-start bg-[hsl(42,90%,93%)] rounded-lg p-[10px_12px] mt-3 text-[12px] text-[hsl(38,65%,38%)] font-medium leading-[1.5]">
              <Info className="w-[14px] h-[14px] flex-shrink-0 mt-0.5" />
              <span>El reembolso llega en 3–5 días hábiles según tu banco.</span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="px-4 pt-3 pb-5 border-t border-[hsl(40,8%,88%)]">
          <button
            onClick={handleConfirm}
            disabled={submitting}
            className="w-full bg-[hsl(0,75%,55%)] text-white rounded-full py-4 text-[15px] font-semibold cursor-pointer font-['DM_Sans',sans-serif] hover:opacity-85 transition-opacity disabled:opacity-50"
          >
            {submitting ? "Enviando..." : "Confirmar rechazo"}
          </button>
          <p className="text-center text-[11px] mt-2">
            <button onClick={() => onOpenChange(false)} className="text-[hsl(0,0%,6%)] underline cursor-pointer bg-transparent border-none font-['DM_Sans',sans-serif]">
              Volver y reconsiderar
            </button>
          </p>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}
