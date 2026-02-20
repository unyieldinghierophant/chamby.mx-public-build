import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, XCircle, Plus, MessageCircle, MapPin, Clock } from "lucide-react";
import { InvoiceCard } from "@/components/provider-portal/InvoiceCard";
import { JobTrackingMap } from "@/components/JobTrackingMap";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PaymentStatusBadge } from "@/components/PaymentStatusBadge";
import { ClientVisitConfirmation } from "@/components/ClientVisitConfirmation";
import { getVisitFeeStatus, getInvoiceStatus } from "@/utils/jobPaymentStatus";
import { DISPLAY } from "@/utils/visitPricing";
import Header from "@/components/Header";
import { toast } from "sonner";
import { startBooking } from "@/lib/booking";

interface ActiveJob {
  id: string;
  title: string;
  category: string;
  description: string;
  location: string;
  status: string;
  rate: number;
  scheduled_at: string | null;
  provider_id: string | null;
  // Payment status fields
  stripe_visit_payment_intent_id: string | null;
  visit_fee_paid: boolean | null;
  // Double confirmation fields
  provider_confirmed_visit: boolean;
  client_confirmed_visit: boolean;
  visit_confirmation_deadline: string | null;
  visit_dispute_status: string | null;
  visit_dispute_reason: string | null;
  // Completion handshake
  completion_status: string | null;
  completion_marked_at: string | null;
  completion_confirmed_at: string | null;
  provider?: {
    full_name: string;
    phone: string;
    avatar_url: string;
    current_latitude: number | null;
    current_longitude: number | null;
    rating: number;
    total_reviews: number;
  };
  invoice?: {
    id: string;
    status: string;
    total_customer_amount: number;
    subtotal_provider: number;
    chamby_commission_amount: number;
    provider_notes: string | null;
    created_at: string;
    items: any[];
  } | null;
}

const ActiveJobs = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [jobs, setJobs] = useState<ActiveJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<ActiveJob | null>(null);
  const [confirmingCompletion, setConfirmingCompletion] = useState(false);

  useEffect(() => {
    if (user) {
      fetchActiveJobs();
    }
  }, [user]);

  const fetchActiveJobs = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*, invoices(id, status, total_customer_amount, subtotal_provider, chamby_commission_amount, provider_notes, created_at)")
        .eq("client_id", user.id)
        .in("status", ["searching", "active", "accepted", "confirmed", "en_route", "on_site", "quoted", "in_progress"])
        .order("created_at", { ascending: false });

      if (jobsError) throw jobsError;

      const jobsWithProviders = await Promise.all(
        (jobsData || []).map(async (job) => {
          // Get the first invoice if exists (from the joined data)
          const invoicesRaw = (job as any).invoices;
          const invoiceRow = Array.isArray(invoicesRaw) && invoicesRaw.length > 0 
            ? invoicesRaw[0] 
            : null;
          const invoice = invoiceRow ? { ...invoiceRow, items: [] } : null;
          // Remove raw invoices array from job to avoid React child errors
          const { invoices: _inv, ...jobClean } = job as any;

          if (jobClean.provider_id) {
            const { data: userData } = await supabase
              .from("users")
              .select("full_name, phone, avatar_url")
              .eq("id", jobClean.provider_id)
              .maybeSingle();

            const { data: providerData } = await supabase
              .from("providers")
              .select("current_latitude, current_longitude, rating, total_reviews")
              .eq("user_id", jobClean.provider_id)
              .maybeSingle();

            return {
              ...jobClean,
              invoice,
              provider: {
                ...userData,
                ...providerData,
              },
            };
          }
          return { ...jobClean, invoice };
        })
      );

      setJobs(jobsWithProviders);
      if (jobsWithProviders.length > 0) {
        setSelectedJob(jobsWithProviders[0]);
      }
    } catch (error) {
      console.error("Error fetching active jobs:", error);
      toast.error("Error al cargar trabajos activos");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelJob = async (jobId: string) => {
    if (!confirm("¿Estás seguro de que quieres cancelar este trabajo?")) return;

    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "cancelled" })
        .eq("id", jobId);

      if (error) throw error;

      toast.success("Trabajo cancelado exitosamente");
      fetchActiveJobs();
    } catch (error) {
      console.error("Error cancelling job:", error);
      toast.error("Error al cancelar el trabajo");
    }
  };

  // Check if job needs client confirmation
  const needsClientConfirmation = (job: ActiveJob) => {
    return job.provider_confirmed_visit && 
           !job.client_confirmed_visit && 
           !job.visit_dispute_status;
  };

  // Check if job needs completion confirmation
  const needsCompletionConfirmation = (job: ActiveJob) => {
    return job.completion_status === 'provider_marked_done';
  };

  const handleConfirmCompletion = async (jobId: string) => {
    setConfirmingCompletion(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('complete-job', {
        body: { job_id: jobId, action: 'client_confirm' },
      });
      if (fnError || data?.error) {
        toast.error(data?.error || fnError?.message || 'Error al confirmar');
        return;
      }
      toast.success('¡Trabajo confirmado! El pago será liberado al proveedor.');
      fetchActiveJobs();
    } catch (err) {
      toast.error('Error inesperado');
    } finally {
      setConfirmingCompletion(false);
    }
  };

  // Jobs pending client confirmation
  const pendingConfirmationJobs = jobs.filter(needsClientConfirmation);
  const pendingCompletionJobs = jobs.filter(needsCompletionConfirmation);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-main">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-96 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-main">
        <Header />
        <div className="container mx-auto px-4 pt-32 pb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/user-landing")}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold mb-4">No tienes trabajos activos</h2>
            <p className="text-muted-foreground mb-6">
              Solicita un servicio para ver tus trabajos activos aquí
            </p>
            <Button onClick={() => startBooking(navigate, { entrySource: 'active_jobs' })}>
              Solicitar servicio
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main">
      <Header />
      <div className="container mx-auto px-4 pt-32 pb-8">
        <Button
          variant="ghost"
          onClick={() => navigate("/user-landing")}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <h1 className="text-3xl font-bold mb-6">Trabajos Activos</h1>

        {/* Pending Confirmations Alert */}
        {pendingConfirmationJobs.length > 0 && (
          <Card className="mb-6 border-primary/50 bg-primary/5">
            <CardContent className="p-4">
              <h3 className="font-semibold text-primary mb-3">
                ⏳ {pendingConfirmationJobs.length} visita{pendingConfirmationJobs.length > 1 ? 's' : ''} pendiente{pendingConfirmationJobs.length > 1 ? 's' : ''} de confirmación
              </h3>
              <div className="space-y-3">
                {pendingConfirmationJobs.map((job) => (
                  <ClientVisitConfirmation 
                    key={job.id}
                    job={{
                      ...job,
                      provider: job.provider ? { full_name: job.provider.full_name } : undefined
                    }}
                    onConfirmed={fetchActiveJobs}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Jobs List */}
          <div className="md:col-span-1 space-y-4">
            {jobs.map((job) => {
              const visitFeeStatus = getVisitFeeStatus(job);
              const invoiceStatus = getInvoiceStatus(job.invoice);
              const needsConfirm = needsClientConfirmation(job);
              
              return (
                <Card
                  key={job.id}
                  className={`cursor-pointer transition-all ${
                    selectedJob?.id === job.id
                      ? "border-primary shadow-lg"
                      : needsConfirm
                      ? "border-warning/50 hover:border-warning"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold">{job.title}</h3>
                      <div className="flex items-center gap-1">
                        {needsConfirm && (
                          <Badge variant="outline" className="text-warning border-warning text-xs">
                            Confirmar
                          </Badge>
                        )}
                        <Badge variant={job.provider_id ? "default" : "secondary"}>
                          {job.status}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{job.category}</p>
                    
                    {/* Payment Status Badges */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      <PaymentStatusBadge type="visit_fee" status={visitFeeStatus} role="customer" />
                      {invoiceStatus !== 'none' && (
                        <PaymentStatusBadge type="invoice" status={invoiceStatus} role="customer" />
                      )}
                    </div>
                    
                    {job.provider && (
                      <div className="flex items-center gap-2 mt-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={job.provider.avatar_url} />
                          <AvatarFallback>
                            {job.provider.full_name?.charAt(0) || "P"}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium">
                          {job.provider.full_name}
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Job Details */}
          {selectedJob && (
            <div className="md:col-span-2 space-y-6">
              {/* Client Visit Confirmation - Show at top if needed */}
              {needsClientConfirmation(selectedJob) && (
                <ClientVisitConfirmation 
                  job={{
                    ...selectedJob,
                    provider: selectedJob.provider ? { full_name: selectedJob.provider.full_name } : undefined
                  }}
                  onConfirmed={fetchActiveJobs}
                />
              )}

              {/* Completion Confirmation Banner */}
              {needsCompletionConfirmation(selectedJob) && (
                <Card className="border-primary/50 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <h3 className="font-semibold text-foreground">
                      ✅ El proveedor indicó que el trabajo terminó
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Confirma que estás satisfecho con el trabajo para liberar el pago al proveedor.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleConfirmCompletion(selectedJob.id)}
                        disabled={confirmingCompletion}
                        className="flex-1"
                      >
                        {confirmingCompletion ? "Confirmando..." : "Confirmar trabajo"}
                      </Button>
                      <Button variant="outline" disabled className="flex-1 opacity-60">
                        Necesito ayuda
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Pago liberado */}
              {selectedJob.invoice?.status === 'released' && (
                <Card className="border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-4 text-center">
                    <p className="text-sm font-medium text-foreground">💸 Pago liberado al proveedor</p>
                  </CardContent>
                </Card>
              )}

              {/* Provider Info */}
              {selectedJob.provider && (
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-4">Tu Chambynauta</h3>
                    <div className="flex items-center gap-4 mb-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedJob.provider.avatar_url} />
                        <AvatarFallback>
                          {selectedJob.provider.full_name?.charAt(0) || "P"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h4 className="font-semibold text-lg">
                          {selectedJob.provider.full_name}
                        </h4>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>⭐ {selectedJob.provider.rating?.toFixed(1) || "N/A"}</span>
                          <span>•</span>
                          <span>{selectedJob.provider.total_reviews || 0} reseñas</span>
                        </div>
                      </div>
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => navigate(`/messages`)}
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Mensaje
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Job Details */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Detalles del Trabajo</h3>
                  <div className="space-y-3">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm font-medium">Ubicación</p>
                        <p className="text-sm text-muted-foreground">{selectedJob.location}</p>
                      </div>
                    </div>
                    {selectedJob.scheduled_at && (
                      <div className="flex items-start gap-2">
                        <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm font-medium">Programado</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(selectedJob.scheduled_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="pt-3 border-t">
                      <p className="text-sm font-medium mb-1">Descripción</p>
                      <p className="text-sm text-muted-foreground">{selectedJob.description}</p>
                    </div>
                    <div className="pt-3 border-t space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">Desglose de visita</p>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Visita</span>
                        <span>{DISPLAY.baseFee}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">IVA (16%)</span>
                        <span>{DISPLAY.iva}</span>
                      </div>
                      <div className="flex justify-between text-sm font-semibold border-t pt-1">
                        <span>Total</span>
                        <span>{DISPLAY.customerTotal}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Invoice Card - client side */}
              {selectedJob.invoice && (
                <InvoiceCard
                  jobId={selectedJob.id}
                  clientId={user?.id || ""}
                  jobStatus={selectedJob.status}
                  invoice={selectedJob.invoice}
                  onInvoiceCreated={fetchActiveJobs}
                  isProvider={false}
                />
              )}

              {/* Actions */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Acciones</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <Button variant="outline">
                      <Calendar className="mr-2 h-4 w-4" />
                      Reagendar
                    </Button>
                    <Button variant="outline">
                      <Plus className="mr-2 h-4 w-4" />
                      Agregar servicios
                    </Button>
                    <Button
                      variant="destructive"
                      className="col-span-2"
                      onClick={() => handleCancelJob(selectedJob.id)}
                    >
                      <XCircle className="mr-2 h-4 w-4" />
                      Cancelar trabajo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActiveJobs;
