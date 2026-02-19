import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  useJobStatusTransition,
  JobStatus,
  JOB_STATUS_LABELS,
  JOB_STATUS_CONFIG,
  ACTIVE_JOB_STATUSES,
} from "@/hooks/useJobStatusTransition";
import { InvoiceCard } from "@/components/provider-portal/InvoiceCard";
import { CancellationSummary } from "@/components/provider-portal/CancellationSummary";
import { RatingDialog } from "@/components/provider-portal/RatingDialog";
import { useJobRating } from "@/hooks/useJobRating";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Navigation,
  MapPin,
  ClipboardCheck,
  FileText,
  Play,
  CheckCircle,
  XCircle,
  Send,
  Loader2,
  Calendar,
  Clock,
  DollarSign,
  User,
  
  MessageSquare,
  AlertTriangle,
  Star,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface JobDetail {
  id: string;
  title: string;
  description: string | null;
  category: string;
  status: string;
  location: string | null;
  scheduled_at: string | null;
  rate: number;
  total_amount: number | null;
  client_id: string;
  provider_id: string | null;
  created_at: string;
  visit_fee_amount: number | null;
  visit_fee_paid: boolean | null;
  provider_confirmed_visit: boolean | null;
  client_confirmed_visit: boolean | null;
  photos: string[] | null;
  problem: string | null;
  service_type: string | null;
  amount_booking_fee: number | null;
}

interface ChatMessage {
  id: string;
  message_text: string;
  sender_id: string;
  receiver_id: string;
  is_system_message: boolean;
  system_event_type: string | null;
  created_at: string;
}

interface ClientInfo {
  full_name: string | null;
  phone: string | null;
}

// Status timeline order
const STATUS_ORDER: JobStatus[] = [
  'accepted', 'confirmed', 'en_route', 'on_site', 'quoted', 'in_progress', 'completed'
];

// Actions config per status (provider-side only)
const STATUS_ACTIONS: Record<string, { label: string; nextStatus: JobStatus; icon: React.ComponentType<any>; variant?: string }[]> = {
  accepted:    [{ label: 'Esperando confirmación del cliente', nextStatus: 'confirmed', icon: ClipboardCheck }],
  confirmed:   [{ label: 'Marcar en camino', nextStatus: 'en_route', icon: Navigation }],
  en_route:    [{ label: 'Llegué al sitio', nextStatus: 'on_site', icon: MapPin }],
  // on_site: invoice creation handled by InvoiceCard
  // quoted: waiting for client acceptance → in_progress handled by InvoiceCard
  in_progress: [{ label: 'Marcar trabajo como terminado', nextStatus: 'completed', icon: CheckCircle }],
};

const JobTimelinePage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { transitionStatus } = useJobStatusTransition();
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [job, setJob] = useState<JobDetail | null>(null);
  const [client, setClient] = useState<ClientInfo | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [invoice, setInvoice] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'chat'>('timeline');
  const [showCancelSummary, setShowCancelSummary] = useState(false);
  const [ratingDismissed, setRatingDismissed] = useState(false);
  const [chatDebug, setChatDebug] = useState<{ selectError: string | null; insertError: string | null; realtimeStatus: string }>({ selectError: null, insertError: null, realtimeStatus: 'connecting' });
  const [showDebug, setShowDebug] = useState(false);

  // Rating hook - must be called unconditionally (Rules of Hooks)
  const { canRate, hasRated, myReview, refetch: refetchRating } = useJobRating(jobId, job?.status ?? undefined);


  // Fetch job + client + messages
  const fetchAll = async () => {
    if (!jobId || !user) return;
    setLoading(true);

    const { data: jobData } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobData) {
      setJob(jobData as JobDetail);

      // Fetch client
      const { data: clientData } = await supabase
        .from('users')
        .select('full_name, phone')
        .eq('id', jobData.client_id)
        .maybeSingle();
      setClient(clientData);

      // Fetch invoice for this job
      const { data: invoiceData } = await supabase
        .from('invoices')
        .select('*')
        .eq('job_id', jobId)
        .not('status', 'eq', 'cancelled')
        .maybeSingle();

      if (invoiceData) {
        // Fetch invoice items
        const { data: items } = await supabase
          .from('invoice_items')
          .select('*')
          .eq('invoice_id', invoiceData.id)
          .order('created_at', { ascending: true });

        setInvoice({ ...invoiceData, items: items || [] });
      } else {
        setInvoice(null);
      }
    }

    // Fetch messages
    const { data: msgs, error: msgsError } = await supabase
      .from('messages')
      .select('id, message_text, sender_id, receiver_id, is_system_message, system_event_type, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

    if (msgsError) {
      console.error('[Chat] SELECT error:', msgsError);
      setChatDebug(prev => ({ ...prev, selectError: msgsError.message }));
    } else {
      setChatDebug(prev => ({ ...prev, selectError: null }));
    }
    setMessages((msgs || []) as ChatMessage[]);

    // Mark unread messages as read
    if (user) {
      await supabase
        .from('messages')
        .update({ read: true })
        .eq('job_id', jobId)
        .eq('receiver_id', user.id)
        .eq('read', false);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, [jobId, user]);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTab]);

  // Realtime subscription for messages
  useEffect(() => {
    if (!jobId) return;
    const channel = supabase
      .channel(`job-chat-${jobId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `job_id=eq.${jobId}`,
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        setMessages(prev => [...prev, newMsg]);
        // Mark as read if we're viewing
        if (user && newMsg.receiver_id === user.id) {
          supabase.from('messages').update({ read: true }).eq('id', newMsg.id);
        }
      })
      .subscribe((status) => {
        console.log('[Chat] Realtime status:', status);
        setChatDebug(prev => ({ ...prev, realtimeStatus: status }));
      });

    // Also listen for job status changes
    const jobChannel = supabase
      .channel(`job-status-${jobId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'jobs',
        filter: `id=eq.${jobId}`,
      }, (payload) => {
        setJob(prev => prev ? { ...prev, ...payload.new } as JobDetail : null);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invoices',
        filter: `job_id=eq.${jobId}`,
      }, () => {
        // Re-fetch all to get updated invoice + items
        fetchAll();
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      jobChannel.unsubscribe();
    };
  }, [jobId, user]);

  const handleTransition = async (nextStatus: JobStatus) => {
    if (!job || !user) return;

    // "confirmed" is a client action - provider can't do it
    if (nextStatus === 'confirmed') {
      toast.info('El cliente debe confirmar este trabajo');
      return;
    }

    // Double confirmation for completion: provider marks as "terminado"
    if (nextStatus === 'completed') {
      setTransitioning(true);
      // Set provider_confirmed_visit AND status to completed
      const { data: updateResult, error: updateError } = await supabase
        .from('jobs')
        .update({ 
          provider_confirmed_visit: true, 
          status: 'completed',
          updated_at: new Date().toISOString() 
        })
        .eq('id', job.id)
        .eq('provider_id', user.id)
        .select('id, status');

      console.log('[JobTimelinePage] Completion update:', { updateResult, updateError });

      if (updateError) {
        toast.error('Error al completar', { description: updateError.message });
        setTransitioning(false);
        return;
      }

      if (!updateResult || updateResult.length === 0) {
        toast.error('No se pudo completar el trabajo', { description: 'Verifica que el trabajo esté asignado a ti.' });
        setTransitioning(false);
        return;
      }

      // Send system message
      await supabase.from('messages').insert({
        job_id: job.id,
        sender_id: user.id,
        receiver_id: job.client_id,
        message_text: '🎉 El trabajo fue completado correctamente',
        is_system_message: true,
        system_event_type: 'completed',
        read: false,
      });

      toast.success('¡Trabajo completado!');
      setTransitioning(false);
      await fetchAll();
      return;
    }

    setTransitioning(true);
    const result = await transitionStatus(job.id, nextStatus, job.client_id);
    setTransitioning(false);

    if (result.success) {
      toast.success(`Estado actualizado: ${JOB_STATUS_LABELS[nextStatus]}`);
      await fetchAll();
    } else {
      toast.error(result.error || 'Error al actualizar estado');
    }
  };

  const handleCancel = async () => {
    if (!job) return;
    if (!showCancelSummary) {
      setShowCancelSummary(true);
      return;
    }
    setTransitioning(true);

    // Calculate compensation and add to cancel message
    const afterOnSite = ["on_site", "quoted", "in_progress"].includes(job.status);
    const compensation = afterOnSite ? 250 : 0;
    const cancelMsg = compensation > 0
      ? `❌ Trabajo cancelado. El proveedor recibirá $${compensation} MXN por compensación.`
      : '❌ Trabajo cancelado.';

    const result = await transitionStatus(job.id, 'cancelled', job.client_id);
    setTransitioning(false);

    if (result.success) {
      // Send compensation system message (extra detail beyond the default)
      if (compensation > 0) {
        await supabase.from('messages').insert({
          job_id: job.id,
          sender_id: user!.id,
          receiver_id: job.client_id,
          message_text: `💰 Compensación registrada: $${compensation} MXN para el proveedor`,
          is_system_message: true,
          system_event_type: 'cancellation_compensation',
          read: false,
        });
      }
      toast.success('Trabajo cancelado');
      navigate('/provider-portal/jobs');
    } else {
      toast.error(result.error || 'Error al cancelar');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !job || !user) return;
    setSending(true);
    const payload = {
      job_id: job.id,
      sender_id: user.id,
      receiver_id: job.client_id,
      message_text: newMessage.trim(),
      is_system_message: false,
      read: false,
    };
    console.log('[Chat] Sending message:', { jobId: job.id, senderId: user.id, receiverId: job.client_id });
    const { error: insertError } = await supabase.from('messages').insert(payload);
    if (insertError) {
      console.error('[Chat] INSERT error:', insertError);
      setChatDebug(prev => ({ ...prev, insertError: insertError.message }));
      toast.error('Error al enviar mensaje', { description: insertError.message });
      setSending(false);
      return;
    }
    setChatDebug(prev => ({ ...prev, insertError: null }));
    setNewMessage("");
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
        <p className="text-foreground font-medium">Trabajo no encontrado</p>
        <p className="text-xs text-muted-foreground font-mono">ID: {jobId}</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/provider-portal/jobs')}>
          Volver a trabajos
        </Button>
      </div>
    );
  }

  const currentStatus = job.status as JobStatus;
  const statusConfig = JOB_STATUS_CONFIG[currentStatus] || JOB_STATUS_CONFIG.active;
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  const isTerminal = currentStatus === 'completed' || currentStatus === 'cancelled';
  const actions = isTerminal ? [] : (STATUS_ACTIONS[currentStatus] || []);


  return (
    <div className="pb-24 min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-background border-b border-border/50 px-4 py-3 flex items-center gap-3 sticky top-0 z-10">
        <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={() => navigate('/provider-portal/jobs')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{job.title}</h1>
          <p className="text-[11px] text-muted-foreground">{job.category}</p>
        </div>
        <Badge className={cn("text-[10px] px-2 py-0.5 border", statusConfig.bg, statusConfig.text, statusConfig.border)}>
          {JOB_STATUS_LABELS[currentStatus] || currentStatus}
        </Badge>
      </div>

      {/* Tab Switcher */}
      <div className="px-4 pt-3 pb-1 flex gap-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-medium transition-colors",
            activeTab === 'timeline'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          Seguimiento
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={cn(
            "flex-1 py-2 rounded-lg text-xs font-medium transition-colors relative",
            activeTab === 'chat'
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
          )}
        >
          Chat
          {messages.filter(m => !m.is_system_message && m.sender_id !== user?.id).length > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-destructive" />
          )}
        </button>
      </div>

      {activeTab === 'timeline' ? (
        <div className="px-4 pt-3 space-y-4">
          {/* Job Info Card */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              {/* Job ID */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded">ID: {job.id.slice(0, 8)}</span>
                <span>•</span>
                <span>{job.category}</span>
                {job.service_type && <><span>•</span><span>{job.service_type}</span></>}
              </div>

              {client && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{client.full_name || 'Cliente'}</span>
                  </div>
                </div>
              )}
              {job.scheduled_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(job.scheduled_at), "d 'de' MMMM, HH:mm", { locale: es })}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{job.location}</span>
                </div>
              )}
              {job.description && (
                <p className="text-xs text-muted-foreground">{job.description}</p>
              )}
              {job.problem && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium">Problema:</span> {job.problem}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Breakdown Card */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-2">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Desglose de pago
              </h3>
              {(() => {
                const visitFee = job.visit_fee_amount || 350;
                const chambyFee = job.amount_booking_fee || Math.round(visitFee * 0.2857); // ~100 of 350
                const providerPayout = visitFee - chambyFee;
                return (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Total cobrado al cliente</span>
                      <span className="font-medium">${String(visitFee ?? 0)} MXN</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Comisión Chamby</span>
                      <span className="text-destructive">-${String(chambyFee ?? 0)} MXN</span>
                    </div>
                    <div className="border-t border-border/50 pt-1.5 flex justify-between text-sm">
                      <span className="font-semibold text-foreground">Pago al proveedor</span>
                      <span className="font-bold text-primary">${String(providerPayout ?? 0)} MXN</span>
                    </div>
                    {job.visit_fee_paid && (
                      <Badge variant="outline" className="bg-green-500/10 text-green-700 border-green-500/20 text-xs mt-1">
                        Pago confirmado
                      </Badge>
                    )}
                  </div>
                );
              })()}
            </CardContent>
          </Card>

          {/* Job Photos */}
          {job.photos && job.photos.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-sm font-semibold text-foreground">Fotos del trabajo</h3>
                <div className="grid grid-cols-2 gap-2">
                  {job.photos.map((photoUrl, i) => (
                    <a key={i} href={photoUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={photoUrl}
                        alt={`Foto ${i + 1}`}
                        className="rounded-lg w-full h-32 object-cover border border-border/30"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Map Card — safe fallback, no JS embed */}
          <Card className="border-border/50 overflow-hidden">
            <CardContent className="p-0">
              <div className="p-3 border-b border-border/30">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Ubicación del trabajo
                </h3>
              </div>
              {job.location ? (
                <>
                  <div className="p-4 space-y-2">
                    <p className="text-sm text-foreground">{job.location}</p>
                  </div>
                  <div className="p-3 border-t border-border/30 grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location!)}`, '_blank');
                      }}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Iniciar ruta
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location!)}`, '_blank');
                      }}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Abrir en Maps
                    </Button>
                  </div>
                </>
              ) : (
                <div className="p-6 text-center">
                  <MapPin className="w-6 h-6 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Ubicación no disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline Steps */}
          <div className="relative pl-6">
            {STATUS_ORDER.map((step, i) => {
              const isPast = currentIndex >= i;
              const isCurrent = currentStatus === step;
              const stepConfig = JOB_STATUS_CONFIG[step];

              return (
                <div key={step} className="relative pb-6 last:pb-0">
                  {/* Vertical line */}
                  {i < STATUS_ORDER.length - 1 && (
                    <div className={cn(
                      "absolute left-[-14px] top-6 w-0.5 h-full",
                      isPast ? "bg-primary/40" : "bg-border"
                    )} />
                  )}
                  {/* Dot */}
                  <div className={cn(
                    "absolute left-[-18px] top-1 w-2.5 h-2.5 rounded-full border-2",
                    isCurrent
                      ? "bg-primary border-primary ring-4 ring-primary/20"
                      : isPast
                        ? "bg-primary/60 border-primary/60"
                        : "bg-muted border-border"
                  )} />
                  {/* Label */}
                  <div className={cn(
                    "text-sm",
                    isCurrent ? "font-semibold text-foreground" : isPast ? "text-foreground/70" : "text-muted-foreground/50"
                  )}>
                    {JOB_STATUS_LABELS[step]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Invoice Card — shows on on_site, quoted, in_progress */}
          {(currentStatus === 'on_site' || currentStatus === 'quoted' || currentStatus === 'in_progress') && (
            <InvoiceCard
              jobId={job.id}
              clientId={job.client_id}
              jobStatus={currentStatus}
              invoice={invoice}
              onInvoiceCreated={fetchAll}
              isProvider={true}
            />
          )}

          {/* Waiting for client to accept invoice */}
          {currentStatus === 'quoted' && invoice?.status === 'sent' && (
            <Card className="border-border bg-muted/50">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Esperando aprobación del cliente</p>
                <p className="text-xs text-muted-foreground mt-1">El cliente debe aceptar la factura para continuar</p>
              </CardContent>
            </Card>
          )}

          {/* Double confirmation state */}
          {currentStatus === 'in_progress' && job.provider_confirmed_visit && !job.client_confirmed_visit && (
            <Card className="border-border bg-muted/50">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Esperando confirmación del cliente</p>
                <p className="text-xs text-muted-foreground mt-1">El cliente debe confirmar que el trabajo fue completado</p>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          {!isTerminal && actions.length > 0 && (
            <div className="space-y-2">
              {actions.map((action) => {
                const Icon = action.icon;
                const isClientAction = action.nextStatus === 'confirmed';
                // Hide "completed" button if provider already confirmed
                if (action.nextStatus === 'completed' && job.provider_confirmed_visit) return null;
                return (
                  <Button
                    key={action.nextStatus}
                    onClick={() => handleTransition(action.nextStatus)}
                    disabled={transitioning || isClientAction}
                    className={cn(
                      "w-full gap-2",
                      isClientAction && "opacity-60"
                    )}
                    variant={isClientAction ? "outline" : "default"}
                  >
                    {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
                    {action.label}
                  </Button>
                );
              })}
            </div>
          )}

          {/* Cancel section */}
          {!isTerminal && (
            <div className="space-y-2">
              {showCancelSummary && (
                <CancellationSummary
                  jobStatus={currentStatus}
                  visitFeeAmount={job.visit_fee_amount || 350}
                />
              )}
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive gap-2 text-sm"
                onClick={handleCancel}
                disabled={transitioning}
              >
                {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                {showCancelSummary ? 'Confirmar cancelación' : 'Cancelar trabajo'}
              </Button>
              {showCancelSummary && (
                <Button
                  variant="ghost"
                  className="w-full text-muted-foreground text-xs"
                  onClick={() => setShowCancelSummary(false)}
                >
                  Volver
                </Button>
              )}
            </div>
          )}

          {/* Terminal state message */}
          {isTerminal && (
            <Card className={cn(
              "border",
              currentStatus === 'completed' ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/5"
            )}>
              <CardContent className="p-4 text-center">
                {currentStatus === 'completed' ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Trabajo completado</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
                    <p className="text-sm font-medium text-foreground">Trabajo cancelado</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {/* Invoice summary on completed */}
          {isTerminal && invoice && (
            <InvoiceCard
              jobId={job.id}
              clientId={job.client_id}
              jobStatus={currentStatus}
              invoice={invoice}
              onInvoiceCreated={fetchAll}
              isProvider={true}
            />
          )}

          {/* Rating section — only after successful completion */}
          {currentStatus === 'completed' && canRate && !ratingDismissed && (
            <RatingDialog
              jobId={job.id}
              otherUserId={job.client_id}
              reviewerRole="provider"
              onComplete={() => {
                refetchRating();
                fetchAll();
              }}
              onDismiss={() => setRatingDismissed(true)}
            />
          )}

          {/* Already rated confirmation */}
          {currentStatus === 'completed' && hasRated && myReview && (
            <Card className="border-border/50">
              <CardContent className="p-4 text-center">
                <div className="flex justify-center gap-0.5 mb-2">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={cn(
                        "w-5 h-5",
                        s <= myReview.rating
                          ? "fill-amber-400 text-amber-400"
                          : "text-muted-foreground/20"
                      )}
                    />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Ya calificaste este trabajo
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Chat Tab */
        <div className="flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
          {/* Debug Panel */}
          <div className="px-4 pt-2">
            <button
              onClick={() => setShowDebug(d => !d)}
              className="text-[10px] text-muted-foreground/60 hover:text-muted-foreground font-mono"
            >
              {showDebug ? '▼' : '▶'} Debug
            </button>
            {showDebug && (
              <div className="mt-1 p-2 bg-muted/50 rounded border border-border/30 text-[10px] font-mono space-y-0.5">
                <p>jobId: {jobId}</p>
                <p>userId: {user?.id}</p>
                <p>receiverId: {job?.client_id || 'N/A'}</p>
                <p>msgs loaded: {messages.length}</p>
                <p>realtime: {chatDebug.realtimeStatus}</p>
                {chatDebug.selectError && <p className="text-destructive">SELECT err: {chatDebug.selectError}</p>}
                {chatDebug.insertError && <p className="text-destructive">INSERT err: {chatDebug.insertError}</p>}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Sin mensajes aún</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMe = msg.sender_id === user?.id;
                if (msg.is_system_message) {
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-center"
                    >
                      <div className="bg-muted/60 border border-border/30 rounded-full px-3 py-1 text-[11px] text-muted-foreground text-center max-w-[85%]">
                        {msg.message_text}
                      </div>
                    </motion.div>
                  );
                }
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn("flex", isMe ? "justify-end" : "justify-start")}
                  >
                    <div className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                      isMe
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-muted text-foreground rounded-bl-md"
                    )}>
                      <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                      <p className={cn("text-[10px] mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                        {format(new Date(msg.created_at), "HH:mm")}
                      </p>
                    </div>
                  </motion.div>
                );
              })
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Chat Input */}
          <div className="border-t border-border/50 px-4 py-3 flex items-center gap-2">
            <Input
              placeholder="Escribe un mensaje..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 h-10 text-sm"
              disabled={sending || isTerminal}
            />
            <Button
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleSendMessage}
              disabled={sending || !newMessage.trim() || isTerminal}
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobTimelinePage;
