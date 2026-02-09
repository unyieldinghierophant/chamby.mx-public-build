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
  Phone,
  MessageSquare,
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

// Actions config per status
const STATUS_ACTIONS: Record<string, { label: string; nextStatus: JobStatus; icon: React.ComponentType<any>; variant?: string }[]> = {
  accepted:    [{ label: 'Esperando confirmación del cliente', nextStatus: 'confirmed', icon: ClipboardCheck }],
  confirmed:   [{ label: 'Marcar en camino', nextStatus: 'en_route', icon: Navigation }],
  en_route:    [{ label: 'Llegué al sitio', nextStatus: 'on_site', icon: MapPin }],
  on_site:     [
    { label: 'Enviar cotización', nextStatus: 'quoted', icon: FileText },
    { label: 'Iniciar trabajo', nextStatus: 'in_progress', icon: Play },
  ],
  quoted:      [{ label: 'Iniciar trabajo', nextStatus: 'in_progress', icon: Play }],
  in_progress: [{ label: 'Marcar como completado', nextStatus: 'completed', icon: CheckCircle }],
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
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [transitioning, setTransitioning] = useState(false);
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'chat'>('timeline');

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
    }

    // Fetch messages
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, message_text, sender_id, is_system_message, system_event_type, created_at')
      .eq('job_id', jobId)
      .order('created_at', { ascending: true });

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
      .subscribe();

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
    setTransitioning(true);
    const result = await transitionStatus(job.id, 'cancelled', job.client_id);
    setTransitioning(false);
    if (result.success) {
      toast.success('Trabajo cancelado');
      navigate('/provider-portal/jobs');
    } else {
      toast.error(result.error || 'Error al cancelar');
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !job || !user) return;
    setSending(true);
    await supabase.from('messages').insert({
      job_id: job.id,
      sender_id: user.id,
      receiver_id: job.client_id,
      message_text: newMessage.trim(),
      is_system_message: false,
      read: false,
    });
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
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Trabajo no encontrado</p>
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
              {client && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{client.full_name || 'Cliente'}</span>
                  </div>
                  {client.phone && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1 text-xs"
                      onClick={() => window.location.href = `tel:${client.phone}`}
                    >
                      <Phone className="w-3 h-3" /> Llamar
                    </Button>
                  )}
                </div>
              )}
              {job.scheduled_at && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(job.scheduled_at), "d 'de' MMMM, HH:mm", { locale: es })}</span>
                </div>
              )}
              {job.location && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{job.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <DollarSign className="w-4 h-4" />
                <span>${(job.total_amount || job.rate || 0).toFixed(2)} MXN</span>
              </div>
              {job.description && (
                <p className="text-xs text-muted-foreground">{job.description}</p>
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

          {/* Actions */}
          {!isTerminal && actions.length > 0 && (
            <div className="space-y-2">
              {actions.map((action) => {
                const Icon = action.icon;
                // Provider can't confirm on behalf of client
                const isClientAction = action.nextStatus === 'confirmed';
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

              {/* Cancel always available for non-terminal */}
              <Button
                variant="ghost"
                className="w-full text-destructive hover:text-destructive gap-2 text-sm"
                onClick={handleCancel}
                disabled={transitioning}
              >
                <XCircle className="w-4 h-4" /> Cancelar trabajo
              </Button>
            </div>
          )}

          {/* Terminal state message */}
          {isTerminal && (
            <Card className={cn(
              "border",
              currentStatus === 'completed' ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
            )}>
              <CardContent className="p-4 text-center">
                {currentStatus === 'completed' ? (
                  <>
                    <CheckCircle className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-emerald-800">Trabajo completado</p>
                  </>
                ) : (
                  <>
                    <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-red-800">Trabajo cancelado</p>
                  </>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* Chat Tab */
        <div className="flex flex-col" style={{ height: 'calc(100vh - 10rem)' }}>
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
