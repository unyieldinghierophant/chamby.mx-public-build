import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Headset, Send, Loader2, Search, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAdminSupportInbox, useAdminSupportMessages, SupportMessage } from "@/hooks/useSupportMessages";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { toast } from "sonner";

// ── Admin chat with a specific provider ──
const AdminChatView = ({
  providerId,
  providerName,
  onBack,
}: {
  providerId: string;
  providerName: string | null;
  onBack: () => void;
}) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, markAsRead } = useAdminSupportMessages(providerId);
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
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-background">
        <Button variant="ghost" size="icon" className="shrink-0" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
          {providerName?.[0]?.toUpperCase() ?? "P"}
        </div>
        <div>
          <h2 className="text-sm font-semibold text-foreground">{providerName || "Proveedor"}</h2>
          <p className="text-[11px] text-muted-foreground">Soporte</p>
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
            <p className="text-sm text-muted-foreground">No hay mensajes aún.</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isAdmin = msg.sender_id !== msg.provider_id;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("flex", isAdmin ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
                    isAdmin
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-muted text-foreground rounded-bl-md"
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isAdmin ? "text-primary-foreground/70" : "text-muted-foreground"
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
      <div className="border-t border-border/50 px-4 py-3 flex items-center gap-2 bg-background">
        <Input
          placeholder="Escribe una respuesta..."
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

// ── Main admin inbox ──
const AdminSupportInbox = () => {
  const navigate = useNavigate();
  const { threads, loading, refetch } = useAdminSupportInbox();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedThread, setSelectedThread] = useState<{
    providerId: string;
    providerName: string | null;
  } | null>(null);

  const filtered = threads.filter(
    (t) =>
      searchQuery === "" ||
      (t.provider_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.last_message.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return "ahora";
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} hrs`;
    return `hace ${Math.floor(diffH / 24)} días`;
  };

  if (selectedThread) {
    return (
      <AdminChatView
        providerId={selectedThread.providerId}
        providerName={selectedThread.providerName}
        onBack={() => {
          setSelectedThread(null);
          refetch();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold">Soporte - Inbox</h1>
              <p className="text-xs text-muted-foreground">
                Conversaciones con proveedores
              </p>
            </div>
          </div>
          <div className="relative mt-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Buscar proveedor..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 text-sm"
            />
          </div>
        </div>
      </header>

      {/* Thread list */}
      <div className="container mx-auto px-4 py-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Sin conversaciones</p>
            <p className="text-xs text-muted-foreground mt-1">
              Los proveedores aparecerán aquí cuando envíen mensajes.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border/50">
            {filtered.map((thread) => (
              <motion.button
                key={thread.provider_id}
                whileTap={{ scale: 0.98 }}
                onClick={() =>
                  setSelectedThread({
                    providerId: thread.provider_id,
                    providerName: thread.provider_name,
                  })
                }
                className="flex items-center gap-3 w-full p-4 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-base shrink-0">
                  {thread.provider_name?.[0]?.toUpperCase() ?? "P"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">
                      {thread.provider_name || "Proveedor"}
                    </h3>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {formatTimestamp(thread.last_message_at)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate mt-0.5">
                    {thread.last_message}
                  </p>
                </div>
                {thread.unread_count > 0 && (
                  <Badge variant="destructive" className="text-[10px] h-5 min-w-[20px] px-1.5">
                    {thread.unread_count}
                  </Badge>
                )}
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminSupportInbox;
