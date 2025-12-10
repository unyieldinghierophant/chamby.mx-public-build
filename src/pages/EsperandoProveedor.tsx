import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Bell, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const EsperandoProveedor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job_id");
  const [verifying, setVerifying] = useState(true);
  const [job, setJob] = useState<any>(null);

  useEffect(() => {
    if (!jobId) {
      toast.error("No se encontró la solicitud");
      navigate("/user-landing");
      return;
    }

    verifyPaymentStatus();
  }, [jobId]);

  const verifyPaymentStatus = async () => {
    try {
      console.log('🔵 [ESPERANDO] Verifying payment status for job:', jobId);
      
      // Fetch the job to check payment status
      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) {
        console.error('❌ [ESPERANDO] Error fetching job:', jobError);
        throw jobError;
      }

      console.log('✅ [ESPERANDO] Job fetched:', {
        jobId: jobData.id,
        status: jobData.status,
        visit_fee_paid: jobData.visit_fee_paid,
        stripe_visit_payment_intent_id: jobData.stripe_visit_payment_intent_id
      });

      // CRITICAL FIX: Only show success if there's an actual PaymentIntent ID
      // OR if the job status is already 'active' (payment confirmed by webhook)
      const hasValidPayment = jobData.stripe_visit_payment_intent_id || 
                              (jobData.visit_fee_paid && jobData.status === 'active');

      if (!hasValidPayment) {
        console.log('⚠️ [ESPERANDO] No valid payment found, redirecting to payment page');
        toast.info("Aún no has completado el pago de visita");
        navigate(`/job/${jobId}/payment`);
        return;
      }

      // Payment is valid, show success page
      setJob(jobData);
      
      // Only show success toast if payment was actually made
      if (jobData.visit_fee_paid) {
        toast.success("¡Pago confirmado exitosamente!");
      } else {
        toast.info("Tu pago está siendo procesado");
      }
    } catch (error) {
      console.error("❌ [ESPERANDO] Error:", error);
      toast.error("Error al verificar el pago");
      navigate("/user-landing");
    } finally {
      setVerifying(false);
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen bg-gradient-main py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verificando pago...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="space-y-6">
          {/* Success Header */}
          <div className="text-center">
            <div className="mb-4 flex justify-center">
              <div className="bg-green-500/10 p-4 rounded-full">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2">¡Pago confirmado!</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Tu visita técnica ha sido programada. Estamos notificando a profesionales verificados en tu área.
            </p>
          </div>

          {/* Job Status Card */}
          <Card className="bg-gradient-card border-0 shadow-raised">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="text-lg font-semibold">Esperando respuestas</h3>
                  <p className="text-sm text-muted-foreground">
                    Los profesionales están revisando tu solicitud
                  </p>
                </div>
              </div>

              <div className="space-y-3 mt-4">
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                  <Bell className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Te notificaremos</p>
                    <p className="text-xs text-muted-foreground">
                      Recibirás notificaciones cuando los profesionales envíen sus presupuestos
                    </p>
                  </div>
                </div>

                {job && (
                  <div className="mt-4 p-4 border border-border rounded-lg">
                    <h4 className="text-sm font-semibold mb-2">Detalles de tu solicitud</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Servicio:</span>
                        <span className="ml-2 capitalize font-medium">{job.service_type}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Problema:</span>
                        <span className="ml-2 capitalize font-medium">{job.problem}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Ubicación:</span>
                        <span className="ml-2 font-medium">{job.location}</span>
                      </div>
                      {job.urgent && (
                        <div className="text-orange-500 font-medium">
                          ⚡ Solicitud urgente
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Next Steps Card */}
          <Card className="bg-gradient-glass border-0">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Próximos pasos</h3>
              <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Recibirás hasta 5 presupuestos de profesionales verificados</li>
                <li>Compara precios, reseñas y disponibilidad</li>
                <li>Selecciona al profesional que prefieras</li>
                <li>El profesional confirmará la visita técnica</li>
                <li>Recibe el servicio y califica tu experiencia</li>
              </ol>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <Button
              className="w-full bg-gradient-button"
              size="lg"
              onClick={() => navigate("/user-landing")}
            >
              <Home className="mr-2 h-5 w-5" />
              Volver al inicio
            </Button>
            
            <Button
              variant="outline"
              className="w-full"
              onClick={() => navigate("/finding-provider?job_id=" + jobId)}
            >
              Ver mis solicitudes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EsperandoProveedor;
