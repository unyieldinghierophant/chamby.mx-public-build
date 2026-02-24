import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Send, Loader2, MessageSquare, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { useJobChat } from '@/hooks/useJobChat';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface JobChatViewProps {
  jobId: string;
  onBack: () => void;
  /** Optional title override */
  headerTitle?: string;
}

const JobChatView = ({ jobId, onBack, headerTitle }: JobChatViewProps) => {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage, otherParty } = useJobChat(jobId);
  const [newMessage, setNewMessage] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim()) return;
    try {
      await sendMessage(newMessage);
      setNewMessage('');
    } catch (err: any) {
      toast.error(err?.message || 'Error al enviar mensaje');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return format(date, 'HH:mm');
    if (diffDays === 1) return 'Ayer ' + format(date, 'HH:mm');
    return format(date, "d MMM HH:mm", { locale: es });
  };

  const displayName = headerTitle || otherParty?.full_name || 'Chat';

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border/50">
        <Button variant="ghost" size="icon" className="shrink-0 h-9 w-9" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-5 h-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground truncate">{displayName}</h2>
          <p className="text-[11px] text-muted-foreground">Chat del trabajo</p>
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
              <MessageSquare className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">Sin mensajes aún</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[240px] mx-auto">
              Escribe un mensaje para iniciar la conversación
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user?.id;

            if (msg.is_system_message) {
              return (
                <div key={msg.id} className="flex justify-center">
                  <div className="bg-muted/60 text-muted-foreground text-xs px-3 py-1.5 rounded-full max-w-[85%] text-center">
                    {msg.message_text}
                  </div>
                </div>
              );
            }

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn('flex', isMe ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm',
                    isMe
                      ? 'bg-primary text-primary-foreground rounded-br-md'
                      : 'bg-muted text-foreground rounded-bl-md'
                  )}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.message_text}</p>
                  <p className={cn(
                    'text-[10px] mt-1',
                    isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'
                  )}>
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

export default JobChatView;
