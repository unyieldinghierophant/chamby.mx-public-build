import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { A, fmtDate, fmtMXN, startOfMonth } from '../adminTokens';

interface Payment { id: string; job_id: string; type: string; status: string; amount: number; total_amount_cents: number | null; created_at: string; stripe_payment_intent_id: string | null; jobTitle?: string; clientName?: string }
interface Stats { capturedMonth: number; refundedMonth: number; pendingHolds: number }

const card: React.CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 24 };

const PAYMENT_STATUS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  authorized:   { bg: '#FDF6E8', text: '#7A5A12', dot: '#A67B1A', label: 'Autorizado' },
  succeeded:    { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Capturado' },
  refunded:     { bg: '#EBF4FF', text: '#1E4E7A', dot: '#2563EB', label: 'Reembolsado' },
  failed:       { bg: '#FBF0EE', text: '#922E24', dot: '#C4473A', label: 'Fallido' },
  cancelled:    { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: 'Cancelado' },
};

export function PagosView() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<Stats>({ capturedMonth: 0, refundedMonth: 0, pendingHolds: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const monthStart = startOfMonth();

    const [{ data }, { data: allPays }] = await Promise.all([
      supabase.from('payments').select('id,job_id,type,status,amount,total_amount_cents,created_at,stripe_payment_intent_id').order('created_at', { ascending: false }).limit(100),
      supabase.from('payments').select('status,total_amount_cents,amount').gte('created_at', monthStart),
    ]);

    if (allPays) {
      const captured = allPays.filter(p => p.status === 'succeeded').reduce((s, p) => s + (p.total_amount_cents ?? (p.amount ?? 0) * 100), 0);
      const refunded = allPays.filter(p => ['refunded', 'cancelled'].includes(p.status)).reduce((s, p) => s + (p.total_amount_cents ?? (p.amount ?? 0) * 100), 0);
      const pending = allPays.filter(p => p.status === 'authorized').reduce((s, p) => s + (p.total_amount_cents ?? (p.amount ?? 0) * 100), 0);
      setStats({ capturedMonth: captured, refundedMonth: refunded, pendingHolds: pending });
    }

    if (!data?.length) { setPayments([]); setLoading(false); return; }

    const jobIds = [...new Set(data.map(p => p.job_id).filter(Boolean))];
    const { data: jobs } = await supabase.from('jobs').select('id,title,client_id').in('id', jobIds);
    const jobMap: Record<string, { title: string; client_id: string }> = {};
    jobs?.forEach(j => { jobMap[j.id] = { title: j.title, client_id: j.client_id }; });

    const clientIds = [...new Set(jobs?.map(j => j.client_id).filter(Boolean) ?? [])];
    const { data: users } = await supabase.from('users').select('id,full_name').in('id', clientIds);
    const uMap: Record<string, string> = {};
    users?.forEach(u => { uMap[u.id] = u.full_name || '—'; });

    setPayments(data.map(p => ({ ...p, jobTitle: jobMap[p.job_id]?.title || '—', clientName: uMap[jobMap[p.job_id]?.client_id] || '—' })));
    setLoading(false);
  };

  const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: A.textTertiary, fontFamily: A.fontSans, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${A.border}`, whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px', fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, borderBottom: `1px solid ${A.border}`, verticalAlign: 'middle' };
  const pill = (s: string) => { const p = PAYMENT_STATUS[s] ?? { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: s }; return <span style={{ background: p.bg, color: p.text, fontSize: 12, fontWeight: 500, fontFamily: A.fontSans, borderRadius: 100, padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: p.dot }} />{p.label}</span>; };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[
          { label: 'Capturado este mes', value: fmtMXN(stats.capturedMonth), color: A.accent },
          { label: 'Reembolsado este mes', value: fmtMXN(stats.refundedMonth), color: stats.refundedMonth > 0 ? '#2563EB' : A.textPrimary },
          { label: 'Holds pendientes', value: fmtMXN(stats.pendingHolds), color: stats.pendingHolds > 0 ? '#A67B1A' : A.textPrimary },
        ].map(s => (
          <div key={s.label} style={card}>
            <div style={{ fontSize: 11, fontWeight: 600, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: A.fontSans, marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: 24, fontWeight: 600, fontFamily: A.fontMono, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary }}>Pagos recientes</div>
          <button onClick={fetchData} style={{ padding: '6px 14px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface }}>Actualizar</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: A.bg }}>
              <tr>{['ID Stripe','Trabajo','Cliente','Tipo','Monto','Estado','Fecha'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Cargando…</td></tr>
                : payments.length === 0 ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Sin pagos</td></tr>
                : payments.map(p => (
                  <tr key={p.id} onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ ...td, fontFamily: A.fontMono, fontSize: 11 }}>{p.stripe_payment_intent_id?.slice(-12) ?? '—'}</td>
                    <td style={td}>{p.jobTitle}</td>
                    <td style={td}>{p.clientName}</td>
                    <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>{p.type}</td>
                    <td style={{ ...td, fontFamily: A.fontMono, fontWeight: 600 }}>{fmtMXN(p.total_amount_cents ?? (p.amount ?? 0) * 100)}</td>
                    <td style={td}>{pill(p.status)}</td>
                    <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>{fmtDate(p.created_at)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
