import { useMemo, useState } from 'react';
import { A } from '../adminTokens';
import { ChatPanel } from '../chat/ChatPanel';
import { useConversations, type ConversationRow } from '../chat/useChat';
import { Search } from 'lucide-react';

const relative = (iso: string | null) => {
  if (!iso) return '—';
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
};

export function SoporteView() {
  const { conversations, loading } = useConversations('support');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = useMemo(
    () => conversations.filter(c => !query || (c.participant_name || '').toLowerCase().includes(query.toLowerCase())),
    [conversations, query]
  );

  const selected = useMemo(() => conversations.find(c => c.id === selectedId) ?? null, [conversations, selectedId]);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 14, height: 'calc(100vh - 120px)', fontFamily: A.fontSans }}>
      {/* LEFT — conversation list */}
      <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '14px 14px 10px', borderBottom: `1px solid ${A.border}` }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: A.textPrimary, marginBottom: 10 }}>Conversaciones</div>
          <div style={{ position: 'relative' }}>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar por nombre…"
              style={{ width: '100%', padding: '8px 12px 8px 32px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 12, fontFamily: A.fontSans, color: A.textPrimary, background: A.bg, outline: 'none', boxSizing: 'border-box' }}
            />
            <Search size={13} strokeWidth={1.75} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: A.textTertiary }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loading ? (
            <div style={{ color: A.textTertiary, fontSize: 12, padding: 20, textAlign: 'center' }}>Cargando…</div>
          ) : filtered.length === 0 ? (
            <div style={{ color: A.textTertiary, fontSize: 12, padding: 20, textAlign: 'center' }}>Sin conversaciones</div>
          ) : (
            filtered.map(c => <ConversationRowButton key={c.id} conv={c} active={selectedId === c.id} onClick={() => setSelectedId(c.id)} />)
          )}
        </div>
      </div>

      {/* RIGHT — active chat */}
      <div>
        {selected ? (
          <ChatPanel
            conversationId={selected.id}
            title={selected.participant_name ?? 'Usuario'}
            subtitle={selected.participant_role === 'provider' ? 'Proveedor' : 'Cliente'}
            participantInitial={selected.participant_name?.[0]}
            participantRoleLabel={selected.participant_role === 'provider' ? 'Proveedor' : 'Cliente'}
            height="100%"
          />
        ) : (
          <ChatPanel
            conversationId={null}
            title=""
            height="100%"
            emptyState="Selecciona una conversación para comenzar"
          />
        )}
      </div>
    </div>
  );
}

function ConversationRowButton({ conv, active, onClick }: { conv: ConversationRow; active: boolean; onClick: () => void }) {
  const unread = conv.unread_count_admin > 0;
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        borderTop: 'none',
        borderRight: 'none',
        borderBottom: `1px solid ${A.border}`,
        borderLeft: `3px solid ${unread ? '#C4473A' : 'transparent'}`,
        background: active ? A.rowHover : 'transparent',
        cursor: 'pointer',
        fontFamily: A.fontSans,
        textAlign: 'left',
      }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = A.rowHover; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
    >
      <div style={{ width: 36, height: 36, borderRadius: '50%', background: A.accentLight, color: A.accentText, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {(conv.participant_name?.[0] ?? '?').toUpperCase()}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: unread ? 700 : 500, color: A.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            {conv.participant_name ?? 'Usuario'}
          </span>
          <span style={{ fontSize: 10, color: A.textTertiary, fontFamily: A.fontMono, flexShrink: 0 }}>{relative(conv.last_message_at)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
          <span style={{ fontSize: 10, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600, flexShrink: 0 }}>
            {conv.participant_role === 'provider' ? 'Proveedor' : 'Cliente'}
          </span>
          <span style={{ fontSize: 11, color: unread ? A.textPrimary : A.textTertiary, fontWeight: unread ? 600 : 400, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
            · {conv.last_message_text || 'Sin mensajes'}
          </span>
          {unread && (
            <span style={{ background: '#C4473A', color: '#fff', fontSize: 10, fontWeight: 700, borderRadius: 100, padding: '1px 7px', fontFamily: A.fontMono, flexShrink: 0 }}>
              {conv.unread_count_admin}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
