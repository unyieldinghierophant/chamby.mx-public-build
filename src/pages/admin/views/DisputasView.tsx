import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { A, fmtDate, relativeTime, statusPill } from '../adminTokens';
import { toast } from 'sonner';

interface Dispute {
  id: string; job_id: string; opened_by_role: string; reason_code: string;
  status: string; created_at: string; description: string | null;
  admin_ruling: string | null; admin_notes: string | null; split_percentage_client: number | null;
  evidenceCount?: number; jobTitle?: string; openerName?: string;
}
interface Evidence { id: string; file_url: string; file_type: string; description: string | null; uploaded_by_role: string }

const card: React.CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 24 };
const RULING_LABELS: Record<string, string> = { client_wins: 'Cliente gana', provider_wins: 'Proveedor gana', split: 'Dividir pago' };

const DISPUTE_STATUS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  open: { bg: '#FBF0EE', text: '#922E24', dot: '#C4473A', label: 'Abierta' },
  under_review: { bg: '#EBF4FF', text: '#1E4E7A', dot: '#2563EB', label: 'En revisión' },
  resolved: { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Resuelta' },
};

export function DisputasView() {
  const navigate = useNavigate();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Dispute | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [job, setJob] = useState<any>(null);
  const [ruling, setRuling] = useState('');
  const [splitPct, setSplitPct] = useState('50');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [flagging, setFlagging] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    const { data } = await (supabase as any).from('disputes').select('*').order('created_at', { ascending: false });
    if (!data?.length) { setDisputes([]); setLoading(false); return; }

    const jobIds = [...new Set(data.map((d: Dispute) => d.job_id))];
    const userIds = [...new Set(data.map((d: Dispute) => d.opened_by_user_id))];
    const [{ data: jobs }, { data: users }, { data: evCounts }] = await Promise.all([
      supabase.from('jobs').select('id, title').in('id', jobIds),
      supabase.from('users').select('id, full_name').in('id', userIds as string[]),
      (supabase as any).from('dispute_evidence').select('dispute_id').in('dispute_id', data.map((d: any) => d.id)),
    ]);

    const jobMap: Record<string, string> = {};
    jobs?.forEach((j: any) => { jobMap[j.id] = j.title || j.id.slice(0, 8); });
    const userMap: Record<string, string> = {};
    users?.forEach((u: any) => { userMap[u.id] = u.full_name || '—'; });
    const evMap: Record<string, number> = {};
    evCounts?.forEach((e: any) => { evMap[e.dispute_id] = (evMap[e.dispute_id] ?? 0) + 1; });

    setDisputes(data.map((d: any) => ({
      ...d,
      jobTitle: jobMap[d.job_id] || d.job_id.slice(0, 8),
      openerName: userMap[d.opened_by_user_id] || '—',
      evidenceCount: evMap[d.id] ?? 0,
    })));
    setLoading(false);
  };

  const openDetail = async (d: Dispute) => {
    setSelected(d);
    setRuling(d.admin_ruling || '');
    setSplitPct(d.split_percentage_client?.toString() || '50');
    setNotes(d.admin_notes || '');
    const [{ data: ev }, { data: jobData }] = await Promise.all([
      (supabase as any).from('dispute_evidence').select('*').eq('dispute_id', d.id),
      supabase.from('jobs').select('*, client_id, provider_id, title, status, scheduled_at, location').eq('id', d.job_id).maybeSingle(),
    ]);
    setEvidence(ev ?? []);
    setJob(jobData);
  };

  const saveRuling = async () => {
    if (!selected || !ruling) return;
    setSaving(true);
    const { data, error } = await supabase.functions.invoke('resolve-dispute', {
      body: { dispute_id: selected.id, admin_ruling: ruling, split_percentage_client: ruling === 'split' ? parseInt(splitPct) : null, admin_notes: notes },
    });
    if (error || data?.error) { toast.error(data?.error || error?.message || 'Error'); }
    else {
      toast.success(data.stripe_errors?.length ? `Resuelto. Nota Stripe: ${data.stripe_errors[0]}` : 'Disputa resuelta');
      setSelected(null); fetchDisputes();
    }
    setSaving(false);
  };

  const addFlag = async (userId: string, role: string) => {
    setFlagging(true);
    const { data: u } = await supabase.from('users').select('flag_count, account_status').eq('id', userId).single();
    const newCount = (u?.flag_count ?? 0) + 1;
    const newStatus = newCount >= 6 ? 'suspended' : newCount >= 3 ? 'frozen' : u?.account_status ?? 'active';
    await supabase.from('users').update({ flag_count: newCount, account_status: newStatus }).eq('id', userId);
    await (supabase as any).from('account_flags').insert({ user_id: userId, reason: `Advertencia admin — disputa ${selected?.id?.slice(0,8)}`, flagged_by: 'admin', booking_id: selected?.job_id });
    toast.success(`Advertencia agregada al ${role} (flag ${newCount})`);
    setFlagging(false);
  };

  const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: A.textTertiary, fontFamily: A.fontSans, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${A.border}`, whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px', fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, borderBottom: `1px solid ${A.border}`, verticalAlign: 'middle' };
  const pill = (status: string) => { const s = DISPUTE_STATUS[status] ?? DISPUTE_STATUS.open; return <span style={{ background: s.bg, color: s.text, fontSize: 12, fontWeight: 500, fontFamily: A.fontSans, borderRadius: 100, padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />{s.label}</span>; };
  const btnStyle = (color = A.textPrimary, bg = A.surface): React.CSSProperties => ({ padding: '6px 14px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, color, background: bg, cursor: 'pointer' });

  if (selected) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button onClick={() => setSelected(null)} style={{ ...btnStyle(), width: 'fit-content' }}>← Volver a disputas</button>

        {/* Job info */}
        <div style={{ ...card, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontFamily: A.fontSans }}>Trabajo</div>
            {job && <div style={{ fontSize: 14, fontFamily: A.fontSans, color: A.textPrimary, lineHeight: 1.8 }}>
              <div><strong>{job.title}</strong></div>
              <div style={{ color: A.textSecondary }}>Estado: {job.status}</div>
              <div style={{ color: A.textSecondary }}>Fecha: {fmtDate(job.scheduled_at)}</div>
              <div style={{ color: A.textSecondary }}>Ubicación: {job.location || '—'}</div>
            </div>}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, fontFamily: A.fontSans }}>Disputa</div>
            <div style={{ fontSize: 14, fontFamily: A.fontSans, color: A.textPrimary, lineHeight: 1.8 }}>
              <div>Abierta por: <strong>{selected.openerName}</strong> ({selected.opened_by_role})</div>
              <div>Motivo: {selected.reason_code}</div>
              {selected.description && <div style={{ color: A.textSecondary, marginTop: 8 }}>{selected.description}</div>}
              <div>Estado: {pill(selected.status)}</div>
              <div style={{ color: A.textSecondary }}>Creada: {relativeTime(selected.created_at)}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Evidence */}
          <div style={card}>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary, marginBottom: 16 }}>Evidencia ({evidence.length})</div>
            {evidence.length === 0 ? <span style={{ color: A.textTertiary, fontSize: 13, fontFamily: A.fontSans }}>Sin evidencia subida</span> : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
                {evidence.map(ev => (
                  <div key={ev.id}>
                    {ev.file_type === 'image'
                      ? <img src={ev.file_url} alt="evidence" onClick={() => setExpanded(expanded === ev.id ? null : ev.id)}
                          style={{ width: '100%', height: expanded === ev.id ? 240 : 100, objectFit: 'cover', borderRadius: 8, border: `1px solid ${A.border}`, cursor: 'pointer', transition: 'height 0.2s' }} />
                      : <video src={ev.file_url} controls style={{ width: '100%', height: 100, borderRadius: 8, border: `1px solid ${A.border}` }} />}
                    <div style={{ fontSize: 11, color: A.textTertiary, fontFamily: A.fontSans, marginTop: 4 }}>{ev.uploaded_by_role}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Admin panel */}
          <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary }}>Fallo</div>
            <select value={ruling} onChange={e => setRuling(e.target.value)}
              style={{ border: `1px solid ${A.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: A.fontSans, color: A.textPrimary, background: A.surface, width: '100%', cursor: 'pointer' }}>
              <option value="">Seleccionar fallo…</option>
              {Object.entries(RULING_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            {ruling === 'split' && (
              <div>
                <label style={{ fontSize: 12, color: A.textSecondary, fontFamily: A.fontSans }}>% reembolso al cliente</label>
                <input type="number" min={0} max={100} value={splitPct} onChange={e => setSplitPct(e.target.value)}
                  style={{ width: '100%', border: `1px solid ${A.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 14, fontFamily: A.fontSans, marginTop: 4 }} />
              </div>
            )}
            <div>
              <label style={{ fontSize: 12, color: A.textSecondary, fontFamily: A.fontSans }}>Notas del administrador</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                style={{ width: '100%', border: `1px solid ${A.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, fontFamily: A.fontSans, marginTop: 4, resize: 'vertical', boxSizing: 'border-box' }} />
            </div>
            <button onClick={saveRuling} disabled={!ruling || saving}
              style={{ ...btnStyle('#fff', A.accent), opacity: !ruling || saving ? 0.5 : 1 }}>
              {saving ? 'Resolviendo…' : 'Resolver disputa'}
            </button>
            {job?.client_id && <button onClick={() => addFlag(job.client_id, 'cliente')} disabled={flagging} style={btnStyle()}>+ Advertencia al cliente</button>}
            {job?.provider_id && <button onClick={() => addFlag(job.provider_id, 'proveedor')} disabled={flagging} style={btnStyle()}>+ Advertencia al proveedor</button>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary }}>Disputas</div>
        <button onClick={fetchDisputes} style={{ padding: '6px 14px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface }}>Actualizar</button>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: A.bg }}>
            <tr>{['ID', 'Trabajo', 'Abierta por', 'Razón', 'Evidencia', 'Estado', 'Fecha', 'Acción'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Cargando…</td></tr>
              : disputes.length === 0 ? <tr><td colSpan={8} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Sin disputas</td></tr>
              : disputes.map(d => (
                <tr key={d.id} onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                  <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>{d.id.slice(0, 8)}</td>
                  <td style={{ ...td, maxWidth: 160 }}>{d.geoMismatch ? '⚠️ ' : ''}{d.jobTitle}</td>
                  <td style={td}>{d.openerName}</td>
                  <td style={td}>{d.reason_code}</td>
                  <td style={{ ...td, fontFamily: A.fontMono }}>{d.evidenceCount ?? 0}</td>
                  <td style={td}>{pill(d.status)}</td>
                  <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>{fmtDate(d.created_at)}</td>
                  <td style={td}><button onClick={() => navigate(`/admin/jobs/${d.job_id}?section=disputas`)} style={{ padding: '5px 12px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 12, fontFamily: A.fontSans, fontWeight: 500, background: '#FBF0EE', color: '#922E24', cursor: 'pointer' }}>Revisar</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
