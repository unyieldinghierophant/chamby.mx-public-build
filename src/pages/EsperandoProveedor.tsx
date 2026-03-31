import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import { GenericPageSkeleton } from "@/components/skeletons";
import { MessageCircle, RotateCcw, Home } from "lucide-react";

const ASSIGNMENT_WINDOW_HOURS = 1;

const formatTime = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { h, m, s, total: ms };
};

const EsperandoProveedor = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job_id");

  const [verifying, setVerifying] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ h: 0, m: 0, s: 0, total: 0 });
  const [isExpired, setIsExpired] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [retrying, setRetrying] = useState(false);

  /* fetch */
  const fetchJob = useCallback(async () => {
    if (!jobId) { setVerifying(false); return; }
    const { data, error } = await supabase.from("jobs").select("*").eq("id", jobId).single();

    if (error || !data) { toast.error("No se encontró la solicitud"); navigate("/user-landing"); return; }
    if (data.status === "accepted" || data.status === "confirmed" || data.status === "assigned") {
      toast.success("¡Tu proveedor ha sido asignado!"); navigate("/active-jobs"); return;
    }
    if (data.status === "unassigned") setIsExpired(true);
    if (data.status === "cancelled") { toast.info("Esta solicitud fue cancelada"); navigate("/user-landing"); return; }

    const hasValidPayment = data.stripe_visit_payment_intent_id || (data.visit_fee_paid && ["searching", "assigned"].includes(data.status));
    if (!hasValidPayment && data.status !== "unassigned") { toast.info("Aún no has completado el pago de visita"); navigate(`/job/${jobId}/payment`); return; }

    setJob(data); setVerifying(false);
  }, [jobId, navigate]);

  /* realtime */
  useEffect(() => {
    fetchJob();
    if (!jobId) return;
    const channel = supabase.channel(`job-status-${jobId}`)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` }, (payload) => {
        const ns = payload.new?.status;
        if (ns === "accepted" || ns === "confirmed") { toast.success("¡Tu proveedor ha sido asignado!"); navigate("/active-jobs"); }
        else if (ns === "unassigned") { setIsExpired(true); setJob((p: any) => p ? { ...p, status: "unassigned" } : p); }
        else if (ns === "cancelled") { toast.info("Solicitud cancelada"); navigate("/user-landing"); }
        else { setJob(payload.new); }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [jobId, fetchJob]);

  /* countdown */
  useEffect(() => {
    if (!job?.assignment_deadline || isExpired) return;
    const tick = () => {
      const diff = new Date(job.assignment_deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0, total: 0 });
        setIsExpired(true);
        supabase.from("jobs").update({ status: "unassigned" }).eq("id", job.id).then();
        // Trigger no-provider email notification
        supabase.functions.invoke("notify-no-provider", { body: { jobId: job.id } }).catch(console.error);
        return;
      }
      setTimeLeft(formatTime(diff));
    };
    tick(); const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [job?.assignment_deadline, isExpired]);

  /* cancel */
  const handleCancel = async () => {
    if (!job) return;
    setCancelling(true);
    const { error } = await supabase.from("jobs").update({ status: "cancelled", updated_at: new Date().toISOString() }).eq("id", job.id);
    setCancelling(false);
    if (error) toast.error("Error al cancelar");
    else { toast.success("Solicitud cancelada"); navigate("/user-landing"); }
  };

  /* retry — reset job to searching with a new 1-hour deadline */
  const handleRetry = async () => {
    if (!job) return;
    setRetrying(true);
    const newDeadline = new Date(Date.now() + ASSIGNMENT_WINDOW_HOURS * 60 * 60 * 1000).toISOString();
    const { error } = await supabase.from("jobs").update({
      status: "searching",
      assignment_deadline: newDeadline,
      updated_at: new Date().toISOString(),
    }).eq("id", job.id);
    setRetrying(false);
    if (error) {
      toast.error("Error al reintentar");
    } else {
      setIsExpired(false);
      setJob((p: any) => p ? { ...p, status: "searching", assignment_deadline: newDeadline } : p);
      toast.success("¡Búsqueda reiniciada! Buscando proveedores...");
    }
  };

  if (verifying) return <GenericPageSkeleton />;

  return (
    <div className="min-h-screen bg-[hsl(40,10%,97%)] font-['DM_Sans',sans-serif] flex flex-col">
      {/* Nav bar */}
      <div className="flex-shrink-0 px-4 pt-3 pb-3 flex items-center gap-3 border-b border-[hsl(40,8%,88%)] bg-[hsl(40,10%,98%)]">
        <div className="w-[34px] h-[34px]" />
        <span className="text-[16px] font-semibold text-[hsl(0,0%,6%)]">
          Buscando técnico
        </span>
      </div>

      {/* Body — always show searching state */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col items-center justify-center flex-1 px-6 py-8 text-center">
          {/* Pulse ring */}
          <div className="w-[100px] h-[100px] rounded-full border-[3px] border-[hsl(0,0%,6%)] flex items-center justify-center relative mb-8 animate-[pulse-ring_2s_ease-in-out_infinite]">
            <div className="w-16 h-16 rounded-full bg-[hsl(0,0%,6%)] flex items-center justify-center">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 4v2M12 18v2M4 12h2M18 12h2M6.34 6.34l1.42 1.42M18.24 18.24l1.42 1.42M6.34 17.66l1.42-1.42M18.24 9.76l1.42-1.42"/>
              </svg>
            </div>
          </div>

          <h2 className="text-[20px] font-semibold text-[hsl(0,0%,6%)] mb-2">Buscando tu técnico</h2>
          <p className="text-[14px] text-[hsl(0,0%,40%)] leading-[1.6]">
            Estamos encontrando al especialista<br/>más cercano y calificado para ti
          </p>

          {/* Bouncing dots */}
          <div className="flex gap-[6px] justify-center mt-5">
            {[0, 0.2, 0.4].map((delay, i) => (
              <div key={i} className="w-[7px] h-[7px] rounded-full bg-[hsl(40,6%,80%)] animate-[dot-bounce_1.4s_ease-in-out_infinite]" style={{ animationDelay: `${delay}s` }} />
            ))}
          </div>

          {/* Steps */}
          <div className="w-full mt-10 flex flex-col gap-[10px]">
            <div className="flex items-center gap-3 p-[12px_14px] bg-[hsl(40,8%,95%)] rounded-[14px] text-left">
              <div className="w-[30px] h-[30px] rounded-full bg-[hsl(155,85%,34%)] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3"/></svg>
              </div>
              <div>
                <div className="text-[13px] font-medium text-[hsl(0,0%,6%)]">Solicitud creada</div>
                <div className="text-[11px] text-[hsl(40,4%,65%)] mt-px">Job #{jobId?.slice(0, 8).toUpperCase()}</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-[12px_14px] bg-[hsl(40,8%,95%)] rounded-[14px] text-left">
              <div className="w-[30px] h-[30px] rounded-full bg-[hsl(155,85%,34%)] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round"><path d="M2 7l3.5 3.5L12 3"/></svg>
              </div>
              <div>
                <div className="text-[13px] font-medium text-[hsl(0,0%,6%)]">Pago en escrow</div>
                <div className="text-[11px] text-[hsl(40,4%,65%)] mt-px">$429 MXN retenidos con seguridad</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-[12px_14px] bg-[hsl(40,8%,95%)] rounded-[14px] text-left">
              <div className="w-[30px] h-[30px] rounded-full bg-[hsl(0,0%,6%)] flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round"><circle cx="7" cy="7" r="5.5"/><path d="M7 4v3l2 1.5"/></svg>
              </div>
              <div>
                <div className="text-[13px] font-medium text-[hsl(0,0%,6%)]">Notificando técnicos</div>
                <div className="text-[11px] text-[hsl(40,4%,65%)] mt-px">Proveedores en tu zona</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-[12px_14px] bg-[hsl(40,8%,95%)] rounded-[14px] text-left opacity-45">
              <div className="w-[30px] h-[30px] rounded-full bg-[hsl(40,8%,88%)] flex-shrink-0" />
              <div>
                <div className="text-[13px] font-medium text-[hsl(0,0%,6%)]">Técnico en camino</div>
                <div className="text-[11px] text-[hsl(40,4%,65%)] mt-px">Recibirás una notificación</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA — Cancel button (only when not expired) */}
      {!isExpired && (
        <div className="flex-shrink-0 px-4 pt-3 pb-7 border-t border-[hsl(40,8%,88%)] bg-[hsl(40,10%,98%)]">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="w-full bg-transparent text-[hsl(0,0%,6%)] border-[1.5px] border-[hsl(40,6%,80%)] rounded-full py-4 text-[15px] font-semibold cursor-pointer font-['DM_Sans',sans-serif] hover:border-[hsl(0,0%,6%)] transition-colors">
                Cancelar solicitud
              </button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cancelar solicitud?</AlertDialogTitle>
                <AlertDialogDescription>Si cancelas, se aplicará la política de reembolso. Esta acción no se puede deshacer.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Volver</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancel} disabled={cancelling} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  {cancelling ? "Cancelando..." : "Sí, cancelar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Non-dismissible modal when no provider found */}
      <Dialog open={isExpired} onOpenChange={() => {}}>
        <DialogContent
          className="sm:max-w-md rounded-2xl font-['DM_Sans',sans-serif] [&>button]:hidden"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
          onInteractOutside={(e) => e.preventDefault()}
        >
          <DialogHeader className="text-center items-center pt-2">
            <div className="w-16 h-16 rounded-full bg-[hsl(0,75%,55%)] flex items-center justify-center mb-3 mx-auto">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
                <path d="M8 8l12 12M20 8L8 20"/>
              </svg>
            </div>
            <DialogTitle className="text-[18px] font-semibold text-[hsl(0,0%,6%)]">
              No encontramos a nadie disponible
            </DialogTitle>
            <DialogDescription className="text-[14px] text-[hsl(0,0%,40%)] leading-[1.6] mt-1">
              Ningún Chambynauta tomó tu trabajo en este momento. Puedes intentarlo de nuevo o contactarnos directamente.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="w-full flex items-center justify-center gap-2 bg-[hsl(0,0%,6%)] text-white rounded-full py-3.5 text-[15px] font-semibold cursor-pointer hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <RotateCcw className="w-4 h-4" />
              {retrying ? "Reintentando..." : "Intentar de nuevo"}
            </button>

            <button
              onClick={() => window.open("https://wa.me/523325520551", "_blank")}
              className="w-full flex items-center justify-center gap-2 bg-[hsl(145,70%,40%)] text-white rounded-full py-3.5 text-[15px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
            >
              <MessageCircle className="w-4 h-4" />
              Contactar por WhatsApp
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full flex items-center justify-center gap-2 bg-transparent text-[hsl(0,0%,6%)] border-[1.5px] border-[hsl(40,6%,80%)] rounded-full py-3.5 text-[15px] font-semibold cursor-pointer hover:border-[hsl(0,0%,6%)] transition-colors"
            >
              <Home className="w-4 h-4" />
              Volver al inicio
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Keyframe animations */}
      <style>{`
        @keyframes pulse-ring {
          0%, 100% { box-shadow: 0 0 0 0 rgba(15,15,15,0.15); }
          50% { box-shadow: 0 0 0 18px rgba(15,15,15,0); }
        }
        @keyframes dot-bounce {
          0%, 80%, 100% { transform: translateY(0); background: hsl(40,6%,80%); }
          40% { transform: translateY(-8px); background: hsl(0,0%,6%); }
        }
      `}</style>
    </div>
  );
};

export default EsperandoProveedor;
