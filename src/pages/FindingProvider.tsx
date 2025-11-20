import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Search, CheckCircle2, Clock, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import Header from "@/components/Header";
import { toast } from "sonner";

interface JobProposal {
  provider_id: string;
  provider_name: string;
  provider_avatar: string;
  provider_rating: number;
  proposed_price: number;
  created_at: string;
}

const FindingProvider = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get("job_id");
  const [job, setJob] = useState<any>(null);
  const [searchProgress, setSearchProgress] = useState(0);
  const [proposals, setProposals] = useState<JobProposal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      toast.error("No se encontró la solicitud");
      navigate("/user-landing");
      return;
    }

    fetchJobDetails();

    // Simulate search progress
    const interval = setInterval(() => {
      setSearchProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [jobId]);

  const fetchJobDetails = async () => {
    if (!jobId) return;

    try {
      setLoading(true);

      const { data: jobData, error: jobError } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError) throw jobError;

      setJob(jobData);

      // In a real implementation, you would fetch actual proposals
      // For now, we'll simulate the search process
      setLoading(false);
    } catch (error) {
      console.error("Error fetching job:", error);
      toast.error("Error al cargar la solicitud");
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main">
      <Header />
      <div className="container mx-auto px-4 pt-32 pb-8 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate("/user-landing")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Buscando Chambynautas</h1>
            <p className="text-muted-foreground">
              Estamos notificando a profesionales verificados en tu área
            </p>
          </div>

          {/* Searching Animation */}
          <Card className="bg-gradient-card border-0 shadow-raised overflow-hidden">
            <CardContent className="p-8">
              <div className="flex flex-col items-center">
                {/* Animated circles */}
                <div className="relative w-40 h-40 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-ping"></div>
                  <div className="absolute inset-4 rounded-full border-4 border-primary/40 animate-ping" style={{ animationDelay: '0.5s' }}></div>
                  <div className="absolute inset-8 rounded-full border-4 border-primary/60 animate-ping" style={{ animationDelay: '1s' }}></div>
                  <div className="absolute inset-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Search className="h-12 w-12 text-primary animate-pulse" />
                  </div>
                </div>

                {/* Progress */}
                <div className="w-full space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Buscando...</span>
                    <span className="font-medium">{searchProgress}%</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-button transition-all duration-500"
                      style={{ width: `${searchProgress}%` }}
                    />
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="w-full mt-8 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Solicitud recibida</p>
                      <p className="text-sm text-muted-foreground">
                        Tu solicitud de {job?.category} está activa
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/50 flex items-center justify-center animate-pulse">
                      <Search className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Buscando Chambynautas</p>
                      <p className="text-sm text-muted-foreground">
                        Notificando a profesionales verificados cerca de ti
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-muted-foreground">Recibiendo propuestas</p>
                      <p className="text-sm text-muted-foreground">
                        Recibirás notificaciones cuando lleguen presupuestos
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Job Details */}
          {job && (
            <Card className="bg-gradient-glass border-0">
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Detalles de tu solicitud</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Servicio:</span>
                    <span className="font-medium capitalize">{job.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ubicación:</span>
                    <span className="font-medium">{job.location}</span>
                  </div>
                  {job.scheduled_at && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Programado:</span>
                      <span className="font-medium">
                        {new Date(job.scheduled_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tarifa inicial:</span>
                    <span className="font-medium">${job.rate} MXN</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info Card */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">¿Sabías que?</p>
                  <p className="text-xs text-muted-foreground">
                    Todos nuestros Chambynautas están verificados y cuentan con reseñas de clientes reales
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={() => navigate("/user-landing")}
          >
            Volver al inicio
          </Button>
        </div>
      </div>
    </div>
  );
};

export default FindingProvider;
