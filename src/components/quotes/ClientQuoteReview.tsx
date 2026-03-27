import { useState } from "react";
import { Loader2, Clock, Check, Info } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { formatMXN, PRICING } from "@/utils/pricingConfig";
import { toast } from "sonner";

interface ClientQuoteReviewProps {
  jobId: string;
  invoice: {
    id: string;
    status: string;
    subtotal_provider: number;
    chamby_commission_amount: number;
    client_surcharge_amount?: number;
    vat_amount: number;
    total_customer_amount: number;
    provider_payout_amount?: number;
    provider_notes?: string;
    valid_until?: string;
  };
  onResponse: () => void;
}

export const ClientQuoteReview = ({ jobId, invoice, onResponse }: ClientQuoteReviewProps) => {
  const [responding, setResponding] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const handleRespond = async (action: "accept" | "reject") => {
    setResponding(true);
    try {
      const { data, error } = await supabase.functions.invoke("respond-to-quote", {
        body: { job_id: jobId, invoice_id: invoice.id, action, rejection_reason: action === "reject" ? rejectionReason : undefined },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success(action === "accept" ? "Cotización aprobada. El siguiente paso es el pago." : "Cotización rechazada.");
      onResponse();
    } catch (err: any) {
      toast.error(err.message || "Error al responder");
    } finally {
      setResponding(false);
    }
  };

  const providerQuote = invoice.subtotal_provider;
  const surcharge = invoice.client_surcharge_amount ?? providerQuote * 0.10;
  const vat = invoice.vat_amount;
  const total = invoice.total_customer_amount;
  const visitFeePesos = PRICING.VISIT_FEE.BASE_AMOUNT_CENTS / 100;

  // Timer
  const getTimeRemaining = () => {
    if (!invoice.valid_until) return null;
    const diff = new Date(invoice.valid_until).getTime() - Date.now();
    if (diff <= 0) return "Expirada";
    const m = Math.floor(diff / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    return `${m}:${String(s).padStart(2, '0')} min`;
  };
  const timerText = getTimeRemaining();

  return (
    <div className="font-['DM_Sans',sans-serif]">
      {/* Nav */}
      <div className="px-4 pt-3 pb-3 flex items-center gap-3 border-b border-[hsl(40,8%,88%)]">
        <span className="text-[16px] font-semibold text-[hsl(0,0%,6%)]">Cotización recibida</span>
      </div>

      <div className="overflow-y-auto">
        {/* Provider + Amount */}
        <div className="px-4 py-4 border-b border-[hsl(40,8%,88%)]">
          {/* Timer */}
          {timerText && (
            <div className="inline-flex items-center gap-[5px] bg-[hsl(42,90%,93%)] text-[hsl(38,65%,38%)] rounded-full px-3 py-[5px] text-[12px] font-semibold mb-[14px]">
              <Clock className="w-3 h-3" />
              Expira en {timerText}
            </div>
          )}

          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-1">Monto de la cotización</div>
          <div className="text-[36px] font-bold text-[hsl(0,0%,6%)] leading-none my-1">
            ${total.toLocaleString("es-MX", { minimumFractionDigits: 0 })} MXN
          </div>
          <div className="text-[13px] text-[hsl(0,0%,40%)]">Precio total por el trabajo completo</div>

          {/* Breakdown */}
          <div className="bg-[hsl(40,8%,95%)] rounded-[14px] p-[12px_14px] mt-[14px]">
            <div className="flex justify-between text-[12px] py-1 text-[hsl(0,0%,40%)]">
              <span>Cotización del proveedor</span>
              <span>${providerQuote.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[12px] py-1 text-[hsl(0,0%,40%)]">
              <span>Comisión de servicio (10%)</span>
              <span>+${surcharge.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[12px] py-1 text-[hsl(0,0%,40%)]">
              <span>IVA (16%)</span>
              <span>+${vat.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[12px] py-1 text-[hsl(155,85%,34%)]">
              <span>Cuota diagnóstico (se descuenta)</span>
              <span>−${visitFeePesos.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-[13px] font-semibold text-[hsl(0,0%,6%)] border-t border-[hsl(40,8%,88%)] mt-1.5 pt-2">
              <span>Total a pagar</span>
              <span>${total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Provider notes */}
        {invoice.provider_notes && (
          <div className="px-4 py-4 border-b border-[hsl(40,8%,88%)]">
            <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">Nota del técnico</div>
            <div className="bg-[hsl(230,100%,96%)] rounded-lg p-[12px_14px]">
              <div className="text-[11px] font-semibold text-[hsl(233,100%,55%)] mb-1 uppercase tracking-[0.08em]">Observaciones</div>
              <div className="text-[12px] text-[hsl(0,0%,16%)] leading-[1.5]">{invoice.provider_notes}</div>
            </div>
          </div>
        )}

        {/* What happens if accepted */}
        <div className="px-4 py-4">
          <div className="text-[10px] font-semibold tracking-[0.1em] uppercase text-[hsl(40,4%,65%)] mb-3">¿Qué pasa si acepto?</div>
          
          {[
            { bg: 'hsl(152,60%,94%)', stroke: 'hsl(155,85%,34%)', title: 'Pago aprobado en escrow', sub: `Los $${total.toLocaleString("es-MX")} se retienen hasta que confirmes el trabajo` },
            { bg: 'hsl(230,100%,96%)', stroke: 'hsl(233,100%,55%)', title: 'El técnico comienza el trabajo', sub: 'Recibirás actualizaciones en tiempo real' },
            { bg: 'hsl(42,90%,93%)', stroke: 'hsl(42,75%,52%)', title: 'Tú liberas el pago al final', sub: 'El técnico cobra solo cuando confirmas que todo quedó bien' },
          ].map((item, i) => (
            <div key={i} className={`flex items-start gap-3 py-[11px] ${i < 2 ? 'border-b border-[hsl(40,8%,88%)]' : ''}`}>
              <div className="w-[34px] h-[34px] rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                <Check className="w-4 h-4" style={{ color: item.stroke }} />
              </div>
              <div className="flex-1">
                <div className="text-[13px] font-medium text-[hsl(0,0%,6%)]">{item.title}</div>
                <div className="text-[11px] text-[hsl(40,4%,65%)] mt-0.5">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA area */}
      <div className="px-4 pt-3 pb-7 border-t border-[hsl(40,8%,88%)]">
        <div className="flex gap-2 mb-2">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button
                disabled={responding}
                className="flex-1 bg-transparent text-[hsl(0,0%,6%)] border-[1.5px] border-[hsl(40,6%,80%)] rounded-full py-4 text-[15px] font-semibold cursor-pointer font-['DM_Sans',sans-serif] hover:border-[hsl(0,0%,6%)] transition-colors disabled:opacity-50"
              >
                Rechazar
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Rechazar esta cotización?</AlertDialogTitle>
                <AlertDialogDescription>
                  Al rechazar, el proveedor será notificado. El pago de diagnóstico ($429) no se reembolsa.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <div className="py-2">
                <Textarea
                  placeholder="Motivo del rechazo (opcional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value.slice(0, 500))}
                  className="resize-none"
                  rows={3}
                />
              </div>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleRespond("reject")} className="bg-[hsl(0,75%,55%)] hover:bg-[hsl(0,75%,45%)] text-white">
                  Confirmar rechazo
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <button
            onClick={() => handleRespond("accept")}
            disabled={responding}
            className="flex-1 bg-[hsl(155,85%,34%)] text-white rounded-full py-4 text-[15px] font-semibold cursor-pointer font-['DM_Sans',sans-serif] hover:opacity-85 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {responding ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Aceptar cotización
          </button>
        </div>
        <p className="text-center text-[11px] text-[hsl(40,4%,65%)]">
          Al aceptar, los ${total.toLocaleString("es-MX")} MXN se retienen en escrow
        </p>
      </div>
    </div>
  );
};
