import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { A, fmtDate, relativeTime } from '../adminTokens';
import { toast } from 'sonner';

interface PendingJob {
  id: string; title: string; scheduled_at: string | null; client_id: string; provider_id: string | null;
  reschedule_requested_by: string | null; reschedule_requested_at: string | null;
  reschedule_proposed_datetime: string | null;
  clientName?: string; providerName?: string;
}

const card: React.CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 24 };

export function ReagendamientosView() {
  const [jobs, setJobs] = useState<PendingJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('jobs')
      .select('id,title,scheduled_at,client_id,provider_id,reschedule_requested_by,reschedule_requested_at,reschedule_proposed_datetime')
      .not('reschedule_requested_at', 'is', null).eq('reschedule_agreed', false)
      .order('reschedule_requested_at', { ascending: false });

    if (!data?.length) { setJobs([]); setLoading(false); return; }

    const ids = [...new Set([...data.map(j => j.client_id), ...data.filter(j => j.provider_id).map(j => j.provider_id!)])];
    const { data: users } = await supabase.from('users').select('id,full_name').in('id', ids);
    const uMap: Record<string, string> = {};
    users?.forEach(u => { uMap[u.id] = u.full_name || '—'; });

    setJobs(data.map(j => ({ ...j, clientName: uMap[j.client_id] || '—', providerName: j.provider_id ? uMap[j.provider_id] || '—' : null })));
    setLoading(false);
  };

  const approve = async (j: PendingJob) => {
    setActing(j.id);
    await supabase.from('jobs').update({ scheduled_at: j.reschedule_proposed_datetime, reschedule_agreed: true, reschedule_requested_by: null, reschedule_requested_at: null, reschedule_proposed_datetime: null }).eq('id', j.id);
    const notifs = [{ user_id: j.client_id }, ...(j.provider_id ? [{ user_id: j.provider_id }] : [])].map(n => ({ ...n, type: 'reschedule_accepted', title: 'Reagendamiento aprobado por admin', message: 'El administrador aprobó el reagendamiento.', link: '/active-jobs', data: { job_id: j.id } }));
    await supabase.from('notifications').insert(notifs);
    toast.success('Reagendamiento aprobado');
    fetchData();
    setActing(null);
  };

  const reject = async (j: PendingJob) => {
    setActing(j.id + '_r');
    await supabase.from('jobs').update({ reschedule_requested_by: null, reschedule_requested_at: null, reschedule_proposed_datetime: null, reschedule_agreed: false }).eq('id', j.id);
    const requesterId = j.reschedule_requested_by === 'client' ? j.client_id : j.provider_id;
    if (requesterId) await supabase.from('notifications').insert({ user_id: requesterId, type: 'reschedule_rejected', title: 'Reagendamiento rechazado', message: 'El administrador rechazó la solicitud.', link: '/active-jobs', data: { job_id: j.id } });
    toast.success('Reagendamiento rechazado');
    fetchData();
    setActing(null);
  };

  const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: A.textTertiary, fontFamily: A.fontSans, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${A.border}`, whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px', fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, borderBottom: `1px solid ${A.border}`, verticalAlign: 'middle' };

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary }}>Reagendamientos pendientes <span style={{ background: '#FDF6E8', color: '#7A5A12', fontSize: 12, fontWeight: 600, borderRadius: 10, padding: '1px 8px', marginLeft: 8 }}>{jobs.length}</span></div>
        <button onClick={fetchData} style={{ padding: '6px 14px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface }}>Actualizar</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: A.bg }}>
            <tr>{['ID', 'Trabajo', 'Solicitado por', 'Fecha actual', 'Fecha propuesta', 'Solicitado hace', 'Acciones'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Cargando…</td></tr>
              : jobs.length === 0 ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Sin solicitudes pendientes</td></tr>
              : jobs.map(j => (
                <tr key={j.id} onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>{j.id.slice(0, 8)}</td>
                  <td style={td}><div style={{ fontWeight: 500 }}>{j.title}</div><div style={{ fontSize: 11, color: A.textTertiary }}>{j.clientName} · {j.providerName ?? 'Sin proveedor'}</div></td>
                  <td style={td}><span style={{ background: j.reschedule_requested_by === 'client' ? '#EBF4FF' : '#E8F0EB', color: j.reschedule_requested_by === 'client' ? '#1E4E7A' : '#1E4A2F', fontSize: 12, fontWeight: 500, borderRadius: 100, padding: '2px 10px', fontFamily: A.fontSans }}>{j.reschedule_requested_by === 'client' ? 'Cliente' : 'Proveedor'}</span></td>
                  <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>{fmtDate(j.scheduled_at)}</td>
                  <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12, fontWeight: 500, color: A.accent }}>{fmtDate(j.reschedule_proposed_datetime)}</td>
                  <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>{j.reschedule_requested_at ? relativeTime(j.reschedule_requested_at) : '—'}</td>
                  <td style={td}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => approve(j)} disabled={!!acting} style={{ padding: '5px 12px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 12, fontFamily: A.fontSans, fontWeight: 500, background: A.accentLight, color: A.accentText, cursor: 'pointer' }}>Aprobar</button>
                      <button onClick={() => reject(j)} disabled={!!acting} style={{ padding: '5px 12px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 12, fontFamily: A.fontSans, fontWeight: 500, background: A.surface, color: A.textSecondary, cursor: 'pointer' }}>Rechazar</button>
                    </div>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
