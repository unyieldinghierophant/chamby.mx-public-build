import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Search, RefreshCw, CalendarClock, ArrowLeft, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ASSIGNMENT_WINDOW_HOURS = 4;

const EsperandoProveedor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job_id");
  const [verifying, setVerifying] = useState(true);
  const [job, setJob] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0, total: 0 });
  const [isExpired, setIsExpired] = useState(false);

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

    // If provider already accepted, redirect to active jobs
    if (data.status === 'accepted' || data.status === 'confirmed') {
      toast.success("¡Tu proveedor ha sido asignado!");
      navigate("/active-jobs");
      return;
    }

    // If unassigned, show fallback
    if (data.status === 'unassigned') {
      setIsExpired(true);
    }

    // Verify payment
    const hasValidPayment = data.stripe_visit_payment_intent_id ||
      (data.visit_fee_paid && ['searching', 'active', 'unassigned'].includes(data.status));

    if (!hasValidPayment) {
      toast.info("Aún no has completado el pago de visita");
      navigate(`/job/${jobId}/payment`);
      return;
    }

    setJob(data);
    setVerifying(false);
  }, [jobId, navigate]);

  useEffect(() => {
    fetchJob();

    // Real-time subscription for this job
    if (!jobId) return;
    const channel = supabase
      .channel(`job-status-${jobId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs',
        filter: `id=eq.${jobId}`,
      }, (payload) => {
        const newStatus = payload.new?.status;
        if (newStatus === 'accepted' || newStatus === 'confirmed') {
          toast.success("¡Tu proveedor ha sido asignado!");
          navigate("/active-jobs");
        } else if (newStatus === 'unassigned') {
          setIsExpired(true);
          setJob((prev: any) => prev ? { ...prev, status: 'unassigned' } : prev);
        } else {
          setJob(payload.new);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId, fetchJob]);

  // Countdown timer
  useEffect(() => {
    if (!job?.assignment_deadline || isExpired) return;

    const tick = () => {
      const diff = new Date(job.assignment_deadline).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        setIsExpired(true);
        return;
      }
      setTimeLeft({
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
        total: diff,
      });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [job?.assignment_deadline, isExpired]);

  if (verifying) {
    return (
      <div className="min-h-screen bg-background py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/user-landing")} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver al inicio
        </Button>

        <div className="space-y-5">
          {/* Header */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className={`p-4 rounded-full ${isExpired ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                {isExpired ? (
                  <AlertTriangle className="h-14 w-14 text-destructive" />
                ) : (
                  <Search className="h-14 w-14 text-primary animate-pulse" />
                )}
              </div>
            </div>
            <h1 className="text-2xl font-bold mb-1">
              {isExpired ? 'No se encontró proveedor' : 'Buscando proveedor'}
            </h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              {isExpired
                ? 'No encontramos un proveedor disponible en este momento. Puedes reagendar o solicitar reembolso.'
                : 'Estamos notificando a profesionales verificados en tu área. Te avisaremos cuando uno acepte.'}
            </p>
          </div>

          {/* Countdown / Expired Card */}
          {!isExpired ? (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-2 border-primary/20">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <span className="font-medium text-sm">Ventana de asignación</span>
                    </div>
                    <div className="text-2xl font-bold font-mono text-primary">
                      {String(timeLeft.hours).padStart(2, '0')}:
                      {String(timeLeft.minutes).padStart(2, '0')}:
                      {String(timeLeft.seconds).padStart(2, '0')}
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
          ) : (
            <Card className="border-2 border-destructive/30 bg-destructive/5">
              <CardContent className="p-5 space-y-3">
                <p className="text-sm font-medium">La ventana de asignación ha expirado.</p>
                <div className="flex flex-col gap-2">
                  <Button className="w-full" onClick={() => {
                    // TODO: implement reschedule flow
                    toast.info("Función de reagendamiento próximamente disponible");
                  }}>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Reagendar fecha y hora
                  </Button>
                  <Button variant="outline" className="w-full" onClick={() => {
                    // TODO: implement refund request
                    toast.info("Solicitud de reembolso próximamente disponible");
                  }}>
                    Solicitar reembolso
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
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
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center animate-pulse">
                      <Search className="h-5 w-5 text-primary-foreground" />
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

          {/* Job Details */}
          {job && (
            <Card>
              <CardContent className="p-5">
                <h3 className="font-semibold text-sm mb-3">Detalles de tu solicitud</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicio:</span>
                    <span className="font-medium capitalize">{job.category}</span>
                  </div>
                  {job.service_type && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo:</span>
                      <span className="font-medium capitalize">{job.service_type}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ubicación:</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                  {job.scheduled_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Programado:</span>
                      <span className="font-medium">
                        {new Date(job.scheduled_at).toLocaleDateString('es-MX', {
                          weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                      </span>
                    </div>
                  )}
                  {job.urgent && (
                    <div className="text-orange-500 font-medium text-xs">⚡ Solicitud urgente</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Promise / Info */}
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
