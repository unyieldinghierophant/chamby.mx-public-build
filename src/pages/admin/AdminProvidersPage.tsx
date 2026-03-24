import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Search, Loader2, Eye, ShieldCheck, ShieldX, Star, MapPin, Mail, Phone, Wrench, Calendar, MessageSquare, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface ProviderRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  display_name: string | null;
  skills: string[] | null;
  zone_served: string | null;
  rating: number | null;
  total_reviews: number | null;
  verified: boolean | null;
  stripe_onboarding_status: string;
  stripe_payouts_enabled: boolean;
  stripe_charges_enabled: boolean;
  stripe_disabled_reason: string | null;
  onboarding_complete: boolean;
  created_at: string | null;
  verification_status: string | null;
  admin_notes: string | null;
  interview_completed: boolean;
  completed_jobs: number;
}

interface ProviderDocument {
  id: string;
  doc_type: string | null;
  file_url: string | null;
  verification_status: string | null;
}

interface ProviderJob {
  id: string;
  title: string;
  status: string | null;
  category: string;
  created_at: string | null;
  client_name: string | null;
}

const DOC_TYPE_LABELS: Record<string, string> = {
  ine_front: 'INE Frente',
  id_front: 'INE Frente',
  id_card: 'INE/ID',
  ine_back: 'INE Reverso',
  id_back: 'INE Reverso',
  selfie: 'Selfie',
  face_photo: 'Foto de Rostro',
  face: 'Foto de Rostro',
  selfie_with_id: 'Selfie con INE',
  selfie_with_ine: 'Selfie con INE',
  proof_of_address: 'Comprobante de Domicilio',
  comprobante_domicilio: 'Comprobante de Domicilio',
  criminal_record: 'Carta de Antecedentes',
};

const STATUS_BADGES: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  verified: { label: 'Verificado', variant: 'default' },
  pending: { label: 'Pendiente', variant: 'secondary' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
};

const AdminProvidersPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');

  // Detail dialog state
  const [selectedProvider, setSelectedProvider] = useState<ProviderRow | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [documents, setDocuments] = useState<ProviderDocument[]>([]);
  const [jobs, setJobs] = useState<ProviderJob[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [revokeNotes, setRevokeNotes] = useState('');

  const fetchProviders = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch providers + users + provider_details
      const { data: providerData, error: pErr } = await supabase
        .from('providers')
        .select('user_id, display_name, skills, zone_served, rating, total_reviews, verified, stripe_onboarding_status, stripe_payouts_enabled, stripe_charges_enabled, stripe_disabled_reason, onboarding_complete, created_at')
        .order('created_at', { ascending: false });

      if (pErr) throw pErr;

      const rows: ProviderRow[] = await Promise.all(
        (providerData || []).map(async (p) => {
          const [userRes, detailRes, jobCountRes] = await Promise.all([
            supabase.from('users').select('full_name, email, phone').eq('id', p.user_id).maybeSingle(),
            supabase.from('provider_details').select('verification_status, admin_notes, interview_completed').eq('user_id', p.user_id).maybeSingle(),
            supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('provider_id', p.user_id).eq('status', 'completed'),
          ]);

          return {
            ...p,
            full_name: userRes.data?.full_name ?? null,
            email: userRes.data?.email ?? null,
            phone: userRes.data?.phone ?? null,
            verification_status: detailRes.data?.verification_status ?? 'pending',
            admin_notes: detailRes.data?.admin_notes ?? null,
            interview_completed: detailRes.data?.interview_completed ?? false,
            completed_jobs: jobCountRes.count ?? 0,
          };
        })
      );

      setProviders(rows);
    } catch (err) {
      console.error('Error fetching providers:', err);
      toast.error('Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProviders(); }, [fetchProviders]);

  const openDetail = async (provider: ProviderRow) => {
    setSelectedProvider(provider);
    setDetailOpen(true);
    setDetailLoading(true);
    setRevokeNotes('');

    try {
      const [docsRes, jobsRes] = await Promise.all([
        supabase.from('documents').select('id, doc_type, file_url, verification_status').eq('provider_id', provider.user_id),
        supabase.from('jobs').select('id, title, status, category, created_at, client_id').eq('provider_id', provider.user_id).order('created_at', { ascending: false }).limit(20),
      ]);

      setDocuments(docsRes.data || []);

      // Fetch client names for jobs
      const jobsWithClients: ProviderJob[] = await Promise.all(
        (jobsRes.data || []).map(async (j: any) => {
          const { data: cl } = await supabase.from('users').select('full_name').eq('id', j.client_id).maybeSingle();
          return { id: j.id, title: j.title, status: j.status, category: j.category, created_at: j.created_at, client_name: cl?.full_name ?? null };
        })
      );
      setJobs(jobsWithClients);
    } catch (err) {
      console.error('Error loading provider detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleViewDocument = async (fileUrl: string | null) => {
    if (!fileUrl) { toast.error('Documento no disponible'); return; }
    if (fileUrl.startsWith('http')) { window.open(fileUrl, '_blank'); return; }
    const { data, error } = await supabase.storage.from('user-documents').createSignedUrl(fileUrl.replace('user-documents/', ''), 3600);
    if (error || !data?.signedUrl) { toast.error('No se pudo obtener el documento'); return; }
    window.open(data.signedUrl, '_blank');
  };

  const handleApproveProvider = async () => {
    if (!selectedProvider) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-verify-provider', {
        body: { action: 'approve', provider_user_id: selectedProvider.user_id, admin_notes: revokeNotes || null },
      });
      if (error) {
        let msg = error.message;
        try { const body = await error.context?.json(); if (body?.error) msg = body.error; } catch {}
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      toast.success('Proveedor aprobado exitosamente');
      setDetailOpen(false);
      fetchProviders();
    } catch (err: any) {
      toast.error(err.message || 'Error al aprobar proveedor');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRevokeVerification = async () => {
    if (!selectedProvider) return;
    if (!revokeNotes.trim()) { toast.error('Escribe una razón para revocar la verificación'); return; }
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-verify-provider', {
        body: { action: 'reject', provider_user_id: selectedProvider.user_id, admin_notes: revokeNotes },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      // Notify provider
      await supabase.from('notifications').insert({
        user_id: selectedProvider.user_id,
        type: 'verification_revoked',
        title: 'Verificación revocada',
        message: `Tu verificación ha sido revocada. Razón: ${revokeNotes}`,
        link: '/provider-portal/verification',
      }).then(() => {/* best effort */});

      toast.success('Verificación revocada');
      setDetailOpen(false);
      fetchProviders();
    } catch (err: any) {
      toast.error(err.message || 'Error al revocar verificación');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedProvider || !user) return;
    // Create or navigate to support thread
    navigate(`/admin/support?provider=${selectedProvider.user_id}`);
  };

  // Filtering
  const filtered = providers.filter((p) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      p.full_name?.toLowerCase().includes(term) ||
      p.email?.toLowerCase().includes(term) ||
      p.display_name?.toLowerCase().includes(term);

    if (activeTab === 'all') return matchesSearch;
    if (activeTab === 'verified') return matchesSearch && p.verification_status === 'verified';
    if (activeTab === 'pending') return matchesSearch && p.verification_status === 'pending';
    if (activeTab === 'rejected') return matchesSearch && p.verification_status === 'rejected';
    if (activeTab === 'stripe_pending') return matchesSearch && p.stripe_onboarding_status !== 'complete';
    return matchesSearch;
  });

  const getVerificationBadge = (status: string | null) => {
    const s = STATUS_BADGES[status || 'pending'] || STATUS_BADGES.pending;
    return <Badge variant={s.variant}>{s.label}</Badge>;
  };

  const getStripeBadge = (status: string) => {
    if (status === 'complete') return <Badge variant="default">Completo</Badge>;
    if (status === 'pending') return <Badge variant="secondary">Pendiente</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/admin')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold">Gestión de Proveedores</h1>
            <p className="text-xs sm:text-sm text-muted-foreground">{providers.length} proveedores registrados</p>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-4">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex-wrap h-auto gap-1">
            <TabsTrigger value="all">Todos ({providers.length})</TabsTrigger>
            <TabsTrigger value="verified">Verificados ({providers.filter(p => p.verification_status === 'verified').length})</TabsTrigger>
            <TabsTrigger value="pending">Pendientes ({providers.filter(p => p.verification_status === 'pending').length})</TabsTrigger>
            <TabsTrigger value="rejected">Rechazados ({providers.filter(p => p.verification_status === 'rejected').length})</TabsTrigger>
            <TabsTrigger value="stripe_pending">Stripe Pendiente ({providers.filter(p => p.stripe_onboarding_status !== 'complete').length})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <Card>
              <CardContent className="p-0">
                {/* Desktop table */}
                <div className="hidden md:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Nombre</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Verificación</TableHead>
                        <TableHead>Stripe</TableHead>
                        <TableHead>Trabajos</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Registro</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.length === 0 ? (
                        <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No se encontraron proveedores</TableCell></TableRow>
                      ) : filtered.map((p) => (
                        <TableRow key={p.user_id} className="cursor-pointer hover:bg-muted/50" onClick={() => openDetail(p)}>
                          <TableCell className="font-medium">{p.display_name || p.full_name || '—'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.email || '—'}</TableCell>
                          <TableCell>{getVerificationBadge(p.verification_status)}</TableCell>
                          <TableCell>{getStripeBadge(p.stripe_onboarding_status)}</TableCell>
                          <TableCell>{p.completed_jobs}</TableCell>
                          <TableCell>
                            <span className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              {p.rating?.toFixed(1) ?? '—'}
                              <span className="text-xs text-muted-foreground">({p.total_reviews ?? 0})</span>
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {p.created_at ? format(new Date(p.created_at), 'dd MMM yyyy', { locale: es }) : '—'}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm"><Eye className="h-4 w-4" /></Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y">
                  {filtered.length === 0 ? (
                    <p className="text-center py-8 text-muted-foreground">No se encontraron proveedores</p>
                  ) : filtered.map((p) => (
                    <div key={p.user_id} className="p-4 space-y-2 cursor-pointer active:bg-muted/50" onClick={() => openDetail(p)}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{p.display_name || p.full_name || '—'}</span>
                        {getVerificationBadge(p.verification_status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{p.email}</p>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{p.rating?.toFixed(1) ?? '—'}</span>
                        <span>{p.completed_jobs} trabajos</span>
                        <span>Stripe: {p.stripe_onboarding_status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedProvider?.display_name || selectedProvider?.full_name || 'Proveedor'}</DialogTitle>
          </DialogHeader>

          {detailLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : selectedProvider && (
            <div className="space-y-6">
              {/* Profile */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Perfil</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" />{selectedProvider.email || '—'}</div>
                  <div className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" />{selectedProvider.phone || '—'}</div>
                  <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-muted-foreground" />{selectedProvider.zone_served || '—'}</div>
                  <div className="flex items-center gap-2"><Wrench className="h-4 w-4 text-muted-foreground" />{selectedProvider.skills?.join(', ') || '—'}</div>
                </CardContent>
              </Card>

              {/* Verification & Documents */}
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Verificación</CardTitle>
                    {getVerificationBadge(selectedProvider.verification_status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Entrevista:</span>
                    <Badge variant={selectedProvider.interview_completed ? 'default' : 'outline'}>
                      {selectedProvider.interview_completed ? 'Completada' : 'Pendiente'}
                    </Badge>
                  </div>
                  {selectedProvider.admin_notes && (
                    <p className="text-sm text-muted-foreground bg-muted p-2 rounded">Notas: {selectedProvider.admin_notes}</p>
                  )}

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Documentos ({documents.length})</p>
                    {documents.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin documentos subidos</p>
                    ) : documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-2 border rounded text-sm">
                        <div className="flex items-center gap-2">
                          <span>{DOC_TYPE_LABELS[doc.doc_type || ''] || doc.doc_type || 'Desconocido'}</span>
                          <Badge variant={doc.verification_status === 'verified' ? 'default' : doc.verification_status === 'rejected' ? 'destructive' : 'secondary'} className="text-xs">
                            {doc.verification_status || 'pending'}
                          </Badge>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => handleViewDocument(doc.file_url)}>
                          <ExternalLink className="h-3 w-3 mr-1" /> Ver
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Stripe */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Stripe Connect</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Onboarding:</span>
                  {getStripeBadge(selectedProvider.stripe_onboarding_status)}
                  <span className="text-muted-foreground">Pagos habilitados:</span>
                  <Badge variant={selectedProvider.stripe_payouts_enabled ? 'default' : 'outline'}>{selectedProvider.stripe_payouts_enabled ? 'Sí' : 'No'}</Badge>
                  <span className="text-muted-foreground">Cargos habilitados:</span>
                  <Badge variant={selectedProvider.stripe_charges_enabled ? 'default' : 'outline'}>{selectedProvider.stripe_charges_enabled ? 'Sí' : 'No'}</Badge>
                  {selectedProvider.stripe_disabled_reason && (
                    <>
                      <span className="text-muted-foreground">Razón deshabilitado:</span>
                      <span className="text-destructive">{selectedProvider.stripe_disabled_reason}</span>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Job History */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Historial de Trabajos ({jobs.length})</CardTitle></CardHeader>
                <CardContent>
                  {jobs.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin trabajos</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {jobs.map((j) => (
                        <div key={j.id} className="flex items-center justify-between text-sm border-b pb-2">
                          <div>
                            <p className="font-medium">{j.title}</p>
                            <p className="text-xs text-muted-foreground">{j.client_name || 'Cliente'} · {j.category}</p>
                          </div>
                          <div className="text-right">
                            <Badge variant={j.status === 'completed' ? 'default' : j.status === 'cancelled' ? 'destructive' : 'secondary'} className="text-xs">{j.status}</Badge>
                            {j.created_at && <p className="text-xs text-muted-foreground mt-1">{format(new Date(j.created_at), 'dd/MM/yy', { locale: es })}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Actions */}
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Acciones</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    placeholder="Notas de administrador..."
                    value={revokeNotes}
                    onChange={(e) => setRevokeNotes(e.target.value)}
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    {selectedProvider.verification_status !== 'verified' && (
                      <Button onClick={handleApproveProvider} disabled={actionLoading} className="gap-1">
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                        Aprobar Proveedor
                      </Button>
                    )}
                    {selectedProvider.verification_status === 'verified' && (
                      <Button variant="destructive" onClick={handleRevokeVerification} disabled={actionLoading} className="gap-1">
                        {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldX className="h-4 w-4" />}
                        Revocar Verificación
                      </Button>
                    )}
                    <Button variant="outline" onClick={handleSendMessage} className="gap-1">
                      <MessageSquare className="h-4 w-4" /> Enviar Mensaje
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProvidersPage;
