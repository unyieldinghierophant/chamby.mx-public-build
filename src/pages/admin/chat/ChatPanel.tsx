import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { A, ADMIN_ID } from '../adminTokens';
import { useChat, type ChatAttachment, type ChatMessage } from './useChat';
import { toast } from 'sonner';
import { Paperclip, Send, X } from 'lucide-react';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB
const ACCEPTED_TYPES = 'image/*,video/*,application/pdf';

interface ChatPanelProps {
  conversationId: string | null;
  title: string;
  subtitle?: string;
  participantInitial?: string;
  participantRoleLabel?: 'Cliente' | 'Proveedor' | 'Usuario';
  height?: number | string;
  emptyState?: React.ReactNode;
}

const fmtTime = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const sameDay = d.toDateString() === today.toDateString();
  return sameDay
    ? d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
};

export function ChatPanel({
  conversationId,
  title,
  subtitle,
  participantInitial,
  participantRoleLabel,
  height = 520,
  emptyState,
}: ChatPanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.id === ADMIN_ID;
  const { messages, loading, sendMessage } = useChat(conversationId, isAdmin ? 'admin' : 'participant');
  const [draft, setDraft] = useState('');
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages.length]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const ok = files.filter(f => {
      if (f.size > MAX_UPLOAD_BYTES) { toast.error(`${f.name} excede 10 MB`); return false; }
      return true;
    });
    setPendingFiles(prev => [...prev, ...ok]);
    e.target.value = '';
  };

  const removePending = (idx: number) => setPendingFiles(prev => prev.filter((_, i) => i !== idx));

  const uploadAttachments = async (): Promise<ChatAttachment[]> => {
    if (!pendingFiles.length || !conversationId || !user) return [];
    const out: ChatAttachment[] = [];
    for (const f of pendingFiles) {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${conversationId}/${Date.now()}_${safeName}`;
      const { error } = await supabase.storage.from('chat-attachments').upload(path, f, { upsert: false });
      if (error) { toast.error(`Error al subir ${f.name}`); continue; }
      const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
      out.push({ url: data.publicUrl, type: f.type || 'application/octet-stream', name: f.name });
    }
    return out;
  };

  const handleSend = async () => {
    if (!user || !conversationId) return;
    if (!draft.trim() && pendingFiles.length === 0) return;
    setSending(true);
    try {
      const atts = await uploadAttachments();
      await sendMessage({
        senderId: user.id,
        senderRole: isAdmin ? 'admin' : (participantRoleLabel === 'Proveedor' ? 'provider' : 'client'),
        message: draft.trim() || (atts.length ? `[${atts.length} archivo${atts.length > 1 ? 's' : ''} adjunto${atts.length > 1 ? 's' : ''}]` : ''),
        attachments: atts,
      });
      setDraft('');
      setPendingFiles([]);
    } catch (e: any) {
      toast.error(e?.message || 'Error al enviar');
    }
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  // ── Styles ────────────────────────────────────────────────────────────────
  const wrap: React.CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column', height, fontFamily: A.fontSans };
  const header: React.CSSProperties = { padding: '12px 14px', borderBottom: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', gap: 10, background: A.surface };
  const messagesWrap: React.CSSProperties = { flex: 1, overflowY: 'auto', padding: '14px', display: 'flex', flexDirection: 'column', gap: 8, background: A.bg };
  const inputWrap: React.CSSProperties = { padding: '10px 12px', borderTop: `1px solid ${A.border}`, display: 'flex', gap: 8, alignItems: 'flex-end', background: A.surface };

  const AvatarInitial = () => (
    <div style={{ width: 32, height: 32, borderRadius: '50%', background: A.accentLight, color: A.accentText, fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {(participantInitial || title[0] || '?').toUpperCase()}
    </div>
  );

  const RoleBadge = () => participantRoleLabel ? (
    <span style={{ fontSize: 10, fontWeight: 600, background: A.bg, color: A.textSecondary, padding: '2px 8px', borderRadius: 100, fontFamily: A.fontSans, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {participantRoleLabel}
    </span>
  ) : null;

  if (!conversationId) {
    return (
      <div style={wrap}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: A.textTertiary, fontSize: 13, padding: 24, textAlign: 'center' }}>
          {emptyState ?? 'Selecciona una conversación para comenzar'}
        </div>
      </div>
    );
  }

  return (
    <div style={wrap}>
      <div style={header}>
        <AvatarInitial />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: A.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11, color: A.textTertiary }}>{subtitle}</div>}
        </div>
        <RoleBadge />
      </div>

      <div ref={scrollRef} style={messagesWrap}>
        {loading ? (
          <div style={{ color: A.textTertiary, fontSize: 13, textAlign: 'center', padding: 24 }}>Cargando…</div>
        ) : messages.length === 0 ? (
          <div style={{ color: A.textTertiary, fontSize: 13, textAlign: 'center', padding: 24 }}>Sin mensajes todavía</div>
        ) : (
          messages.map(m => <MessageBubble key={m.id} msg={m} isMine={isAdmin ? m.sender_role === 'admin' : m.sender_id === user?.id} />)
        )}
      </div>

      {pendingFiles.length > 0 && (
        <div style={{ padding: '6px 12px', background: A.bg, borderTop: `1px solid ${A.border}`, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {pendingFiles.map((f, i) => (
            <span key={i} style={{ fontSize: 11, color: A.textSecondary, background: A.surface, border: `1px solid ${A.border}`, borderRadius: 100, padding: '3px 8px 3px 10px', display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: A.fontMono }}>
              {f.name}
              <button onClick={() => removePending(i)} title="Quitar" style={{ background: 'none', border: 'none', color: A.textTertiary, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center' }}>
                <X size={12} strokeWidth={2} />
              </button>
            </span>
          ))}
        </div>
      )}

      <div style={inputWrap}>
        <input ref={fileInputRef} type="file" accept={ACCEPTED_TYPES} multiple onChange={handleFileSelect} style={{ display: 'none' }} />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={sending}
          title="Adjuntar archivo"
          style={{ width: 36, height: 36, border: `1px solid ${A.border}`, borderRadius: 8, background: A.surface, color: A.textSecondary, cursor: 'pointer', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Paperclip size={16} strokeWidth={1.75} />
        </button>
        <textarea
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Escribe un mensaje…"
          rows={1}
          style={{ flex: 1, border: `1px solid ${A.border}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, fontFamily: A.fontSans, color: A.textPrimary, background: A.surface, resize: 'none', maxHeight: 120, outline: 'none', lineHeight: 1.4 }}
        />
        <button
          onClick={handleSend}
          disabled={sending || (!draft.trim() && pendingFiles.length === 0)}
          title="Enviar"
          style={{ width: 36, height: 36, borderRadius: '50%', border: 'none', background: A.accent, color: '#fff', cursor: 'pointer', flexShrink: 0, opacity: sending || (!draft.trim() && pendingFiles.length === 0) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Send size={15} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

// ── Message bubble ───────────────────────────────────────────────────────────
function MessageBubble({ msg, isMine }: { msg: ChatMessage; isMine: boolean }) {
  const bubble: React.CSSProperties = {
    maxWidth: '78%',
    padding: '8px 12px',
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.45,
    fontFamily: A.fontSans,
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    background: isMine ? '#1456DB' : '#F0EFEC',
    color: isMine ? '#FFFFFF' : '#1A1A18',
    borderBottomRightRadius: isMine ? 4 : 12,
    borderBottomLeftRadius: isMine ? 12 : 4,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMine ? 'flex-end' : 'flex-start', gap: 4 }}>
      <div style={bubble}>
        {msg.message}
        {msg.attachments && msg.attachments.length > 0 && (
          <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {msg.attachments.map((a, i) => (
              a.type?.startsWith('image/')
                ? <img key={i} src={a.url} alt={a.name} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, cursor: 'zoom-in' }} onClick={() => window.open(a.url, '_blank')} />
                : <a key={i} href={a.url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, color: isMine ? '#E6EEFB' : A.accent, textDecoration: 'underline', fontFamily: A.fontMono }}>{a.name || 'Archivo adjunto'}</a>
            ))}
          </div>
        )}
      </div>
      <span style={{ fontSize: 10, color: '#9C9B97', fontFamily: A.fontMono, padding: '0 4px' }}>{fmtTime(msg.created_at)}</span>
    </div>
  );
}
