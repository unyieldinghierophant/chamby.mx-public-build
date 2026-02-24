import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Headset, MessageSquare, Send, ArrowLeft, Loader2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportMessages, SupportMessage } from "@/hooks/useSupportMessages";
import { useJobConversations } from "@/hooks/useJobChat";
import JobChatView from "@/components/JobChatView";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ── Support Chat View ──
const SupportChatView = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, markAsRead } = useSupportMessages();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    markAsRead();
  }, [messages.length, markAsRead]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessage(newMessage);
      setNewMessage("");
    } catch {
      toast.error("Error al enviar mensaje");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return format(date, "HH:mm");
    if (diffDays === 1) return "Ayer " + format(date, "HH:mm");
    return format(date, "d MMM HH:mm", { locale: es });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Headset className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">Soporte Chamby</h2>
          <p className="text-[11px] text-muted-foreground">Normalmente respondemos en minutos</p>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Headset className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">¡Hola! 👋</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
              Escríbenos cualquier duda o problema. Estamos aquí para ayudarte.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", isMe ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    isMe
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                  <p className={cn("text-[10px] mt-1", isMe ? "text-primary-foreground/70" : "text-muted-foreground")}>
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <div className="border-t border-border/50 px-4 py-3 flex items-center gap-2">
        <Input
          placeholder="Escribe un mensaje..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 h-10 text-sm"
          disabled={sending}
        />
        <Button
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={handleSend}
          disabled={sending || !newMessage.trim()}
        >
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
};

// ── Thread item ──
interface ThreadItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  onClick: () => void;
}

const ThreadItem = ({ icon, title, subtitle, lastMessage, timestamp, unreadCount, onClick }: ThreadItemProps) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center gap-3 w-full p-4 text-left border-b border-border/50 last:border-b-0 hover:bg-muted/40 transition-colors"
  >
    <div className="relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-primary/10 text-primary">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground truncate">{title}</h3>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{timestamp}</span>
      </div>
      {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
      <p className="text-xs text-muted-foreground truncate mt-0.5">{lastMessage}</p>
    </div>
    {unreadCount > 0 && (
      <Badge className="shrink-0 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
        {unreadCount > 99 ? '99+' : unreadCount}
      </Badge>
    )}
  </motion.button>
);

// ── Empty state ──
const EmptyState = ({ icon: Icon, title, subtitle }: { icon: React.ComponentType<{ className?: string }>; title: string; subtitle: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="flex flex-col items-center justify-center py-16 px-6 text-center"
  >
    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
      <Icon className="w-7 h-7 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium text-foreground">{title}</p>
    <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">{subtitle}</p>
  </motion.div>
);

// ── Main component ──
const ProviderMessages = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [chatView, setChatView] = useState<{ type: 'support' | 'job'; jobId?: string } | null>(null);
  const { messages: supportMsgs } = useSupportMessages();
  const { conversations: clientConversations, loading: clientLoading } = useJobConversations();
  const { user } = useAuth();

  // Build support thread summary
  const supportUnread = supportMsgs.filter((m) => !m.read && m.sender_id !== user?.id).length;
  const lastSupportMsg = supportMsgs[supportMsgs.length - 1];

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return "ahora";
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} hrs`;
    return `hace ${Math.floor(diffH / 24)} días`;
  };

  // Chat views
  if (chatView?.type === 'support') {
    return (
      <div className="pb-24">
        <SupportChatView onBack={() => setChatView(null)} />
      </div>
    );
  }

  if (chatView?.type === 'job' && chatView.jobId) {
    return (
      <div className="pb-24">
        <JobChatView jobId={chatView.jobId} onBack={() => setChatView(null)} />
      </div>
    );
  }

  const supportMatchesSearch =
    searchQuery === "" ||
    "soporte chamby".includes(searchQuery.toLowerCase());

  const filteredClients = clientConversations.filter(
    (c) =>
      searchQuery === "" ||
      (c.other_party_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.job_title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="px-5 pt-6 pb-3 space-y-3">
        <h1 className="text-xl font-bold text-foreground font-jakarta">Mensajes</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Buscar conversaciones..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 text-sm"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="clientes" className="px-5">
        <TabsList className="w-full">
          <TabsTrigger value="clientes" className="flex-1">
            Clientes
          </TabsTrigger>
          <TabsTrigger value="soporte" className="flex-1">
            Soporte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clientes" className="mt-3">
          {clientLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filteredClients.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title={clientConversations.length === 0 ? "Aún no tienes conversaciones con clientes" : "Sin resultados"}
              subtitle={clientConversations.length === 0
                ? "Cuando aceptes un trabajo y chatees con un cliente, aparecerá aquí."
                : "Intenta con otro término de búsqueda."}
            />
          ) : (
            filteredClients.map((c) => (
              <ThreadItem
                key={c.job_id}
                icon={<User className="w-5 h-5" />}
                title={c.other_party_name || 'Cliente'}
                subtitle={`${c.job_title} • ${c.job_category}`}
                lastMessage={c.last_message}
                timestamp={formatTimestamp(c.last_message_at)}
                unreadCount={c.unread_count}
                onClick={() => setChatView({ type: 'job', jobId: c.job_id })}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="soporte" className="mt-3">
          {supportMatchesSearch ? (
            <ThreadItem
              icon={<Headset className="w-5 h-5" />}
              title="Soporte Chamby"
              lastMessage={lastSupportMsg?.message_text ?? "¡Escríbenos si necesitas ayuda!"}
              timestamp={lastSupportMsg ? formatTimestamp(lastSupportMsg.created_at) : ""}
              unreadCount={supportUnread}
              onClick={() => setChatView({ type: 'support' })}
            />
          ) : (
            <EmptyState
              icon={Headset}
              title="Sin resultados"
              subtitle="No se encontraron conversaciones con ese término."
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderMessages;
