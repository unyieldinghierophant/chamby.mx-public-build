import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { A, fmtDate, fmtMXN, startOfMonth } from '../adminTokens';
import { toast } from 'sonner';
import { ExternalLink } from 'lucide-react';

interface Payment { id: string; job_id: string; type: string; status: string; amount: number; total_amount_cents: number | null; created_at: string; stripe_payment_intent_id: string | null; jobTitle?: string; clientName?: string }
interface Payout {
  id: string;
  job_id: string | null;
  invoice_id: string | null;
  provider_id: string;
  amount: number;
  status: string;
  stripe_transfer_id: string | null;
  payout_type: string | null;
  release_after: string | null;
  released_at: string | null;
  paid_at: string | null;
  created_at: string;
  providerName?: string;
  providerAvatar?: string | null;
  invoiceTotal?: number | null;
}
interface PaymentStats { capturedMonth: number; refundedMonth: number; pendingHolds: number }
interface PayoutStats { totalHolding: number; totalReleasedMonth: number; totalFailed: number; nextReleaseAt: string | null }

const card: React.CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 24 };

const PAYMENT_STATUS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  authorized:   { bg: '#FDF6E8', text: '#7A5A12', dot: '#A67B1A', label: 'Autorizado' },
  succeeded:    { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Capturado' },
  refunded:     { bg: '#EBF4FF', text: '#1E4E7A', dot: '#2563EB', label: 'Reembolsado' },
  failed:       { bg: '#FBF0EE', text: '#922E24', dot: '#C4473A', label: 'Fallido' },
  cancelled:    { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: 'Cancelado' },
};

const PAYOUT_STATUS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  pending:     { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: 'Pendiente' },
  holding:     { bg: '#FDF6E8', text: '#7A5A12', dot: '#A67B1A', label: 'En retención' },
  released:    { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Liberado' },
  paid:        { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Liberado' }, // legacy alias
  failed:      { bg: '#FBF0EE', text: '#922E24', dot: '#C4473A', label: 'Fallido' },
  cancelled:   { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: 'Cancelado' },
  awaiting_provider_onboarding: { bg: '#FDF6E8', text: '#7A5A12', dot: '#A67B1A', label: 'Esperando Stripe' },
};

type PayoutFilter = 'all' | 'holding' | 'released' | 'failed';

const countdown = (iso: string | null) => {
  if (!iso) return null;
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return 'listo ahora';
  const hrs = Math.floor(ms / 3_600_000);
  if (hrs < 1) return `${Math.max(1, Math.floor(ms / 60_000))} min`;
  if (hrs < 24) return `${hrs} h`;
  return `${Math.floor(hrs / 24)} d`;
};

export function PagosView() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [paymentStats, setPaymentStats] = useState<PaymentStats>({ capturedMonth: 0, refundedMonth: 0, pendingHolds: 0 });
  const [payoutStats, setPayoutStats] = useState<PayoutStats>({ totalHolding: 0, totalReleasedMonth: 0, totalFailed: 0, nextReleaseAt: null });
  const [loading, setLoading] = useState(true);
  const [payoutFilter, setPayoutFilter] = useState<PayoutFilter>('all');
  const [actingPayoutId, setActingPayoutId] = useState<string | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const monthStart = startOfMonth();

    // Payments (existing behaviour)
    const [{ data: recentPayments }, { data: allPays }] = await Promise.all([
      supabase.from('payments').select('id,job_id,type,status,amount,total_amount_cents,created_at,stripe_payment_intent_id').order('created_at', { ascending: false }).limit(100),
      supabase.from('payments').select('status,total_amount_cents,amount').gte('created_at', monthStart),
    ]);

    if (allPays) {
      const captured = allPays.filter(p => p.status === 'succeeded').reduce((s, p) => s + (p.total_amount_cents ?? (p.amount ?? 0) * 100), 0);
      const refunded = allPays.filter(p => ['refunded', 'cancelled'].includes(p.status)).reduce((s, p) => s + (p.total_amount_cents ?? (p.amount ?? 0) * 100), 0);
      const pending = allPays.filter(p => p.status === 'authorized').reduce((s, p) => s + (p.total_amount_cents ?? (p.amount ?? 0) * 100), 0);
      setPaymentStats({ capturedMonth: captured, refundedMonth: refunded, pendingHolds: pending });
    }

    // Payouts — pull last 200 so admin dashboard stays fast
    const { data: payoutRows } = await (supabase as any)
      .from('payouts')
      .select('id,job_id,invoice_id,provider_id,amount,status,stripe_transfer_id,payout_type,release_after,released_at,paid_at,created_at')
      .order('created_at', { ascending: false })
      .limit(200);

    const payoutsArr = (payoutRows ?? []) as Payout[];

    // Enrich with provider names + invoice totals in parallel
    const providerIds = [...new Set(payoutsArr.map(p => p.provider_id).filter(Boolean))];
    const invoiceIds = [...new Set(payoutsArr.map(p => p.invoice_id).filter(Boolean) as string[])];

    const [{ data: providerUsers }, { data: invoiceRows }] = await Promise.all([
      providerIds.length
        ? supabase.from('users').select('id,full_name,avatar_url').in('id', providerIds)
        : Promise.resolve({ data: [] as any[] }),
      invoiceIds.length
        ? supabase.from('invoices').select('id,total_customer_amount').in('id', invoiceIds)
        : Promise.resolve({ data: [] as any[] }),
    ]);

    const nameMap: Record<string, { name: string; avatar: string | null }> = {};
    providerUsers?.forEach((u: any) => { nameMap[u.id] = { name: u.full_name || '—', avatar: u.avatar_url ?? null }; });
    const invoiceMap: Record<string, number> = {};
    invoiceRows?.forEach((i: any) => { invoiceMap[i.id] = i.total_customer_amount ?? 0; });

    const enriched = payoutsArr.map(p => ({
      ...p,
      providerName: nameMap[p.provider_id]?.name ?? '—',
      providerAvatar: nameMap[p.provider_id]?.avatar ?? null,
      invoiceTotal: p.invoice_id ? (invoiceMap[p.invoice_id] ?? null) : null,
    }));
    setPayouts(enriched);

    // Payout stats
    const holding = enriched.filter(p => p.status === 'holding');
    const releasedThisMonth = enriched.filter(p =>
      ['released', 'paid'].includes(p.status) &&
      (p.released_at ?? p.paid_at ?? '') >= monthStart
    );
    const failed = enriched.filter(p => p.status === 'failed');
    const nextRelease = holding
      .map(p => p.release_after)
      .filter(Boolean)
      .sort()[0] ?? null;

    setPayoutStats({
      totalHolding: holding.reduce((s, p) => s + (p.amount ?? 0), 0) * 100,
      totalReleasedMonth: releasedThisMonth.reduce((s, p) => s + (p.amount ?? 0), 0) * 100,
      totalFailed: failed.reduce((s, p) => s + (p.amount ?? 0), 0) * 100,
      nextReleaseAt: nextRelease,
    });

    // Payments table enrichment (unchanged)
    if (!recentPayments?.length) { setPayments([]); setLoading(false); return; }
    const jobIds = [...new Set(recentPayments.map(p => p.job_id).filter(Boolean))];
    const { data: jobs } = await supabase.from('jobs').select('id,title,client_id').in('id', jobIds);
    const jobMap: Record<string, { title: string; client_id: string }> = {};
    jobs?.forEach(j => { jobMap[j.id] = { title: j.title, client_id: j.client_id }; });

    const clientIds = [...new Set(jobs?.map(j => j.client_id).filter(Boolean) ?? [])];
    const { data: users } = await supabase.from('users').select('id,full_name').in('id', clientIds);
    const uMap: Record<string, string> = {};
    users?.forEach(u => { uMap[u.id] = u.full_name || '—'; });

    setPayments(recentPayments.map(p => ({ ...p, jobTitle: jobMap[p.job_id]?.title || '—', clientName: uMap[jobMap[p.job_id]?.client_id] || '—' })));
    setLoading(false);
  };

  const releaseNow = async (payout: Payout) => {
    if (!confirm(`¿Liberar ahora el pago de $${payout.amount.toFixed(2)} MXN a ${payout.providerName}? Se ejecutará un transfer de Stripe inmediatamente.`)) return;
    setActingPayoutId(payout.id);
    const { data, error } = await supabase.functions.invoke('release-provider-payout', { body: { payout_id: payout.id } });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || 'Error al liberar el pago');
    } else {
      toast.success(`Liberado (transfer ${data.transfer_id?.slice(-8) ?? ''})`);
      fetchData();
    }
    setActingPayoutId(null);
  };

  const cancelPayout = async (payout: Payout) => {
    if (!confirm(`¿Cancelar el pago en retención de ${payout.providerName}? No se ejecutará ninguna transferencia de Stripe.`)) return;
    setActingPayoutId(payout.id);
    const { error } = await (supabase as any)
      .from('payouts')
      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
      .eq('id', payout.id);
    if (error) toast.error(error.message);
    else { toast.success('Pago cancelado'); fetchData(); }
    setActingPayoutId(null);
  };

  const filteredPayouts = useMemo(() => {
    if (payoutFilter === 'all') return payouts;
    if (payoutFilter === 'released') return payouts.filter(p => p.status === 'released' || p.status === 'paid');
    return payouts.filter(p => p.status === payoutFilter);
  }, [payouts, payoutFilter]);

  const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: A.textTertiary, fontFamily: A.fontSans, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${A.border}`, whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px', fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, borderBottom: `1px solid ${A.border}`, verticalAlign: 'middle' };

  const paymentPill = (s: string) => {
    const p = PAYMENT_STATUS[s] ?? { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: s };
    return <span style={{ background: p.bg, color: p.text, fontSize: 12, fontWeight: 500, fontFamily: A.fontSans, borderRadius: 100, padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: p.dot }} />{p.label}</span>;
  };
  const payoutPill = (s: string) => {
    const p = PAYOUT_STATUS[s] ?? { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: s };
    return <span style={{ background: p.bg, color: p.text, fontSize: 12, fontWeight: 500, fontFamily: A.fontSans, borderRadius: 100, padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: p.dot }} />{p.label}</span>;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── Payout dashboard ────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { label: 'En retención', value: fmtMXN(payoutStats.totalHolding), color: '#A67B1A' },
            { label: 'Liberados este mes', value: fmtMXN(payoutStats.totalReleasedMonth), color: A.accent },
            { label: 'Fallidos (revisar)', value: fmtMXN(payoutStats.totalFailed), color: payoutStats.totalFailed > 0 ? '#C4473A' : A.textPrimary },
            { label: 'Próxima liberación', value: payoutStats.nextReleaseAt ? (countdown(payoutStats.nextReleaseAt) ?? '—') : '—', color: A.textPrimary, sub: payoutStats.nextReleaseAt ? fmtDate(payoutStats.nextReleaseAt) : '' },
          ].map(s => (
            <div key={s.label} style={card}>
              <div style={{ fontSize: 11, fontWeight: 600, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: A.fontSans, marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 24, fontWeight: 600, fontFamily: A.fontMono, color: s.color }}>{s.value}</div>
              {s.sub && <div style={{ fontSize: 11, color: A.textTertiary, fontFamily: A.fontMono, marginTop: 2 }}>{s.sub}</div>}
            </div>
          ))}
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 10 }}>
            <div style={{ fontSize: 15, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary }}>Payouts a proveedores</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['all', 'holding', 'released', 'failed'] as PayoutFilter[]).map(f => {
                const active = payoutFilter === f;
                const labelMap: Record<PayoutFilter, string> = { all: 'Todos', holding: 'En retención', released: 'Liberados', failed: 'Fallidos' };
                return (
                  <button key={f} onClick={() => setPayoutFilter(f)}
                    style={{ padding: '6px 12px', border: `1px solid ${active ? A.accent : A.border}`, borderRadius: 6, fontSize: 12, fontFamily: A.fontSans, fontWeight: active ? 600 : 500, cursor: 'pointer', background: active ? A.accentLight : A.surface, color: active ? A.accentText : A.textSecondary }}>
                    {labelMap[f]}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
              <thead style={{ background: A.bg }}>
                <tr>{['Proveedor', 'Trabajo', 'Factura / Proveedor / Chamby', 'Estado', 'Liberación', 'Stripe', 'Acciones'].map(h => <th key={h} style={th}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Cargando…</td></tr>
                ) : filteredPayouts.length === 0 ? (
                  <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Sin payouts en esta vista</td></tr>
                ) : filteredPayouts.map(p => {
                  const invoice = p.invoiceTotal ?? Math.round((p.amount / 0.9) * 100) / 100;
                  const chambyCut = Math.max(0, invoice - p.amount);
                  const countdownText = countdown(p.release_after);
                  const urgent = p.release_after && new Date(p.release_after).getTime() - Date.now() < 24 * 60 * 60 * 1000;
                  return (
                    <tr key={p.id} onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                      <td style={td}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ width: 30, height: 30, borderRadius: '50%', background: A.accentLight, color: A.accentText, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, flexShrink: 0, overflow: 'hidden' }}>
                            {p.providerAvatar ? <img src={p.providerAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (p.providerName?.[0]?.toUpperCase() ?? '?')}
                          </div>
                          <span style={{ fontWeight: 500 }}>{p.providerName}</span>
                        </div>
                      </td>
                      <td style={td}>
                        {p.job_id ? (
                          <button onClick={() => navigate(`/admin/jobs/${p.job_id}`)}
                            style={{ background: 'none', border: 'none', color: A.accent, fontFamily: A.fontMono, fontSize: 12, cursor: 'pointer', padding: 0, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {p.job_id.slice(0, 8)} <ExternalLink size={11} strokeWidth={2} />
                          </button>
                        ) : <span style={{ color: A.textTertiary }}>—</span>}
                      </td>
                      <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: A.textSecondary }}>Factura: {fmtMXN(invoice * 100)}</span>
                          <span style={{ fontWeight: 600 }}>Proveedor: {fmtMXN(p.amount * 100)}</span>
                          <span style={{ color: A.textTertiary }}>Chamby: {fmtMXN(chambyCut * 100)}</span>
                        </div>
                      </td>
                      <td style={td}>{payoutPill(p.status)}</td>
                      <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>
                        {p.status === 'holding' && p.release_after ? (
                          <div>
                            <div style={{ color: urgent ? '#C4473A' : A.textPrimary, fontWeight: urgent ? 700 : 500 }}>{countdownText}</div>
                            <div style={{ fontSize: 10, color: A.textTertiary }}>{fmtDate(p.release_after)}</div>
                          </div>
                        ) : p.released_at || p.paid_at ? (
                          <span style={{ color: A.textTertiary }}>{fmtDate(p.released_at ?? p.paid_at)}</span>
                        ) : <span style={{ color: A.textTertiary }}>—</span>}
                      </td>
                      <td style={{ ...td, fontFamily: A.fontMono, fontSize: 11 }}>
                        {p.stripe_transfer_id ? (
                          <a href={`https://dashboard.stripe.com/connect/transfers/${p.stripe_transfer_id}`} target="_blank" rel="noopener noreferrer" style={{ color: A.accent, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            {p.stripe_transfer_id.slice(-10)} <ExternalLink size={11} strokeWidth={2} />
                          </a>
                        ) : <span style={{ color: A.textTertiary }}>—</span>}
                      </td>
                      <td style={td}>
                        {p.status === 'holding' && (
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button onClick={() => releaseNow(p)} disabled={actingPayoutId === p.id}
                              style={{ padding: '5px 10px', border: `1px solid ${A.accent}`, borderRadius: 6, fontSize: 12, fontFamily: A.fontSans, fontWeight: 500, background: A.accentLight, color: A.accentText, cursor: 'pointer', opacity: actingPayoutId === p.id ? 0.5 : 1 }}>
                              Liberar ahora
                            </button>
                            <button onClick={() => cancelPayout(p)} disabled={actingPayoutId === p.id}
                              style={{ padding: '5px 10px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 12, fontFamily: A.fontSans, background: A.surface, color: A.textSecondary, cursor: 'pointer', opacity: actingPayoutId === p.id ? 0.5 : 1 }}>
                              Cancelar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── Payments (existing) ─────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
          {[
            { label: 'Capturado este mes', value: fmtMXN(paymentStats.capturedMonth), color: A.accent },
            { label: 'Reembolsado este mes', value: fmtMXN(paymentStats.refundedMonth), color: paymentStats.refundedMonth > 0 ? '#2563EB' : A.textPrimary },
            { label: 'Holds pendientes', value: fmtMXN(paymentStats.pendingHolds), color: paymentStats.pendingHolds > 0 ? '#A67B1A' : A.textPrimary },
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
                      <td style={td}>{paymentPill(p.status)}</td>
                      <td style={{ ...td, fontFamily: A.fontMono, fontSize: 12 }}>{fmtDate(p.created_at)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
