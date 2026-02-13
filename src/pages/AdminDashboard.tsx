import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PaymentStatusBadge } from '@/components/PaymentStatusBadge';
import { getVisitFeeStatus, getInvoiceStatus } from '@/utils/jobPaymentStatus';
import { useCompleteFirstVisit } from '@/hooks/useCompleteFirstVisit';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Clock, Search, Image, Wallet, AlertTriangle, CheckCircle, XCircle, Loader2, User, DollarSign, Shield, FileText, Eye, Headset } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface JobWithClient {
  id: string;
  title: string;
  category: string;
  service_type: string | null;
  description: string | null;
  problem: string | null;
  location: string | null;
  status: string | null;
  rate: number;
  scheduled_at: string | null;
  time_preference: string | null;
  exact_time: string | null;
  photos: string[] | null;
  created_at: string | null;
  client_id: string;
  provider_id: string | null;
  stripe_visit_payment_intent_id: string | null;
  visit_fee_paid: boolean | null;
  provider_confirmed_visit: boolean | null;
  client_confirmed_visit: boolean | null;
  visit_confirmation_deadline: string | null;
  visit_dispute_status: string | null;
  visit_dispute_reason: string | null;
  client?: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  provider?: {
    display_name: string | null;
    business_email: string | null;
    business_phone: string | null;
  };
  invoice?: {
    status: string;
  } | null;
}

interface PendingVerification {
  id: string;
  user_id: string;
  verification_status: string;
  admin_notes: string | null;
  created_at: string;
  user: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
  };
  provider: {
    display_name: string | null;
    skills: string[] | null;
    zone_served: string | null;
  };
  documents: {
    id: string;
    doc_type: string;
    file_url: string | null;
    verification_status: string;
  }[];
}

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<JobWithClient[]>([]);
  const [disputedJobs, setDisputedJobs] = useState<JobWithClient[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState('jobs');
  const [resolvingJobId, setResolvingJobId] = useState<string | null>(null);
  const [processingVerification, setProcessingVerification] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  
  const { adminResolveCapture, adminResolveRelease } = useCompleteFirstVisit();

  useEffect(() => {
    fetchJobs();
    fetchDisputedJobs();
    fetchPendingVerifications();
  }, []);


  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Fetch all jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from('jobs')
        .select('*, invoices(status)')
        .order('created_at', { ascending: false });

      if (jobsError) throw jobsError;

      // Fetch client info for each job
      const jobsWithClients = await Promise.all(
        (jobsData || []).map(async (job) => {
          const { data: clientData } = await supabase
            .from('users')
            .select('full_name, email, phone')
            .eq('id', job.client_id)
            .maybeSingle();

          // Get the first invoice if exists (from the joined data)
          const invoices = (job as any).invoices;
          const invoice = Array.isArray(invoices) && invoices.length > 0 
            ? invoices[0] 
            : null;

          return {
            ...job,
            client: clientData || undefined,
            invoice
          };
        })
      );

      setJobs(jobsWithClients);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDisputedJobs = async () => {
    try {
      // Fetch jobs with pending disputes
      const { data: disputeData, error: disputeError } = await supabase
        .from('jobs')
        .select('*')
        .eq('visit_dispute_status', 'pending_support')
        .order('created_at', { ascending: false });

      if (disputeError) throw disputeError;

      // Fetch client and provider info for each disputed job
      const jobsWithDetails = await Promise.all(
        (disputeData || []).map(async (job) => {
          const [clientResult, providerResult] = await Promise.all([
            supabase.from('users').select('full_name, email, phone').eq('id', job.client_id).maybeSingle(),
            job.provider_id 
              ? supabase.from('providers').select('display_name, business_email, business_phone').eq('user_id', job.provider_id).maybeSingle()
              : Promise.resolve({ data: null })
          ]);

          return {
            ...job,
            client: clientResult.data || undefined,
            provider: providerResult.data || undefined
          };
        })
      );

      setDisputedJobs(jobsWithDetails);
    } catch (error) {
      console.error('Error fetching disputed jobs:', error);
    }
  };

  const fetchPendingVerifications = async () => {
    try {
      // Fetch provider_details with pending or recently updated status
      const { data: providerDetails, error } = await supabase
        .from('provider_details')
        .select('id, user_id, verification_status, admin_notes, created_at')
        .in('verification_status', ['pending', 'rejected'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch related user, provider, and documents for each
      const verificationsWithDetails = await Promise.all(
        (providerDetails || []).map(async (detail) => {
          const [userResult, providerResult, docsResult] = await Promise.all([
            supabase.from('users').select('full_name, email, phone').eq('id', detail.user_id).maybeSingle(),
            supabase.from('providers').select('display_name, skills, zone_served').eq('user_id', detail.user_id).maybeSingle(),
            supabase.from('documents').select('id, doc_type, file_url, verification_status').eq('provider_id', detail.user_id)
          ]);

          return {
            ...detail,
            user: userResult.data || { full_name: null, email: null, phone: null },
            provider: providerResult.data || { display_name: null, skills: null, zone_served: null },
            documents: docsResult.data || []
          };
        })
      );

      setPendingVerifications(verificationsWithDetails);
    } catch (error) {
      console.error('Error fetching pending verifications:', error);
    }
  };

  const handleApproveProvider = async (userId: string) => {
    setProcessingVerification(userId);
    try {
      const notes = adminNotes[userId] || null;

      // Verify provider exists
      const { data: providerData, error: providerCheckError } = await supabase
        .from('providers')
        .select('id, user_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (providerCheckError) throw new Error(`No se pudo verificar el perfil del proveedor: ${providerCheckError.message}`);
      if (!providerData) throw new Error('El perfil del proveedor no existe.');

      // Upsert provider_details (creates if missing)
      const { error: detailsError, count: detailsCount } = await supabase
        .from('provider_details')
        .upsert({
          user_id: userId,
          provider_id: providerData.id,
          verification_status: 'verified',
          admin_notes: notes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id' });

      if (detailsError) throw new Error(`No se pudo actualizar detalles: ${detailsError.message}`);

      // Update providers.verified
      const { error: providerError, count: providerCount } = await supabase
        .from('providers')
        .update({ verified: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId);

      if (providerError) throw new Error(`No se pudo actualizar proveedor: ${providerError.message}`);
      if (providerCount === 0) throw new Error('El proveedor no fue actualizado.');

      // Update all documents to verified
      const { error: docsError } = await supabase
        .from('documents')
        .update({ verification_status: 'verified' })
        .eq('provider_id', userId);

      if (docsError) throw new Error(`No se pudo actualizar documentos: ${docsError.message}`);

      toast.success('Proveedor aprobado', {
        description: 'El proveedor ha sido verificado exitosamente y puede aceptar trabajos.'
      });

      fetchPendingVerifications();
    } catch (error) {
      console.error('[Admin] Error approving provider:', error);
      const errorMessage = error instanceof Error ? error.message : 'Intenta de nuevo más tarde.';
      toast.error('Error al aprobar', {
        description: errorMessage
      });
    } finally {
      setProcessingVerification(null);
    }
  };

  const handleRejectProvider = async (userId: string) => {
    const notes = adminNotes[userId];
    if (!notes || notes.trim() === '') {
      toast.error('Notas requeridas', {
        description: 'Por favor proporciona una razón para el rechazo.'
      });
      return;
    }

    setProcessingVerification(userId);
    try {
      // Update provider_details
      const { error: detailsError } = await supabase
        .from('provider_details')
        .update({ 
          verification_status: 'rejected',
          admin_notes: notes 
        })
        .eq('user_id', userId);

      if (detailsError) throw detailsError;

      // Update providers.verified to false
      const { error: providerError } = await supabase
        .from('providers')
        .update({ verified: false })
        .eq('user_id', userId);

      if (providerError) throw providerError;

      // Update all documents to rejected
      const { error: docsError } = await supabase
        .from('documents')
        .update({ 
          verification_status: 'rejected',
          rejection_reason: notes
        })
        .eq('provider_id', userId);

      if (docsError) throw docsError;

      toast.success('Proveedor rechazado', {
        description: 'Se ha notificado al proveedor sobre el rechazo.'
      });

      setAdminNotes(prev => ({ ...prev, [userId]: '' }));
      fetchPendingVerifications();
    } catch (error) {
      console.error('Error rejecting provider:', error);
      toast.error('Error al rechazar', {
        description: 'No se pudo rechazar al proveedor.'
      });
    } finally {
      setProcessingVerification(null);
    }
  };

  const getSignedUrl = async (filePath: string) => {
    // Extract the path after the bucket name
    const { data, error } = await supabase.storage
      .from('user-documents')
      .createSignedUrl(filePath.replace('user-documents/', ''), 3600);
    
    if (error) {
      console.error('Error getting signed URL:', error);
      return null;
    }
    return data.signedUrl;
  };

  const handleViewDocument = async (fileUrl: string | null) => {
    if (!fileUrl) {
      toast.error('Documento no disponible');
      return;
    }

    // If it's already a full URL, open it
    if (fileUrl.startsWith('http')) {
      window.open(fileUrl, '_blank');
      return;
    }

    // Otherwise get a signed URL
    const signedUrl = await getSignedUrl(fileUrl);
    if (signedUrl) {
      window.open(signedUrl, '_blank');
    } else {
      toast.error('No se pudo obtener el documento');
    }
  };

  const documentTypeLabels: Record<string, string> = {
    'face_photo': 'Foto de Rostro',
    'id_front': 'INE Frente',
    'id_back': 'INE Reverso',
    'id_card': 'INE/ID',
    'criminal_record': 'Carta de Antecedentes',
  }
  const handleResolveCapture = async (jobId: string) => {
    setResolvingJobId(jobId);
    try {
      await adminResolveCapture(jobId);
      toast.success('Pago capturado exitosamente', {
        description: 'Los $350 MXN han sido cobrados al cliente.'
      });
      // Refresh disputed jobs
      fetchDisputedJobs();
    } catch (error) {
      toast.error('Error al capturar el pago', {
        description: error instanceof Error ? error.message : 'Intenta de nuevo'
      });
    } finally {
      setResolvingJobId(null);
    }
  };

  const handleResolveRelease = async (jobId: string) => {
    setResolvingJobId(jobId);
    try {
      await adminResolveRelease(jobId);
      toast.success('Pago liberado exitosamente', {
        description: 'Los fondos han sido devueltos al cliente.'
      });
      // Refresh disputed jobs
      fetchDisputedJobs();
    } catch (error) {
      toast.error('Error al liberar el pago', {
        description: error instanceof Error ? error.message : 'Intenta de nuevo'
      });
    } finally {
      setResolvingJobId(null);
    }
  };

  const getStatusBadge = (status: string | null) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
      pending: { label: 'Pendiente', variant: 'secondary' },
      active: { label: 'Activo', variant: 'default' },
      in_progress: { label: 'En Progreso', variant: 'default' },
      completed: { label: 'Completado', variant: 'outline' },
      cancelled: { label: 'Cancelado', variant: 'destructive' },
    };

    const statusInfo = statusMap[status || 'pending'] || { label: status || 'Desconocido', variant: 'secondary' as const };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const filteredJobs = jobs.filter((job) => {
    const matchesSearch = 
      job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.client?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.location?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || job.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando solicitudes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold">Panel de Administración</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Gestión de trabajos y disputas</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin/support')}
                className="flex items-center gap-2"
              >
                <Headset className="h-4 w-4" />
                <span className="hidden sm:inline">Soporte</span>
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/admin/payouts')}
                className="flex items-center gap-2"
              >
                <Wallet className="h-4 w-4" />
                <span className="hidden sm:inline">Payouts</span>
              </Button>
              {disputedJobs.length > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  {disputedJobs.length} disputas
                </Badge>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="container mx-auto px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="jobs" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Trabajos</span>
              <Badge variant="secondary" className="ml-1 text-xs">{filteredJobs.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="disputes" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Disputas</span>
              {disputedJobs.length > 0 && (
                <Badge variant="destructive" className="ml-1 text-xs">{disputedJobs.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="verifications" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <span className="hidden sm:inline">Verificaciones</span>
              {pendingVerifications.filter(v => v.verification_status === 'pending').length > 0 && (
                <Badge variant="default" className="ml-1 text-xs animate-pulse">
                  {pendingVerifications.filter(v => v.verification_status === 'pending').length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Jobs Tab */}
          <TabsContent value="jobs" className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por título, cliente, ubicación..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filtrar por estado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="active">Activo</SelectItem>
                  <SelectItem value="in_progress">En Progreso</SelectItem>
                  <SelectItem value="completed">Completado</SelectItem>
                  <SelectItem value="cancelled">Cancelado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Jobs List */}
            <div className="space-y-4">
              {filteredJobs.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No se encontraron solicitudes</p>
                  </CardContent>
                </Card>
              ) : (
                filteredJobs.map((job) => (
                  <Card key={job.id} className="overflow-hidden">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-base sm:text-lg">{job.title}</CardTitle>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {job.category} {job.service_type && `• ${job.service_type}`}
                          </p>
                        </div>
                        {getStatusBadge(job.status)}
                      </div>
                      {/* Payment Status Badges */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <PaymentStatusBadge type="visit_fee" status={getVisitFeeStatus(job)} role="customer" />
                        {getInvoiceStatus(job.invoice) !== 'none' && (
                          <PaymentStatusBadge type="invoice" status={getInvoiceStatus(job.invoice)} role="customer" />
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 sm:space-y-4">
                      {/* Client Info */}
                      <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                        <p className="font-medium text-xs sm:text-sm">Cliente</p>
                        <div className="grid gap-1 text-xs sm:text-sm">
                          <p className="font-semibold">{job.client?.full_name || 'Sin nombre'}</p>
                          {job.client?.phone && (
                            <a 
                              href={`tel:${job.client.phone}`}
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <Phone className="h-3 w-3" />
                              {job.client.phone}
                            </a>
                          )}
                          {job.client?.email && (
                            <a 
                              href={`mailto:${job.client.email}`}
                              className="flex items-center gap-2 text-primary hover:underline truncate"
                            >
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{job.client.email}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Description */}
                      {(job.description || job.problem) && (
                        <div>
                          <p className="font-medium text-xs sm:text-sm mb-1">Descripción</p>
                          <p className="text-xs sm:text-sm text-muted-foreground">
                            {job.description || job.problem}
                          </p>
                        </div>
                      )}

                      {/* Location */}
                      {job.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <p className="text-xs sm:text-sm">{job.location}</p>
                        </div>
                      )}

                      {/* Schedule */}
                      <div className="flex flex-wrap gap-3 sm:gap-4 text-xs sm:text-sm">
                        {job.scheduled_at && (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                            <span>
                              {format(new Date(job.scheduled_at), "d MMM yyyy", { locale: es })}
                            </span>
                          </div>
                        )}
                        {(job.time_preference || job.exact_time) && (
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-muted-foreground" />
                            <span>{job.exact_time || job.time_preference}</span>
                          </div>
                        )}
                      </div>

                      {/* Photos */}
                      {job.photos && job.photos.length > 0 && (
                        <div>
                          <p className="font-medium text-xs sm:text-sm mb-2 flex items-center gap-2">
                            <Image className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            Fotos ({job.photos.length})
                          </p>
                          <div className="flex gap-2 overflow-x-auto pb-2">
                            {job.photos.map((photo, index) => (
                              <a
                                key={index}
                                href={photo}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="shrink-0"
                              >
                                <img
                                  src={photo}
                                  alt={`Foto ${index + 1}`}
                                  className="h-16 w-16 sm:h-20 sm:w-20 object-cover rounded-lg border hover:opacity-80 transition-opacity"
                                />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                        <span>
                          Creado: {job.created_at && format(new Date(job.created_at), "d MMM yyyy, HH:mm", { locale: es })}
                        </span>
                        <span className="font-mono">{job.id.slice(0, 8)}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          {/* Disputes Tab */}
          <TabsContent value="disputes" className="space-y-4">
            {disputedJobs.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-success mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground font-medium">No hay disputas pendientes</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todas las visitas han sido confirmadas correctamente
                  </p>
                </CardContent>
              </Card>
            ) : (
              disputedJobs.map((job) => (
                <Card key={job.id} className="border-amber-200 dark:border-amber-800 overflow-hidden">
                  <CardHeader className="bg-amber-50 dark:bg-amber-950/30 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
                          <CardTitle className="text-base sm:text-lg truncate">{job.title}</CardTitle>
                        </div>
                        <CardDescription className="text-xs sm:text-sm">
                          {job.category} • ID: {job.id.slice(0, 8)}
                        </CardDescription>
                      </div>
                      <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300 text-xs flex-shrink-0">
                        Pendiente Soporte
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Dispute Reason */}
                    {job.visit_dispute_reason && (
                      <Alert variant="destructive" className="bg-red-50 dark:bg-red-950/30 border-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription className="text-xs sm:text-sm">
                          <strong>Razón de la disputa:</strong> {job.visit_dispute_reason}
                        </AlertDescription>
                      </Alert>
                    )}

                    {/* Client & Provider Info */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {/* Client */}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <p className="font-medium text-xs sm:text-sm">Cliente</p>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm">
                          <p className="font-semibold">{job.client?.full_name || 'Sin nombre'}</p>
                          {job.client?.phone && (
                            <a href={`tel:${job.client.phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                              <Phone className="h-3 w-3" />
                              {job.client.phone}
                            </a>
                          )}
                          {job.client?.email && (
                            <a href={`mailto:${job.client.email}`} className="flex items-center gap-1.5 text-primary hover:underline truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{job.client.email}</span>
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Provider */}
                      <div className="bg-muted/50 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="h-4 w-4 text-primary" />
                          <p className="font-medium text-xs sm:text-sm">Proveedor</p>
                        </div>
                        <div className="space-y-1 text-xs sm:text-sm">
                          <p className="font-semibold">{job.provider?.display_name || 'Sin asignar'}</p>
                          {job.provider?.business_phone && (
                            <a href={`tel:${job.provider.business_phone}`} className="flex items-center gap-1.5 text-primary hover:underline">
                              <Phone className="h-3 w-3" />
                              {job.provider.business_phone}
                            </a>
                          )}
                          {job.provider?.business_email && (
                            <a href={`mailto:${job.provider.business_email}`} className="flex items-center gap-1.5 text-primary hover:underline truncate">
                              <Mail className="h-3 w-3 flex-shrink-0" />
                              <span className="truncate">{job.provider.business_email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Job Details */}
                    <div className="space-y-2 text-xs sm:text-sm">
                      {job.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{job.location}</span>
                        </div>
                      )}
                      {job.scheduled_at && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Programado: {format(new Date(job.scheduled_at), "d 'de' MMMM yyyy", { locale: es })}
                          </span>
                        </div>
                      )}
                      {job.visit_confirmation_deadline && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-3.5 w-3.5 text-amber-600" />
                          <span className="text-amber-600">
                            Deadline expiró: {formatDistanceToNow(new Date(job.visit_confirmation_deadline), { locale: es, addSuffix: true })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Amount Info */}
                    <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Monto preautorizado</span>
                      </div>
                      <span className="text-lg font-bold text-primary">$350 MXN</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        onClick={() => handleResolveCapture(job.id)}
                        disabled={resolvingJobId === job.id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white h-10 sm:h-11"
                      >
                        {resolvingJobId === job.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        <span>Cobrar al cliente</span>
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleResolveRelease(job.id)}
                        disabled={resolvingJobId === job.id}
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 h-10 sm:h-11"
                      >
                        {resolvingJobId === job.id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        <span>Liberar fondos</span>
                      </Button>
                    </div>

                    {/* Help text */}
                    <p className="text-xs text-muted-foreground text-center">
                      <strong>Cobrar:</strong> El proveedor completó la visita correctamente. 
                      <strong className="ml-2">Liberar:</strong> El cliente tiene razón, devolver fondos.
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          {/* Verifications Tab */}
          <TabsContent value="verifications" className="space-y-4">
            {pendingVerifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground font-medium">No hay verificaciones pendientes</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todos los proveedores han sido revisados
                  </p>
                </CardContent>
              </Card>
            ) : (
              pendingVerifications.map((verification) => (
                <Card key={verification.id} className="overflow-hidden">
                  <CardHeader className="bg-muted/30 pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <User className="h-4 w-4 text-primary flex-shrink-0" />
                          <CardTitle className="text-base sm:text-lg truncate">
                            {verification.user.full_name || verification.provider.display_name || 'Sin nombre'}
                          </CardTitle>
                        </div>
                        <CardDescription className="text-xs sm:text-sm space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3" />
                            <span>{verification.user.email || 'Sin email'}</span>
                          </div>
                          {verification.user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3" />
                              <a href={`tel:${verification.user.phone}`} className="text-primary hover:underline">
                                {verification.user.phone}
                              </a>
                            </div>
                          )}
                        </CardDescription>
                      </div>
                      <Badge 
                        variant={verification.verification_status === 'pending' ? 'secondary' : 'destructive'}
                        className="flex-shrink-0"
                      >
                        {verification.verification_status === 'pending' ? 'Pendiente' : 'Rechazado'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    {/* Provider Info */}
                    {(verification.provider.skills?.length || verification.provider.zone_served) && (
                      <div className="bg-muted/30 rounded-lg p-3 space-y-2">
                        {verification.provider.skills && verification.provider.skills.length > 0 && (
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Habilidades:</p>
                            <div className="flex flex-wrap gap-1">
                              {verification.provider.skills.map((skill, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {verification.provider.zone_served && (
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-3 w-3 text-muted-foreground" />
                            <span>{verification.provider.zone_served}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Documents */}
                    <div>
                      <p className="font-medium text-sm mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Documentos ({verification.documents.length})
                      </p>
                      {verification.documents.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No hay documentos subidos</p>
                      ) : (
                        <div className="space-y-2">
                          {verification.documents.map((doc) => (
                            <div 
                              key={doc.id} 
                              className="flex items-center justify-between p-2 bg-muted/20 rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">
                                  {documentTypeLabels[doc.doc_type] || doc.doc_type}
                                </span>
                                <Badge 
                                  variant={doc.verification_status === 'verified' ? 'default' : 
                                           doc.verification_status === 'rejected' ? 'destructive' : 'secondary'}
                                  className="text-xs"
                                >
                                  {doc.verification_status === 'verified' ? '✓' : 
                                   doc.verification_status === 'rejected' ? '✗' : '⏳'}
                                </Badge>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDocument(doc.file_url)}
                                className="h-8"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Ver
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Admin Notes */}
                    <div>
                      <p className="text-sm font-medium mb-2">Notas para el proveedor (requerido para rechazar):</p>
                      <Textarea
                        placeholder="Ej: La foto del INE está borrosa, por favor sube una foto más clara..."
                        value={adminNotes[verification.user_id] || ''}
                        onChange={(e) => setAdminNotes(prev => ({
                          ...prev,
                          [verification.user_id]: e.target.value
                        }))}
                        className="min-h-[80px]"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-2 pt-2">
                      <Button
                        onClick={() => handleApproveProvider(verification.user_id)}
                        disabled={processingVerification === verification.user_id}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        {processingVerification === verification.user_id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        )}
                        Aprobar Proveedor
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => handleRejectProvider(verification.user_id)}
                        disabled={processingVerification === verification.user_id}
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                      >
                        {processingVerification === verification.user_id ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <XCircle className="h-4 w-4 mr-2" />
                        )}
                        Rechazar
                      </Button>
                    </div>

                    {/* Metadata */}
                    <div className="text-xs text-muted-foreground pt-2 border-t">
                      Registrado: {verification.created_at && format(new Date(verification.created_at), "d MMM yyyy", { locale: es })}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
