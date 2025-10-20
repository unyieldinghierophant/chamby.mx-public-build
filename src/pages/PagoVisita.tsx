import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Shield, Clock, MapPin, Calendar, AlertCircle } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

const PagoVisita = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const jobId = searchParams.get("job_id");
  
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!jobId) {
      toast.error("No se encontró la solicitud");
      navigate("/nueva-solicitud");
      return;
    }

    fetchJobDetails();
  }, [jobId]);

  const fetchJobDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (error) throw error;
      setJob(data);
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Error al cargar la solicitud");
      navigate("/nueva-solicitud");
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!user) {
      navigate("/auth/user");
      return;
    }

    setIsProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke("create-visit-payment", {
        body: { job_id: jobId },
      });

      if (error) throw error;

      if (data?.url) {
        window.open(data.url, "_blank");
      } else {
        throw new Error("No se recibió la URL de pago");
      }
    } catch (error) {
      console.error("Error creating payment:", error);
      toast.error("Error al procesar el pago");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Confirma tu visita técnica por $250 MXN</h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Un experto acudirá a tu domicilio para diagnosticar el problema y ofrecer una cotización precisa.
            </p>
          </div>

          {/* Job Summary Card */}
          <Card className="bg-gradient-card border-0 shadow-raised">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold mb-4">Resumen de tu solicitud</h3>
              
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Servicio</p>
                  <p className="font-medium capitalize">{job?.service_type}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground">Problema</p>
                  <p className="font-medium capitalize">{job?.problem}</p>
                </div>

                {job?.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm">{job.description}</p>
                  </div>
                )}

                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-primary mt-1" />
                  <div>
                    <p className="text-sm text-muted-foreground">Ubicación</p>
                    <p className="text-sm">{job?.location}</p>
                  </div>
                </div>

                {job?.urgent && (
                  <div className="flex items-center gap-2 p-3 bg-orange-500/10 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                    <span className="text-sm font-medium text-orange-500">Solicitud urgente</span>
                  </div>
                )}

                {job?.scheduled_at && (
                  <div className="flex items-start gap-2">
                    <Calendar className="h-4 w-4 text-primary mt-1" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fecha programada</p>
                      <p className="text-sm">
                        {new Date(job.scheduled_at).toLocaleDateString("es-MX", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Information Card */}
          <Card className="bg-gradient-card border-0 shadow-raised">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-primary mb-2">$250 MXN</div>
                <p className="text-sm text-muted-foreground">Pago único de visita técnica</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pago seguro</p>
                    <p className="text-xs text-muted-foreground">
                      Tu pago está protegido con encriptación de nivel bancario
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Confirmación inmediata</p>
                    <p className="text-xs text-muted-foreground">
                      Recibe presupuestos de profesionales verificados en minutos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Múltiples métodos de pago</p>
                    <p className="text-xs text-muted-foreground">
                      Acepta tarjetas de crédito, débito y más
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-button"
                size="lg"
                onClick={handlePayment}
                disabled={isProcessing}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                {isProcessing ? "Procesando..." : "Pagar $250 MXN"}
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Al continuar, aceptas nuestros términos y condiciones
              </p>
            </CardContent>
          </Card>

          {/* Terms Card */}
          <Card className="bg-gradient-glass border-0">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">Términos del pago de visita</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Este pago será <strong>reembolsable</strong> si el servicio se completa satisfactoriamente</li>
                <li>• Si cancelas después de la visita, el pago <strong>no será reembolsado</strong></li>
                <li>• Publicación de tu solicitud a profesionales verificados</li>
                <li>• Hasta 5 presupuestos de diferentes profesionales</li>
                <li>• Protección de garantía Chamby</li>
                <li>• Soporte al cliente 24/7</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PagoVisita;
