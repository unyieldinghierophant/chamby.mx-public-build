import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  CheckCircle2, Clock, Search, CalendarClock, ArrowLeft, AlertTriangle,
  MapPin, Camera, Zap, Pencil, X, Home, Mail, ChevronDown, ChevronUp
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog";

const ASSIGNMENT_WINDOW_HOURS = 4;

/* ---------- helpers ---------- */
const formatTime = (ms: number) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { h, m, s, total: ms };
};

const formatSchedule = (iso: string | null) => {
  if (!iso) return "No proporcionado";
  return new Date(iso).toLocaleDateString("es-MX", {
    weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit",
  });
};

/** Parse structured description into key/value lines for display */
const parseDescription = (raw: string | null): { label: string; value: string }[] => {
  if (!raw) return [];
  const lines = raw.split("\n").filter(Boolean);
  const parsed: { label: string; value: string }[] = [];
  for (const line of lines) {
    const clean = line.replace(/^[•\-\s]+/, "").trim();
    if (!clean) continue;
    // Lines with colon separator
    const colonIdx = clean.indexOf(":");
    if (colonIdx > 0 && colonIdx < 40) {
      parsed.push({
        label: clean.slice(0, colonIdx).replace(/^[⚡📍🔥🏠🔌🧱📦🔑📅⏰📝⚠️\s]+/, "").trim(),
        value: clean.slice(colonIdx + 1).trim(),
      });
    }
  }
  return parsed;
};

/* ========== COMPONENT ========== */
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
  const [emailNotify, setEmailNotify] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Prevent scroll-jump: anchor scroll position
  const scrollRef = useRef<HTMLDivElement>(null);

  /* ---------- fetch ---------- */
  const fetchJob = useCallback(async () => {
    if (!jobId) return;
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    if (error || !data) {
      toast.error("No se encontró la solicitud");
      navigate("/user-landing");
      return;
    }

    if (data.status === "accepted" || data.status === "confirmed") {
      toast.success("¡Tu proveedor ha sido asignado!");
      navigate("/active-jobs");
      return;
    }

    if (data.status === "unassigned") setIsExpired(true);
    if (data.status === "cancelled") {
      toast.info("Esta solicitud fue cancelada");
      navigate("/user-landing");
      return;
    }

    // Verify payment
    const hasValidPayment = data.stripe_visit_payment_intent_id ||
      (data.visit_fee_paid && ["searching", "active", "unassigned"].includes(data.status));

    if (!hasValidPayment) {
      toast.info("Aún no has completado el pago de visita");
      navigate(`/job/${jobId}/payment`);
      return;
    }

    setJob(data);
    setVerifying(false);
  }, [jobId, navigate]);

  /* ---------- realtime ---------- */
  useEffect(() => {
    fetchJob();
    if (!jobId) return;

    const channel = supabase
      .channel(`job-status-${jobId}`)
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}`,
      }, (payload) => {
        const ns = payload.new?.status;
        if (ns === "accepted" || ns === "confirmed") {
          toast.success("¡Tu proveedor ha sido asignado!");
          navigate("/active-jobs");
        } else if (ns === "unassigned") {
          setIsExpired(true);
          setJob((p: any) => p ? { ...p, status: "unassigned" } : p);
        } else if (ns === "cancelled") {
          toast.info("Solicitud cancelada");
          navigate("/user-landing");
        } else {
          setJob(payload.new);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId, fetchJob]);

  /* ---------- countdown ---------- */
  useEffect(() => {
    if (!job?.assignment_deadline || isExpired) return;
    const tick = () => {
      const diff = new Date(job.assignment_deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ h: 0, m: 0, s: 0, total: 0 });
        setIsExpired(true);
        // Transition to unassigned
        supabase.from("jobs").update({ status: "unassigned" }).eq("id", job.id).then();
        return;
      }
      setTimeLeft(formatTime(diff));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [job?.assignment_deadline, isExpired]);

  /* ---------- cancel ---------- */
  const handleCancel = async () => {
    if (!job) return;
    setCancelling(true);
    const { error } = await supabase
      .from("jobs")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("id", job.id);
    setCancelling(false);
    if (error) {
      toast.error("Error al cancelar");
    } else {
      toast.success("Solicitud cancelada");
      navigate("/user-landing");
    }
  };

  /* ---------- email toggle ---------- */
  const handleEmailToggle = (checked: boolean) => {
    setEmailNotify(checked);
    if (checked && user?.email) {
      // Save preference in localStorage for simplicity
      localStorage.setItem(`chamby_notify_email_${jobId}`, "true");
      toast.success("Te avisaremos por email cuando se asigne un proveedor");
    } else {
      localStorage.removeItem(`chamby_notify_email_${jobId}`);
    }
  };

  useEffect(() => {
    if (jobId) {
      setEmailNotify(localStorage.getItem(`chamby_notify_email_${jobId}`) === "true");
    }
  }, [jobId]);

  /* ---------- edit ---------- */
  const handleEdit = () => {
    if (!job) return;
    const cat = job.category?.toLowerCase();
    // Map category to specialized flow path
    const categoryMap: Record<string, string> = {
      electricidad: "electricidad",
      plomería: "plomeria",
      plomeria: "plomeria",
      limpieza: "limpieza",
      jardinería: "jardineria",
      jardineria: "jardineria",
      handyman: "handyman",
      "auto & lavado": "auto-lavado",
    };
    const flowCategory = categoryMap[cat] || cat;
    navigate(`/book-job?category=${encodeURIComponent(flowCategory)}&edit_job=${job.id}`);
  };

  /* ---------- derived data ---------- */
  const detailRows = job ? parseDescription(job.description || job.problem) : [];
  const photos: string[] = job?.photos?.filter(Boolean) || [];
  const canEdit = job && ["searching", "active", "unassigned"].includes(job.status) && !job.provider_id;

  /* ---------- loading ---------- */
  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando pago...</p>
        </div>
      </div>
    );
  }

  /* ---------- render ---------- */
  return (
    <div ref={scrollRef} className="min-h-screen bg-background overflow-y-auto overscroll-none">
      <div className="container mx-auto px-4 max-w-2xl py-6 pb-32">
        {/* Back */}
        <Button variant="ghost" size="sm" onClick={() => navigate("/user-landing")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Button>

        <div className="space-y-5">
          {/* ===== A) Search animation header ===== */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              {isExpired ? (
                <div className="p-4 rounded-full bg-destructive/10">
                  <AlertTriangle className="h-14 w-14 text-destructive" />
                </div>
              ) : (
                <div className="relative w-28 h-28 flex items-center justify-center">
                  {/* Ripple rings */}
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/30"
                    animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/20"
                    animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-primary/10"
                    animate={{ scale: [1, 2], opacity: [0.3, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 1.2 }}
                  />
                  {/* Center icon */}
                  <motion.div
                    className="relative z-10 p-4 rounded-full bg-primary/10"
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Search className="h-10 w-10 text-primary" />
                  </motion.div>
                </div>
              )}
            </div>

            <h1 className="text-2xl font-bold mb-1">
              {isExpired ? "No se encontró proveedor" : "Buscando proveedor"}
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {isExpired
                ? "No encontramos un proveedor disponible. Puedes reagendar, editar o solicitar reembolso."
                : `Te confirmaremos en un máximo de ${timeLeft.h > 0 ? `${timeLeft.h}h ${timeLeft.m}m` : `${timeLeft.m} minutos`}`}
            </p>
          </div>

          {/* ===== G) Countdown timer ===== */}
          {!isExpired && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-2 border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-medium text-sm">Ventana de asignación</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-primary">
                      {String(timeLeft.h).padStart(2, "0")}:
                      {String(timeLeft.m).padStart(2, "0")}:
                      {String(timeLeft.s).padStart(2, "0")}
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      style={{
                        width: `${Math.max(0, (timeLeft.total / (ASSIGNMENT_WINDOW_HOURS * 3600000)) * 100)}%`,
                      }}
                      transition={{ duration: 1 }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Si no se asigna proveedor en este tiempo, podrás reagendar o solicitar reembolso.
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Expired options */}
          {isExpired && (
            <Card className="border-2 border-destructive/30 bg-destructive/5">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-medium">La ventana de asignación ha expirado.</p>
                <div className="flex flex-col gap-2">
                  <Button className="w-full" onClick={() => toast.info("Reagendamiento próximamente disponible")}>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Reagendar fecha y hora
                  </Button>
                  {canEdit && (
                    <Button variant="outline" className="w-full" onClick={handleEdit}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Editar solicitud
                    </Button>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => toast.info("Solicitud de reembolso próximamente disponible")}>
                    Solicitar reembolso
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline (searching) */}
          {!isExpired && (
            <Card>
              <CardContent className="p-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Pago confirmado</p>
                      <p className="text-xs text-muted-foreground">Tu visita técnica está garantizada</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center">
                      <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                        <Search className="h-5 w-5 text-primary-foreground" />
                      </motion.div>
                    </div>
                    <div>
                      <p className="font-medium text-sm">Buscando Chambynautas</p>
                      <p className="text-xs text-muted-foreground">Notificando profesionales verificados</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-muted-foreground">Proveedor asignado</p>
                      <p className="text-xs text-muted-foreground">Te notificaremos cuando alguien acepte</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ===== B) Job summary ===== */}
          {job && (
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-sm">Detalles de tu solicitud</h3>
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Visita pagada
                  </Badge>
                </div>

                {/* Core fields */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Categoría</span>
                    <span className="font-medium capitalize">{job.category}</span>
                  </div>
                  {job.service_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo</span>
                      <span className="font-medium capitalize">{job.service_type?.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> Ubicación</span>
                    <span className="font-medium text-right max-w-[60%] truncate">
                      {job.location || "No proporcionado"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Fecha/hora</span>
                    <span className="font-medium">{formatSchedule(job.scheduled_at)}</span>
                  </div>
                  {job.urgent && (
                    <div className="flex items-center gap-1 text-orange-500 font-medium text-xs">
                      <Zap className="w-3.5 h-3.5" /> Solicitud urgente
                    </div>
                  )}
                </div>

                {/* Structured detail rows from flow */}
                {detailRows.length > 0 && (
                  <>
                    <button
                      onClick={() => setShowFullDetails(!showFullDetails)}
                      className="mt-3 flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                    >
                      {showFullDetails ? "Ocultar detalles" : "Ver detalles completos"}
                      {showFullDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                    <AnimatePresence>
                      {showFullDetails && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-2 space-y-1.5 text-xs bg-muted/50 rounded-lg p-3">
                            {detailRows.map((row, i) => (
                              <div key={i} className="flex justify-between gap-2">
                                <span className="text-muted-foreground whitespace-nowrap">{row.label}</span>
                                <span className="font-medium text-right">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Fotos ({photos.length})
                    </p>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                      {photos.map((url, i) => (
                        <img
                          key={i}
                          src={url}
                          alt={`Foto ${i + 1}`}
                          className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-border"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ===== C) Edit + D) Cancel actions ===== */}
          {!isExpired && canEdit && (
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={handleEdit}>
                <Pencil className="mr-2 h-4 w-4" />
                Editar solicitud
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="flex-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar solicitud?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Si cancelas, se aplicará la política de reembolso/visita. Esta acción no se puede deshacer.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      disabled={cancelling}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {cancelling ? "Cancelando..." : "Sí, cancelar"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* ===== F) Email notification toggle ===== */}
          {!isExpired && (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm">Avisarme por email al asignarse</span>
              </div>
              <Switch checked={emailNotify} onCheckedChange={handleEmailToggle} />
            </div>
          )}

          {/* ===== E) Go home ===== */}
          <Button variant="ghost" className="w-full" onClick={() => navigate("/user-landing")}>
            <Home className="mr-2 h-4 w-4" />
            Volver al inicio
          </Button>

          {/* Bottom info */}
          <div className="p-4 bg-muted/50 rounded-lg border border-border text-center">
            <p className="text-xs text-muted-foreground">
              Tu pago asegura el intento de asignación con un profesional verificado.
              Si no se encuentra proveedor, podrás reagendar o solicitar reembolso.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsperandoProveedor;
