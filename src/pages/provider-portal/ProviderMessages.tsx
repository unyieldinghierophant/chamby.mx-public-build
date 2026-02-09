import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Headset, MessageSquare, Send, ArrowLeft, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportMessages, SupportMessage } from "@/hooks/useSupportMessages";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ── Mock client threads (backend not wired yet) ──
interface Thread {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  avatarInitial?: string;
}

const clientThreads: Thread[] = [
  {
    id: "c1",
    title: "Cliente: Ana García",
    lastMessage: "Perfecto, nos vemos mañana a las 10.",
    timestamp: "hace 5 min",
    unread: true,
    avatarInitial: "A",
  },
  {
    id: "c2",
    title: "Cliente: Luis Pérez",
    lastMessage: "Gracias por el servicio, todo excelente.",
    timestamp: "hace 3 hrs",
    unread: false,
    avatarInitial: "L",
  },
];

// ── Support Chat View ──
const SupportChatView = ({ onBack }: { onBack: () => void }) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, markAsRead } = useSupportMessages();
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Mark messages as read when viewing
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
      {/* Chat header */}
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

      {/* Messages */}
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
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input */}
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

// ── Conversation list item ──
const ConversationItem = ({
  thread,
  isSupport,
  onClick,
}: {
  thread: Thread;
  isSupport: boolean;
  onClick: () => void;
}) => (
  <motion.button
    whileTap={{ scale: 0.98 }}
    onClick={onClick}
    className="flex items-center gap-3 w-full p-4 text-left border-b border-border/50 last:border-b-0 hover:bg-muted/40 transition-colors"
  >
    <div className="relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-primary/10 text-primary font-semibold text-base">
      {isSupport ? <Headset className="w-5 h-5" /> : thread.avatarInitial ?? "?"}
    </div>
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-foreground truncate">{thread.title}</h3>
        <span className="text-[11px] text-muted-foreground whitespace-nowrap">{thread.timestamp}</span>
      </div>
      <p className="text-xs text-muted-foreground truncate mt-0.5">{thread.lastMessage}</p>
    </div>
    {thread.unread && <span className="shrink-0 w-2.5 h-2.5 rounded-full bg-primary" />}
  </motion.button>
);

// ── Empty state ──
const EmptyState = ({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
}) => (
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
  const [chatOpen, setChatOpen] = useState(false);
  const { messages: supportMsgs } = useSupportMessages();
  const { user } = useAuth();

  // Build support thread summary from real data
  const supportUnread = supportMsgs.filter((m) => !m.read && m.sender_id !== user?.id).length;
  const lastSupportMsg = supportMsgs[supportMsgs.length - 1];

  const supportThread: Thread = {
    id: "support",
    title: "Soporte Chamby",
    lastMessage: lastSupportMsg?.message_text ?? "¡Escríbenos si necesitas ayuda!",
    timestamp: lastSupportMsg
      ? (() => {
          const d = new Date(lastSupportMsg.created_at);
          const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
          if (diffMin < 1) return "ahora";
          if (diffMin < 60) return `hace ${diffMin} min`;
          const diffH = Math.floor(diffMin / 60);
          if (diffH < 24) return `hace ${diffH} hrs`;
          return `hace ${Math.floor(diffH / 24)} días`;
        })()
      : "",
    unread: supportUnread > 0,
  };

  if (chatOpen) {
    return (
      <div className="pb-24">
        <SupportChatView onBack={() => setChatOpen(false)} />
      </div>
    );
  }

  const filteredClients = clientThreads.filter(
    (t) =>
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const supportMatchesSearch =
    searchQuery === "" ||
    supportThread.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supportThread.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

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
      <Tabs defaultValue="soporte" className="px-5">
        <TabsList className="w-full">
          <TabsTrigger value="soporte" className="flex-1">
            Soporte
          </TabsTrigger>
          <TabsTrigger value="clientes" className="flex-1">
            Clientes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="soporte" className="mt-3">
          {supportMatchesSearch ? (
            <ConversationItem
              thread={supportThread}
              isSupport
              onClick={() => setChatOpen(true)}
            />
          ) : (
            <EmptyState
              icon={Headset}
              title="Sin resultados"
              subtitle="No se encontraron conversaciones con ese término."
            />
          )}
        </TabsContent>

        <TabsContent value="clientes" className="mt-3">
          {filteredClients.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Aún no tienes conversaciones con clientes"
              subtitle="Cuando un cliente te contacte, aparecerá aquí."
            />
          ) : (
            filteredClients.map((t) => (
              <ConversationItem
                key={t.id}
                thread={t}
                isSupport={false}
                onClick={() =>
                  toast("Próximamente", {
                    description: "El chat con clientes estará disponible pronto.",
                  })
                }
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProviderMessages;
