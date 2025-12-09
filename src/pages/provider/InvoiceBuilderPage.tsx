import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { InvoiceBuilder } from "@/components/invoices/InvoiceBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, ArrowLeft, AlertTriangle, FileText } from "lucide-react";

interface JobData {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string | null;
  client_id: string;
  provider_id: string | null;
  client?: {
    full_name: string | null;
    email: string | null;
  };
}

export default function InvoiceBuilderPage() {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [job, setJob] = useState<JobData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId || !user) return;

    const fetchJob = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch job with client info
        const { data: jobData, error: jobError } = await supabase
          .from('jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (jobError) throw jobError;
        if (!jobData) {
          setError("Trabajo no encontrado");
          return;
        }

        // Verify provider owns this job
        if (jobData.provider_id !== user.id) {
          setError("No tienes permiso para crear facturas para este trabajo");
          return;
        }

        // Fetch client info
        const { data: clientData } = await supabase
          .from('users')
          .select('full_name, email')
          .eq('id', jobData.client_id)
          .single();

        setJob({
          ...jobData,
          client: clientData || { full_name: 'Cliente', email: null }
        });
      } catch (err) {
        console.error('Error fetching job:', err);
        setError("Error al cargar el trabajo");
      } finally {
        setLoading(false);
      }
    };

    fetchJob();
  }, [jobId, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Cargando trabajo...</p>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-background p-4 lg:p-6">
        <div className="container max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>

          <Card className="border-destructive/50">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Error</h2>
              <p className="text-muted-foreground text-center">
                {error || "No se pudo cargar el trabajo"}
              </p>
              <Button
                variant="outline"
                onClick={() => navigate('/provider-portal/jobs')}
                className="mt-6"
              >
                Ir a mis trabajos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-2xl mx-auto p-4 lg:p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Crear Factura
            </h1>
            <p className="text-sm text-muted-foreground">
              Genera una factura para el cliente
            </p>
          </div>
        </div>

        {/* Invoice Builder */}
        <InvoiceBuilder
          jobId={job.id}
          jobTitle={job.title}
          clientName={job.client?.full_name || 'Cliente'}
        />
      </div>
    </div>
  );
}
