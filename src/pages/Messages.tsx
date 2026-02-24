import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSearchParams, Navigate, Link } from 'react-router-dom';
import { useJobConversations } from '@/hooks/useJobChat';
import JobChatView from '@/components/JobChatView';
import Header from '@/components/Header';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MessageSquare, Search, ArrowLeft, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const Messages = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(initialJobId);
  const [searchTerm, setSearchTerm] = useState('');
  const { conversations, loading } = useJobConversations();

  if (!user) {
    return <Navigate to="/auth/user" replace />;
  }

  const openChat = (jobId: string) => {
    setSelectedJobId(jobId);
    setSearchParams({ jobId });
  };

  const closeChat = () => {
    setSelectedJobId(null);
    setSearchParams({});
  };

  if (selectedJobId) {
    return (
      <div className="min-h-screen bg-gradient-main">
        <Header />
        <main className="pt-20">
          <JobChatView jobId={selectedJobId} onBack={closeChat} />
        </main>
      </div>
    );
  }

  const filtered = conversations.filter(c =>
    (c.other_party_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.job_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.job_category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatTimestamp = (dateStr: string) => {
    const d = new Date(dateStr);
    const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diffMin < 1) return 'ahora';
    if (diffMin < 60) return `hace ${diffMin} min`;
    const diffH = Math.floor(diffMin / 60);
    if (diffH < 24) return `hace ${diffH} hrs`;
    return `hace ${Math.floor(diffH / 24)} días`;
  };

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-6">
            <Link to="/active-jobs" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Volver
            </Link>
            <h1 className="text-2xl font-bold text-foreground mb-1">Mensajes</h1>
            <p className="text-sm text-muted-foreground">Chatea con tus proveedores de servicios</p>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar conversaciones..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Conversations */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">
                {conversations.length === 0 ? 'Sin conversaciones aún' : 'Sin resultados'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {conversations.length === 0
                  ? 'Cuando un proveedor sea asignado a tu trabajo, podrás chatear aquí.'
                  : 'Intenta con otro término de búsqueda.'}
              </p>
            </div>
          ) : (
            <div className="space-y-0 rounded-xl border border-border/50 overflow-hidden bg-card/95 backdrop-blur-sm">
              {filtered.map((conv) => (
                <motion.button
                  key={conv.job_id}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => openChat(conv.job_id)}
                  className="flex items-center gap-3 w-full p-4 text-left border-b border-border/50 last:border-b-0 hover:bg-muted/40 transition-colors"
                >
                  <div className="relative shrink-0 w-11 h-11 rounded-full flex items-center justify-center bg-primary/10">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground truncate">
                        {conv.other_party_name || 'Proveedor'}
                      </h3>
                      <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                        {formatTimestamp(conv.last_message_at)}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">{conv.job_title} • {conv.job_category}</p>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.last_message}</p>
                  </div>
                  {conv.unread_count > 0 && (
                    <Badge className="shrink-0 h-5 w-5 p-0 flex items-center justify-center text-[10px] rounded-full">
                      {conv.unread_count}
                    </Badge>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Messages;
