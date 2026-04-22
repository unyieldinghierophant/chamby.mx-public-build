import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { A, dotColor, relativeTime } from '../adminTokens';

interface Entry { id: string; type: string; message: string; booking_id: string | null; is_read: boolean; created_at: string }
const PAGE_SIZE = 20;
const TYPE_LABELS: Record<string, string> = { dispute_opened: 'Disputa abierta', late_cancellation: 'Cancelación tardía', cancellation_request: 'Cancelación solicitada', reschedule_request: 'Reagendamiento' };
const card: React.CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 24 };

export function RegistroView() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [typeFilter, setTypeFilter] = useState('all');

  useEffect(() => { fetchData(); }, [page, typeFilter]);

  const fetchData = async () => {
    setLoading(true);
    let q = (supabase as any).from('admin_notifications').select('*', { count: 'exact' }).order('created_at', { ascending: false });
    if (typeFilter !== 'all') q = q.eq('type', typeFilter);
    q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
    const { data, count } = await q;
    setEntries(data ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  };

  const allTypes = ['all', 'dispute_opened', 'late_cancellation', 'cancellation_request', 'reschedule_request'];
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary }}>Registro de actividad <span style={{ fontSize: 13, color: A.textTertiary, fontWeight: 400 }}>({total} eventos)</span></div>
        <select value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}
          style={{ border: `1px solid ${A.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: A.fontSans, color: A.textPrimary, background: A.surface, cursor: 'pointer' }}>
          {allTypes.map(t => <option key={t} value={t}>{t === 'all' ? 'Todos los tipos' : TYPE_LABELS[t] ?? t}</option>)}
        </select>
      </div>
      {loading ? <div style={{ textAlign: 'center', color: A.textTertiary, padding: 40, fontFamily: A.fontSans }}>Cargando…</div> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {entries.length === 0 ? <div style={{ textAlign: 'center', color: A.textTertiary, padding: 40, fontFamily: A.fontSans }}>Sin registros</div>
            : entries.map((e, i) => (
              <div key={e.id} style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 0', borderBottom: i < entries.length - 1 ? `1px solid ${A.border}` : 'none' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor(e.type), marginTop: 6, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, fontWeight: 600, fontFamily: A.fontSans, background: '#F0EFEC', color: A.textSecondary, borderRadius: 100, padding: '1px 8px' }}>{TYPE_LABELS[e.type] ?? e.type}</span>
                    {e.booking_id && <span style={{ fontFamily: A.fontMono, fontSize: 11, color: A.textTertiary }}>{e.booking_id.slice(0, 8)}</span>}
                  </div>
                  <div style={{ fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, lineHeight: 1.5 }}>{e.message}</div>
                </div>
                <div style={{ fontFamily: A.fontMono, fontSize: 11, color: A.textTertiary, whiteSpace: 'nowrap', flexShrink: 0, marginTop: 4 }}>{relativeTime(e.created_at)}</div>
              </div>
            ))}
        </div>
      )}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTop: `1px solid ${A.border}` }}>
          <span style={{ fontSize: 12, color: A.textTertiary, fontFamily: A.fontSans }}>Página {page} de {totalPages}</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {page > 1 && <button onClick={() => setPage(p => p - 1)} style={{ padding: '5px 12px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface }}>← Anterior</button>}
            {page < totalPages && <button onClick={() => setPage(p => p + 1)} style={{ padding: '5px 12px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface }}>Siguiente →</button>}
          </div>
        </div>
      )}
    </div>
  );
}
