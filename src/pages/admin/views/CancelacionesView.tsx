import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { A, fmtDate, fmtMXN } from '../adminTokens';

interface CancelledJob {
  id: string; title: string; client_id: string; provider_id: string | null;
  updated_at: string; scheduled_at: string | null;
  cancellation_requested_by: string | null; late_cancellation_penalty_applied: boolean | null;
  geolocation_mismatch: boolean | null;
  clientName?: string; providerName?: string;
}
interface Stats { total: number; late: number; penaltyCents: number }

const card: React.CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 24 };

export function CancelacionesView() {
  const [jobs, setJobs] = useState<CancelledJob[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, late: 0, penaltyCents: 0 });
  const [loading, setLoading] = useState(true);
  const [filterBy, setFilterBy] = useState<'all' | 'client' | 'provider'>('all');
  const [lateOnly, setLateOnly] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const weekStart = new Date(); weekStart.setDate(weekStart.getDate() - 7); weekStart.setHours(0,0,0,0);

    const { data } = await supabase.from('jobs')
      .select('id,title,client_id,provider_id,updated_at,scheduled_at,cancellation_requested_by,late_cancellation_penalty_applied,geolocation_mismatch')
      .eq('status', 'cancelled').order('updated_at', { ascending: false });

    if (!data?.length) { setJobs([]); setLoading(false); return; }

    const ids = [...new Set([...data.map(j => j.client_id), ...data.filter(j => j.provider_id).map(j => j.provider_id!)])];
    const { data: users } = await supabase.from('users').select('id,full_name').in('id', ids);
    const uMap: Record<string, string> = {};
    users?.forEach(u => { uMap[u.id] = u.full_name || '—'; });

    const enriched = data.map(j => ({ ...j, clientName: uMap[j.client_id] || '—', providerName: j.provider_id ? uMap[j.provider_id] || '—' : null }));

    const weekCancels = enriched.filter(j => new Date(j.updated_at) >= weekStart);
    const lateCount = weekCancels.filter(j => j.late_cancellation_penalty_applied).length;
    const penaltyCents = lateCount * 20000;

    setJobs(enriched);
    setStats({ total: weekCancels.length, late: lateCount, penaltyCents });
    setLoading(false);
  };

  const filtered = jobs.filter(j => {
    if (filterBy === 'client' && j.cancellation_requested_by !== 'client') return false;
    if (filterBy === 'provider' && j.cancellation_requested_by !== 'provider') return false;
    if (lateOnly && !j.late_cancellation_penalty_applied) return false;
    return true;
  });

  const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: A.textTertiary, fontFamily: A.fontSans, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${A.border}`, whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px', fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, borderBottom: `1px solid ${A.border}`, verticalAlign: 'middle' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Esta semana', value: stats.total },
          { label: 'Cancelaciones tardías', value: stats.late, color: stats.late > 0 ? '#A67B1A' : A.textPrimary },
          { label: 'Penalizaciones cobradas', value: fmtMXN(stats.penaltyCents), color: stats.penaltyCents > 0 ? '#C4473A' : A.textPrimary },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 11, fontWeight: 600, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: A.fontSans, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 26, fontWeight: 600, fontFamily: A.fontSans, color: s.color ?? A.textPrimary }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={card}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <select value={filterBy} onChange={e => setFilterBy(e.target.value as any)}
            style={{ border: `1px solid ${A.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: A.fontSans, color: A.textPrimary, background: A.surface, cursor: 'pointer' }}>
            <option value="all">Todos</option>
            <option value="client">Por cliente</option>
            <option value="provider">Por proveedor</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: A.fontSans, color: A.textSecondary, cursor: 'pointer' }}>
            <input type="checkbox" checked={lateOnly} onChange={e => setLateOnly(e.target.checked)} />
            Solo tardías
          </label>
          <button onClick={fetchData} style={{ padding: '6px 14px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface, color: A.textPrimary, marginLeft: 'auto' }}>Actualizar</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: A.bg }}>
              <tr>{['ID', 'Trabajo', 'Cancelado por', 'Fecha cancelación', 'Tipo', 'Penalización', 'Cliente', 'Proveedor'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading
                ? <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Cargando…</td></tr>
                : filtered.length === 0
                ? <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Sin resultados</td></tr>
                : filtered.map(j => (
                  <tr key={j.id} onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>
                      {j.geolocation_mismatch && <span title="GPS sospechoso" style={{ marginRight: 4 }}>⚠️</span>}
                      {j.id.slice(0, 8)}
                    </td>
                    <td style={td}>{j.title}</td>
                    <td style={td}>
                      {j.cancellation_requested_by
                        ? <span style={{ background: j.cancellation_requested_by === 'client' ? '#EBF4FF' : '#E8F0EB', color: j.cancellation_requested_by === 'client' ? '#1E4E7A' : '#1E4A2F', fontSize: 12, fontWeight: 500, borderRadius: 100, padding: '2px 10px', fontFamily: A.fontSans }}>
                            {j.cancellation_requested_by === 'client' ? 'Cliente' : 'Proveedor'}
                          </span>
                        : <span style={{ color: A.textTertiary }}>—</span>}
                    </td>
                    <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>{fmtDate(j.updated_at)}</td>
                    <td style={td}>
                      {j.late_cancellation_penalty_applied
                        ? <span style={{ background: '#FBF0EE', color: '#922E24', fontSize: 12, fontWeight: 500, borderRadius: 100, padding: '2px 10px', fontFamily: A.fontSans, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#C4473A' }} />Tardía</span>
                        : <span style={{ background: '#F0EFEC', color: '#6B6A66', fontSize: 12, fontWeight: 500, borderRadius: 100, padding: '2px 10px', fontFamily: A.fontSans, display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: '#9C9B97' }} />Temprana</span>}
                    </td>
                    <td style={{ ...td, fontFamily: A.fontMono, fontSize: 13 }}>
                      {j.late_cancellation_penalty_applied
                        ? <span style={{ color: '#C4473A', fontWeight: 600 }}>{j.cancellation_requested_by === 'client' ? '$200 MXN' : '$100 MXN'}</span>
                        : <span style={{ color: A.textTertiary }}>—</span>}
                    </td>
                    <td style={td}>{j.clientName}</td>
                    <td style={{ ...td, color: j.providerName ? A.textPrimary : A.textTertiary }}>{j.providerName ?? 'Sin asignar'}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: A.textTertiary, fontFamily: A.fontSans }}>{filtered.length} cancelaciones</div>
      </div>
    </div>
  );
}
