import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Receipt, CheckCircle as CheckCircleInvoice, XCircle as XCircleInvoice, RefreshCw, Clock as ClockInvoice } from "lucide-react";
import { ProviderQuoteForm } from "@/components/quotes/ProviderQuoteForm";
import { ProviderStatusSections } from "@/components/provider-portal/ProviderStatusSections";
import { supabase } from "@/integrations/supabase/client";
import { DisputeModal } from "@/components/DisputeModal";
import { useAuth } from "@/contexts/AuthContext";
import {
  useJobStatusTransition,
} from "@/hooks/useJobStatusTransition";
import {
  type JobStatus,
  JOB_STATUS_CONFIG,
  PROVIDER_ACTIVE_STATES as ACTIVE_JOB_STATUSES,
  getStatusLabel,
} from "@/utils/jobStateMachine";
import { InvoiceCard } from "@/components/provider-portal/InvoiceCard";
import { JobInvoiceSection } from "@/components/JobInvoiceSection";
import { CancellationSummary } from "@/components/provider-portal/CancellationSummary";
import { RescheduleDialog } from "@/components/RescheduleDialog";
import { DisputeStatusCard } from "@/components/DisputeStatusCard";
import { RatingDialog, isDismissed } from "@/components/provider-portal/RatingDialog";
import { useJobRating } from "@/hooks/useJobRating";
import { JobTimelineSkeleton } from "@/components/skeletons";
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
import { VISIT_DISPLAY, VAT_LABEL } from "@/utils/pricingConfig";

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
  completion_status: string | null;
  completion_marked_at: string | null;
  completion_confirmed_at: string | null;
  has_open_dispute: boolean | null;
  dispute_status: string | null;
  followup_scheduled_at: string | null;
  followup_status: string | null;
  // Reschedule request
  reschedule_requested_by: string | null;
  reschedule_requested_at: string | null;
  reschedule_proposed_datetime: string | null;
  reschedule_agreed: boolean | null;
  // Geolocation check-in
  job_address_lat: number | null;
  job_address_lng: number | null;
  arrived_lat: number | null;
  arrived_lng: number | null;
  arrived_at: string | null;
  geolocation_mismatch: boolean | null;
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
  'assigned', 'on_site', 'quoted', 'quote_accepted', 'job_paid', 'in_progress', 'provider_done', 'completed'
];

// Actions config per status (provider-side only)
const STATUS_ACTIONS: Record<string, { label: string; nextStatus: JobStatus; icon: React.ComponentType<any>; variant?: string }[]> = {
  assigned:    [{ label: 'Llegué al sitio', nextStatus: 'on_site', icon: MapPin }],
  // on_site: invoice creation handled by InvoiceCard
  // quoted: waiting for client acceptance
  in_progress: [{ label: 'Marcar trabajo como terminado', nextStatus: 'provider_done', icon: CheckCircle }],
};

const JobTimelinePage = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  useJobStatusTransition(); // kept for hook side-effects
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
  const [cancelStep, setCancelStep] = useState<'idle' | 'reason' | 'confirm'>('idle');
  const [cancelReason, setCancelReason] = useState('');
  const [cancelIsLate, setCancelIsLate] = useState(false);
  const [ratingDismissed, setRatingDismissed] = useState(() => isDismissed(jobId || "", "provider"));
  const [chatDebug, setChatDebug] = useState<{ selectError: string | null; insertError: string | null; realtimeStatus: string }>({ selectError: null, insertError: null, realtimeStatus: 'connecting' });
  const [showDebug, setShowDebug] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);
  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [respondingReschedule, setRespondingReschedule] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [geoModal, setGeoModal] = useState<{ distance: number; coords: { lat: number; lng: number } } | null>(null);

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
        const oldStatus = (payload.old as any)?.status;
        const newStatus = (payload.new as any)?.status;
        if (oldStatus && newStatus && oldStatus !== newStatus) {
          const clientTriggeredEvents: Record<string, string> = {
            quote_accepted: '✅ El cliente aceptó tu cotización',
            job_paid: '💳 El cliente pagó — ¡puedes comenzar el trabajo!',
            completed: '🎉 Trabajo confirmado como completado',
          };
          const msg = clientTriggeredEvents[newStatus];
          if (msg) toast.success(msg, { duration: 6000 });
        }
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

  const handleTransition = async (nextStatus: string) => {
    if (!job || !user) return;

    setTransitioning(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('transition-job-status', {
        body: { job_id: job.id, new_status: nextStatus },
      });

      if (fnError || data?.error) {
        toast.error(data?.error || fnError?.message || 'Error al actualizar estado');
        return;
      }

      toast.success(`Estado actualizado: ${getStatusLabel(nextStatus)}`);
      await fetchAll();
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado');
    } finally {
      setTransitioning(false);
    }
  };

  // ── Geolocation check-in ────────────────────────────────────────────────────
  const haversineMeters = (lat1: number, lng1: number, lat2: number, lng2: number) => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const saveCheckInCoords = async (lat: number, lng: number, mismatch: boolean) => {
    await supabase.from("jobs").update({
      arrived_lat: lat,
      arrived_lng: lng,
      arrived_at: new Date().toISOString(),
      ...(mismatch ? { geolocation_mismatch: true } : {}),
    }).eq("id", job!.id);
  };

  const completeCheckIn = async (coords: { lat: number; lng: number } | null, mismatch = false) => {
    await handleTransition("on_site");
    if (coords) await saveCheckInCoords(coords.lat, coords.lng, mismatch);
  };

  const handleCheckIn = () => {
    if (!job) return;
    setCheckingIn(true);

    if (!navigator.geolocation) {
      toast.info("No pudimos verificar tu ubicación. El check-in se registrará sin verificación GPS.");
      handleTransition("on_site").finally(() => setCheckingIn(false));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };

        if (job.job_address_lat != null && job.job_address_lng != null) {
          const dist = Math.round(haversineMeters(coords.lat, coords.lng, job.job_address_lat, job.job_address_lng));
          if (dist > 300) {
            setGeoModal({ distance: dist, coords });
            setCheckingIn(false);
            return;
          }
        }

        await completeCheckIn(coords, false);
        setCheckingIn(false);
      },
      async () => {
        toast.info("No pudimos verificar tu ubicación. El check-in se registrará sin verificación GPS.");
        await handleTransition("on_site");
        setCheckingIn(false);
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  };

  const confirmCheckInDespiteMismatch = async () => {
    if (!geoModal) return;
    setGeoModal(null);
    setCheckingIn(true);
    await completeCheckIn(geoModal.coords, true);
    setCheckingIn(false);
  };

  const handleRescheduleResponse = async (accept: boolean) => {
    if (!job) return;
    setRespondingReschedule(true);
    try {
      if (accept) {
        await supabase.from("jobs").update({
          scheduled_at: job.reschedule_proposed_datetime,
          reschedule_agreed: true,
          reschedule_requested_by: null,
          reschedule_requested_at: null,
          reschedule_proposed_datetime: null,
        }).eq("id", job.id);

        await supabase.from("notifications").insert({
          user_id: job.client_id,
          type: "reschedule_accepted",
          title: "Reagendamiento aceptado",
          message: "El proveedor aceptó el nuevo horario.",
          link: `/active-jobs`,
          data: { job_id: job.id },
        });
        toast.success("Reagendamiento aceptado. La fecha del trabajo fue actualizada.");
      } else {
        await supabase.from("jobs").update({
          reschedule_requested_by: null,
          reschedule_requested_at: null,
          reschedule_proposed_datetime: null,
          reschedule_agreed: false,
        }).eq("id", job.id);

        await supabase.from("notifications").insert({
          user_id: job.client_id,
          type: "reschedule_rejected",
          title: "Reagendamiento rechazado",
          message: "El proveedor rechazó el cambio de horario. El trabajo continúa en su fecha original.",
          link: `/active-jobs`,
          data: { job_id: job.id },
        });
        toast.success("Reagendamiento rechazado. El trabajo continúa en su fecha original.");
      }
      await fetchAll();
    } catch (err) {
      toast.error("Error al responder la solicitud");
    } finally {
      setRespondingReschedule(false);
    }
  };

  const handleCancel = async () => {
    if (!job) return;

    // Step 1: show reason selector + compute timing
    if (cancelStep === 'idle') {
      const isLate = job.scheduled_at
        ? new Date(job.scheduled_at).getTime() - Date.now() < 2 * 60 * 60 * 1000
        : false;
      setCancelIsLate(isLate);
      setCancelStep('reason');
      return;
    }

    // Step 2: require a reason before proceeding to confirm
    if (cancelStep === 'reason') {
      if (!cancelReason.trim()) {
        toast.error('Por favor selecciona o escribe un motivo de cancelación.');
        return;
      }
      setCancelStep('confirm');
      return;
    }

    // Step 3: confirmed — call cancel-job edge function
    setTransitioning(true);
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('cancel-job', {
        body: { job_id: job.id, cancelled_by: 'provider', cancel_reason: cancelReason },
      });

      if (fnErr || data?.error) {
        toast.error(data?.error || fnErr?.message || 'Error al cancelar');
        return;
      }

      toast.success('Trabajo cancelado');
      navigate('/provider-portal/jobs');
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado');
    } finally {
      setTransitioning(false);
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
    return <JobTimelineSkeleton />;
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
  const isPostPayment = ['job_paid', 'in_progress', 'provider_done'].includes(currentStatus);
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
          {getStatusLabel(currentStatus)}
        </Badge>
      </div>

      {/* Live Status Bar */}
      {!isTerminal && (
        <div className="bg-background border-b border-border/50 px-4 py-2.5">
          <div className="flex items-center gap-0.5 mb-1.5">
            {STATUS_ORDER.map((step, i) => {
              const isPast = currentIndex >= i;
              const isCurrent = currentStatus === step;
              return (
                <div key={step} className={cn(
                  "h-1.5 rounded-full flex-1 transition-all duration-500",
                  isCurrent ? "bg-primary" : isPast ? "bg-primary/50" : "bg-border/50"
                )} />
              );
            })}
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
              </span>
              <span className="text-xs font-medium text-foreground">{getStatusLabel(currentStatus)}</span>
            </div>
            <span className="text-[11px] text-muted-foreground">
              Paso {currentIndex + 1} de {STATUS_ORDER.length}
            </span>
          </div>
        </div>
      )}

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

          {/* ── 1. Header Card: Title, Status, Client ── */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-foreground leading-tight">{job.title}</h2>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <span>{job.category}</span>
                    {job.service_type && <><span>•</span><span>{job.service_type}</span></>}
                    <span>•</span>
                    <span className="font-mono">{job.id.slice(0, 8)}</span>
                  </div>
                </div>
                <Badge className={cn("text-[10px] px-2 py-0.5 border shrink-0", statusConfig.bg, statusConfig.text, statusConfig.border)}>
                  {getStatusLabel(currentStatus)}
                </Badge>
              </div>

              {client && (
                <div className="flex items-center gap-2.5 pt-2 border-t border-border/30">
                  <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{client.full_name || 'Cliente'}</p>
                    {client.phone && (
                      <p className="text-xs text-muted-foreground">{client.phone}</p>
                    )}
                  </div>
                </div>
              )}

              {job.description && (
                <p className="text-xs text-muted-foreground pt-2 border-t border-border/30">{job.description}</p>
              )}
              {job.problem && (
                <div className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Problema:</span> {job.problem}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 2. Schedule Section ── */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Agenda</h3>
              {job.scheduled_at ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {format(new Date(job.scheduled_at), "EEEE d 'de' MMMM", { locale: es })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(job.scheduled_at), "HH:mm", { locale: es })} hrs
                    </p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Fecha no programada</p>
              )}

              {job.followup_scheduled_at && (
                <div className="flex items-center gap-3 pt-2 border-t border-border/30">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-orange-600">Visita de seguimiento</p>
                    <p className="text-sm font-semibold text-foreground">
                      {format(new Date(job.followup_scheduled_at), "EEEE d 'de' MMMM, HH:mm", { locale: es })}
                    </p>
                    {job.followup_status && (
                      <Badge variant="outline" className="text-[10px] mt-1">{job.followup_status}</Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 3. Location Section ── */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ubicación</h3>
              {job.location ? (
                <>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <MapPin className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{job.location}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(job.location!)}`, '_blank')}
                    >
                      <Navigation className="w-3.5 h-3.5" />
                      Iniciar ruta
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 text-xs"
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(job.location!)}`, '_blank')}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      Abrir en Maps
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <MapPin className="w-6 h-6 text-muted-foreground/40 mx-auto mb-1" />
                  <p className="text-xs text-muted-foreground">Ubicación no disponible</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── 4. Financial Section ── */}
          <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Finanzas</h3>

              {/* Visit fee */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">Cuota de visita</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{VISIT_DISPLAY.total}</span>
                  {job.visit_fee_paid ? (
                    <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">Pagado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-600 border-amber-500/20">Pendiente</Badge>
                  )}
                </div>
              </div>

              {/* Invoice amount if exists */}
              {invoice && (
                <div className="flex items-center justify-between pt-2 border-t border-border/30">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">Factura</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">${invoice.total_customer_amount?.toLocaleString('es-MX')} MXN</span>
                    <Badge variant="outline" className={cn("text-[10px]",
                      invoice.status === 'paid' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      invoice.status === 'sent' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                      invoice.status === 'accepted' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      "bg-muted text-muted-foreground"
                    )}>
                      {invoice.status === 'paid' ? 'Pagada' :
                       invoice.status === 'sent' ? 'Enviada' :
                       invoice.status === 'accepted' ? 'Aceptada' :
                       invoice.status === 'draft' ? 'Borrador' :
                       invoice.status}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Provider earnings */}
              <div className="pt-2 border-t border-border/30">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-foreground">Tu ganancia neta</span>
                  <span className="text-base font-bold text-primary">{VISIT_DISPLAY.providerNet}</span>
                </div>
                <details className="mt-2 group">
                  <summary className="text-[11px] text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                    Ver desglose completo ▸
                  </summary>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Cobro al cliente</span>
                      <span>{VISIT_DISPLAY.total}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comisión Chamby</span>
                      <span className="text-destructive">-{VISIT_DISPLAY.platformFee}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{VAT_LABEL}</span>
                      <span className="text-destructive">-{VISIT_DISPLAY.vat}</span>
                    </div>
                  </div>
                </details>
              </div>
            </CardContent>
          </Card>

          {/* ── Job Photos ── */}
          {job.photos && job.photos.length > 0 && (
            <Card className="border-border/50">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fotos</h3>
                <div className="grid grid-cols-3 gap-2">
                  {job.photos.map((photoUrl, i) => (
                    <a key={i} href={photoUrl} target="_blank" rel="noopener noreferrer" className="block">
                      <img
                        src={photoUrl}
                        alt={`Foto ${i + 1}`}
                        className="rounded-lg w-full h-24 object-cover border border-border/30"
                        loading="lazy"
                      />
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── 5. Status Timeline ── */}
          <Card className="border-border/50">
            <CardContent className="p-4">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Progreso</h3>
              <div className="relative pl-6">
                {STATUS_ORDER.map((step, i) => {
                  const isPast = currentIndex >= i;
                  const isCurrent = currentStatus === step;

                  return (
                    <div key={step} className="relative pb-5 last:pb-0">
                      {i < STATUS_ORDER.length - 1 && (
                        <div className={cn(
                          "absolute left-[-14px] top-6 w-0.5 h-full",
                          isPast ? "bg-primary/40" : "bg-border"
                        )} />
                      )}
                      {isCurrent ? (
                        <span className="absolute left-[-20px] top-0.5 flex h-3.5 w-3.5">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50" />
                          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-primary" />
                        </span>
                      ) : (
                        <div className={cn(
                          "absolute left-[-18px] top-1 w-2.5 h-2.5 rounded-full border-2",
                          isPast ? "bg-primary/60 border-primary/60" : "bg-muted border-border"
                        )} />
                      )}
                      <div className={cn(
                        "text-sm",
                        isCurrent ? "font-semibold text-foreground" : isPast ? "text-foreground/70" : "text-muted-foreground/50"
                      )}>
                        {getStatusLabel(step)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* ── 6. State-Dependent Actions ── */}
          <ProviderStatusSections
            status={currentStatus}
            jobId={job.id}
            invoice={invoice}
            transitioning={transitioning}
            onTransition={handleTransition}
            onQuoteSubmitted={fetchAll}
          />

          {/* Invoice Section */}
          <JobInvoiceSection
            jobId={job.id}
            role="provider"
            onUpdate={fetchAll}
          />

          {/* Provider marked done — waiting client confirmation */}
          {job.completion_status === 'provider_marked_done' && !job.has_open_dispute && (
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="p-4 text-center">
                <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Esperando confirmación del cliente</p>
                <p className="text-xs text-muted-foreground mt-1">
                  El cliente debe confirmar que el trabajo fue completado para liberar el pago
                </p>
              </CardContent>
            </Card>
          )}

          {/* Dispute banner */}
          {job.has_open_dispute && (
            <DisputeStatusCard jobId={job.id} role="provider" onUpdate={fetchAll} />
          )}

          {/* Dispute button */}
          {["completed", "in_progress"].includes(job.status) && !job.has_open_dispute && (
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/5 text-sm"
              onClick={() => setDisputeModalOpen(true)}
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Abrir disputa
            </Button>
          )}
          {job.status === "cancelled" && !job.has_open_dispute && (
            <p className="text-sm text-muted-foreground bg-muted/40 rounded-md px-3 py-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              No es posible abrir una disputa en un trabajo cancelado
            </p>
          )}

          <DisputeModal
            open={disputeModalOpen}
            onOpenChange={setDisputeModalOpen}
            jobId={job.id}
            onDisputeOpened={fetchAll}
          />

          <RescheduleDialog
            open={rescheduleDialogOpen}
            onOpenChange={setRescheduleDialogOpen}
            jobId={job.id}
            currentScheduledAt={job.scheduled_at}
            providerId={user?.id || null}
            clientId={job.client_id}
            onRescheduleComplete={fetchAll}
          />

          {/* Pago liberado */}
          {invoice?.status === 'released' && (
            <Card className="border-emerald-500/30 bg-emerald-500/5">
              <CardContent className="p-4 text-center">
                <CheckCircle className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-foreground">Pago liberado</p>
                <p className="text-xs text-muted-foreground mt-1">El pago fue depositado en tu cuenta de Stripe</p>
              </CardContent>
            </Card>
          )}

          {/* Reschedule section */}
          {!isTerminal && (() => {
            const hasPending = !!(job.reschedule_requested_at && !job.reschedule_agreed);
            const iAmRequester = job.reschedule_requested_by === 'provider';
            const iAmResponder = hasPending && !iAmRequester;
            return (
              <div className="space-y-2">
                {hasPending && iAmRequester && (
                  <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-semibold text-foreground">Reagendamiento pendiente</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Esperando respuesta del cliente para el{" "}
                        {job.reschedule_proposed_datetime
                          ? new Date(job.reschedule_proposed_datetime).toLocaleString("es-MX", { dateStyle: "medium", timeStyle: "short" })
                          : "nuevo horario propuesto"}.
                      </p>
                    </CardContent>
                  </Card>
                )}
                {iAmResponder && (
                  <Card className="border-primary/50 bg-primary/5">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-primary" />
                        <p className="text-sm font-semibold text-foreground">Solicitud de reagendamiento</p>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        El cliente propuso cambiar la fecha al{" "}
                        <span className="font-medium text-foreground">
                          {job.reschedule_proposed_datetime
                            ? new Date(job.reschedule_proposed_datetime).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" })
                            : "—"}
                        </span>. ¿Aceptas el nuevo horario?
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" className="flex-1" onClick={() => handleRescheduleResponse(true)} disabled={respondingReschedule}>
                          Aceptar reagendamiento
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1" onClick={() => handleRescheduleResponse(false)} disabled={respondingReschedule}>
                          Rechazar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
                {!hasPending && (
                  <Button
                    variant="ghost"
                    className="w-full gap-2 text-sm text-muted-foreground hover:text-foreground"
                    onClick={() => setRescheduleDialogOpen(true)}
                  >
                    <Calendar className="w-4 h-4" />
                    Solicitar reagendamiento
                  </Button>
                )}
              </div>
            );
          })()}

          {/* Cancel section */}
          {!isTerminal && (
            <div className="space-y-2">
              {isPostPayment ? (
                /* After client has paid — self-cancel disabled, contact admin via WhatsApp */
                <Button
                  variant="outline"
                  className="w-full gap-2 text-sm border-green-600/40 text-green-700 hover:bg-green-50"
                  onClick={() => {
                    const msg = encodeURIComponent(`Hola, necesito cancelar el trabajo #${job.id}. Motivo: `);
                    window.open(`https://wa.me/523325520551?text=${msg}`, '_blank');
                  }}
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Solicitar cancelación
                </Button>
              ) : (
                <>
                  {/* Step 1: reason selector */}
                  {cancelStep === 'reason' && (
                    <Card className="border-destructive/30 bg-destructive/5">
                      <CardContent className="p-4 space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                          <AlertTriangle className="w-4 h-4" />
                          ¿Por qué quieres cancelar?
                        </div>
                        <div className="space-y-2">
                          {[
                            'No puedo llegar a tiempo',
                            'Tuve una emergencia personal',
                            'El cliente no está disponible',
                            'El trabajo es diferente a lo descrito',
                            'Problemas con el acceso al lugar',
                          ].map((reason) => (
                            <button
                              key={reason}
                              onClick={() => setCancelReason(reason)}
                              className={cn(
                                'w-full text-left text-sm px-3 py-2 rounded-lg border transition-colors',
                                cancelReason === reason
                                  ? 'border-destructive bg-destructive/10 text-destructive font-medium'
                                  : 'border-border hover:border-destructive/50 text-foreground'
                              )}
                            >
                              {reason}
                            </button>
                          ))}
                          <input
                            type="text"
                            placeholder="Otro motivo..."
                            value={['No puedo llegar a tiempo','Tuve una emergencia personal','El cliente no está disponible','El trabajo es diferente a lo descrito','Problemas con el acceso al lugar'].includes(cancelReason) ? '' : cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background focus:outline-none focus:border-destructive/50"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Step 2: confirmation with penalty warning */}
                  {cancelStep === 'confirm' && (
                    <>
                      {cancelIsLate ? (
                        <Card className="border-destructive/30 bg-destructive/5">
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-destructive">
                              <AlertTriangle className="w-4 h-4" />
                              Cancelación tardía
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Faltan menos de 2 horas para este trabajo. Si cancelas: no recibirás pago por la visita y se aplicará un cargo de{" "}
                              <span className="font-semibold text-foreground">$100 MXN</span> a tu próximo pago. Tu cuenta recibirá una advertencia.
                            </p>
                          </CardContent>
                        </Card>
                      ) : (
                        <CancellationSummary
                          jobStatus={currentStatus}
                          visitFeeAmount={job.visit_fee_amount || 350}
                        />
                      )}
                    </>
                  )}

                  {cancelStep === 'idle' && (
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive gap-2 text-sm"
                      onClick={handleCancel}
                      disabled={transitioning}
                    >
                      <XCircle className="w-4 h-4" />
                      Cancelar trabajo
                    </Button>
                  )}

                  {cancelStep === 'reason' && (
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive gap-2 text-sm"
                      onClick={handleCancel}
                      disabled={!cancelReason.trim()}
                    >
                      Continuar
                    </Button>
                  )}

                  {cancelStep === 'confirm' && (
                    <Button
                      variant="ghost"
                      className="w-full text-destructive hover:text-destructive gap-2 text-sm"
                      onClick={handleCancel}
                      disabled={transitioning}
                    >
                      {transitioning ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      {cancelIsLate ? 'Sí, cancelar de todas formas' : 'Confirmar cancelación'}
                    </Button>
                  )}

                  {cancelStep !== 'idle' && (
                    <Button
                      variant="ghost"
                      className="w-full text-muted-foreground text-xs"
                      onClick={() => { setCancelStep('idle'); setCancelReason(''); setCancelIsLate(false); }}
                      disabled={transitioning}
                    >
                      Volver
                    </Button>
                  )}
                </>
              )}
            </div>
          )}

          {/* Terminal state */}
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

          {/* Rating */}
          {currentStatus === 'completed' && canRate && !ratingDismissed && (
            <RatingDialog
              jobId={job.id}
              otherUserId={job.client_id}
              reviewerRole="provider"
              onComplete={() => { refetchRating(); fetchAll(); }}
              onDismiss={() => setRatingDismissed(true)}
              subjectName={client?.full_name || "Cliente"}
              subjectAvatarUrl={null}
              jobCategory={job.category}
              jobServiceType={job.service_type || ""}
              jobRate={job.rate}
            />
          )}

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
                <p className="text-xs text-muted-foreground">Ya calificaste este trabajo</p>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Chat Tab */
        <div className="flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
          {/* Debug Panel - dev only */}
          {import.meta.env.DEV && (
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
          )}
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
                  // Detect invoice event type
                  const eventType = msg.system_event_type;
                  const text = msg.message_text;
                  let invoiceStyle: { icon: React.ElementType; bg: string; border: string; iconColor: string } | null = null;

                  if (eventType === 'invoice_sent' || /sent an invoice|envió una factura/i.test(text)) {
                    invoiceStyle = { icon: Receipt, bg: 'bg-blue-50 dark:bg-blue-950/30', border: 'border-blue-200 dark:border-blue-800', iconColor: 'text-blue-500' };
                  } else if (eventType === 'invoice_accepted' || /accepted|aceptada|aceptó/i.test(text)) {
                    invoiceStyle = { icon: CheckCircleInvoice, bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800', iconColor: 'text-emerald-500' };
                  } else if (eventType === 'invoice_rejected' || /rejected|rechaz|declined|solicitó ajustes/i.test(text)) {
                    invoiceStyle = { icon: XCircleInvoice, bg: 'bg-red-50 dark:bg-red-950/30', border: 'border-red-200 dark:border-red-800', iconColor: 'text-red-500' };
                  } else if (eventType === 'invoice_countered' || /counter|contraoferta/i.test(text)) {
                    invoiceStyle = { icon: RefreshCw, bg: 'bg-orange-50 dark:bg-orange-950/30', border: 'border-orange-200 dark:border-orange-800', iconColor: 'text-orange-500' };
                  } else if (eventType === 'invoice_expired' || /expired|expirad/i.test(text)) {
                    invoiceStyle = { icon: ClockInvoice, bg: 'bg-muted', border: 'border-border', iconColor: 'text-muted-foreground' };
                  }

                  if (invoiceStyle) {
                    const Icon = invoiceStyle.icon;
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex justify-center"
                      >
                        <div className={cn(
                          'flex items-center gap-2 px-4 py-2.5 rounded-xl border max-w-[90%]',
                          invoiceStyle.bg, invoiceStyle.border
                        )}>
                          <Icon className={cn('w-4 h-4 shrink-0', invoiceStyle.iconColor)} />
                          <span className="text-xs text-foreground/80">{msg.message_text}</span>
                        </div>
                      </motion.div>
                    );
                  }

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

      {/* Geolocation mismatch warning modal */}
      {geoModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 px-4 pb-6 sm:pb-0">
          <div className="bg-background rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <MapPin className="h-6 w-6 text-yellow-500 flex-shrink-0" />
              <h3 className="font-semibold text-foreground">Ubicación lejana</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              Tu ubicación parece estar lejos del domicilio registrado (aproximadamente{" "}
              <span className="font-semibold text-foreground">{geoModal.distance.toLocaleString()} metros</span>{" "}
              de distancia). ¿Confirmas que llegaste al trabajo?
            </p>
            <div className="flex flex-col gap-2">
              <Button className="w-full" onClick={confirmCheckInDespiteMismatch} disabled={checkingIn}>
                {checkingIn ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Sí, confirmar llegada
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setGeoModal(null)} disabled={checkingIn}>
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Primary CTA */}
      {activeTab === 'timeline' && actions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-background/95 backdrop-blur border-t border-border/50 px-4 py-3 safe-area-bottom">
          {actions.map((action) => {
            const isCheckIn = action.nextStatus === "on_site";
            const busy = isCheckIn ? (checkingIn || transitioning) : transitioning;
            return (
              <Button
                key={action.nextStatus}
                className="w-full h-12 text-sm font-semibold gap-2"
                onClick={() => isCheckIn ? handleCheckIn() : handleTransition(action.nextStatus)}
                disabled={busy}
              >
                {busy
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <action.icon className="w-4 h-4" />
                }
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JobTimelinePage;
