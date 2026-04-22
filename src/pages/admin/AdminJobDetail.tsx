import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { A, ADMIN_ID, statusPill, fmtDate, fmtMXN, relativeTime } from './adminTokens';
import { LeafletMap } from './components/LeafletMap';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Job { id: string; title: string; category: string; service_type: string | null; description: string | null; problem: string | null; location: string | null; scheduled_at: string | null; status: string; created_at: string; updated_at: string; client_id: string; provider_id: string | null; photos: string[] | null; total_amount: number | null; stripe_visit_payment_intent_id: string | null; visit_fee_amount: number | null; visit_fee_paid: boolean | null; cancellation_requested_by: string | null; cancellation_requested_at: string | null; late_cancellation_penalty_applied: boolean | null; arrived_lat: number | null; arrived_lng: number | null; arrived_at: string | null; job_address_lat: number | null; job_address_lng: number | null; geolocation_mismatch: boolean | null; has_open_dispute: boolean | null; dispute_status: string | null; reschedule_requested_by: string | null; reschedule_proposed_datetime: string | null; reschedule_agreed: boolean | null }
interface UserProfile { id: string; full_name: string | null; email: string | null; phone: string | null; avatar_url: string | null; flag_count: number; account_status: string; created_at: string }
interface ProviderData { rating: number | null; total_reviews: number | null; stripe_payouts_enabled: boolean | null; stripe_account_id: string | null }
interface ProviderDetails { verification_status: string | null; ine_front_url: string | null; background_check_status: string | null; interview_completed: boolean | null }
interface Document { id: string; doc_type: string; file_url: string; verification_status: string | null }
interface Payment { id: string; type: string; status: string; amount: number; total_amount_cents: number | null; stripe_payment_intent_id: string | null; created_at: string }
interface Payout { id: string; amount: number; status: string; payout_type: string; paid_at: string | null }
interface Message { id: string; sender_id: string; message_text: string; attachment_url: string | null; is_system_message: boolean; system_event_type: string | null; created_at: string }
interface Invoice { id: string; status: string; total_customer_amount: number; subtotal_provider: number; provider_payout_amount: number | null }
interface Dispute { id: string; opened_by_role: string; reason_code: string; description: string | null; status: string; admin_ruling: string | null; admin_notes: string | null; split_percentage_client: number | null; resolved_at: string | null; created_at: string }
interface Evidence { id: string; dispute_id: string; file_url: string; file_type: string; description: string | null; uploaded_by_role: string; created_at: string }

// ── Helpers ────────────────────────────────────────────────────────────────────
const card = (extra?: React.CSSProperties): React.CSSProperties => ({ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 20, ...extra });
const sectionTitle = (t: string) => <div style={{ fontSize: 13, fontWeight: 700, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: A.fontSans, marginBottom: 14 }}>{t}</div>;
const infoRow = (label: string, value: React.ReactNode) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${A.border}` }}>
    <span style={{ fontSize: 12, color: A.textTertiary, fontFamily: A.fontSans, flexShrink: 0, marginRight: 12 }}>{label}</span>
    <span style={{ fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, textAlign: 'right' }}>{value}</span>
  </div>
);
const pill = (status: string) => { const s = statusPill(status); return <span style={{ background: s.bg, color: s.text, fontSize: 12, fontWeight: 500, fontFamily: A.fontSans, borderRadius: 100, padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot }} />{s.label}</span>; };
const haversineM = (lat1: number, lng1: number, lat2: number, lng2: number) => { const R = 6371000, r = (d: number) => d * Math.PI / 180, dL = r(lat2 - lat1), dG = r(lng2 - lng1); const a = Math.sin(dL/2)**2 + Math.cos(r(lat1))*Math.cos(r(lat2))*Math.sin(dG/2)**2; return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))); };

// ── Component ──────────────────────────────────────────────────────────────────
export default function AdminJobDetail() {
  const { bookingId } = useParams<{ bookingId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const disputeSectionRef = useRef<HTMLDivElement>(null);

  const [job, setJob] = useState<Job | null>(null);
  const [client, setClient] = useState<UserProfile | null>(null);
  const [provider, setProvider] = useState<UserProfile | null>(null);
  const [providerData, setProviderData] = useState<ProviderData | null>(null);
  const [providerDetails, setProviderDetails] = useState<ProviderDetails | null>(null);
  const [docs, setDocs] = useState<Document[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [dispute, setDispute] = useState<Dispute | null>(null);
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [clientJobCount, setClientJobCount] = useState(0);
  const [providerJobCount, setProviderJobCount] = useState(0);
  const [userMap, setUserMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState<string | null>(null);

  // Right panel state
  const [statusModal, setStatusModal] = useState(false);
  const [pendingStatus, setPendingStatus] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundModal, setRefundModal] = useState<'full' | 'partial' | 'payout' | null>(null);
  const [flagModal, setFlagModal] = useState<'client' | 'provider' | null>(null);
  const [dangerModal, setDangerModal] = useState<'cancel' | 'suspend_client' | 'suspend_provider' | null>(null);
  const [dangerStep, setDangerStep] = useState(1);
  const [ruling, setRuling] = useState('');
  const [splitPct, setSplitPct] = useState('50');
  const [adminNotes, setAdminNotes] = useState('');
  const [acting, setActing] = useState(false);
  const [rescheduleActing, setRescheduleActing] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && (!user || user.id !== ADMIN_ID)) navigate('/', { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user?.id === ADMIN_ID && bookingId) fetchAll();
  }, [user, bookingId]);

  useEffect(() => {
    if (searchParams.get('section') === 'disputas' && disputeSectionRef.current) {
      setTimeout(() => disputeSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 500);
    }
  }, [searchParams, dispute]);

  const fetchAll = async () => {
    if (!bookingId) return;
    setLoading(true);

    const { data: jobData } = await supabase.from('jobs').select('*').eq('id', bookingId).single();
    if (!jobData) { setLoading(false); return; }
    setJob(jobData as Job);

    const [
      { data: clientData },
      { data: paymentsData },
      { data: payoutsData },
      { data: msgsData },
      { data: invoiceData },
      { count: cjc },
    ] = await Promise.all([
      supabase.from('users').select('id,full_name,email,phone,avatar_url,flag_count,account_status,created_at').eq('id', jobData.client_id).single(),
      supabase.from('payments').select('*').eq('job_id', bookingId).order('created_at'),
      supabase.from('payouts').select('*').eq('job_id', bookingId).order('paid_at'),
      supabase.from('messages').select('*').eq('job_id', bookingId).order('created_at'),
      supabase.from('invoices').select('id,status,total_customer_amount,subtotal_provider,provider_payout_amount').eq('job_id', bookingId).maybeSingle(),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('client_id', jobData.client_id).eq('status', 'completed'),
    ]);

    setClient(clientData as UserProfile);
    setPayments((paymentsData as Payment[]) || []);
    setPayouts((payoutsData as Payout[]) || []);
    setMessages((msgsData as Message[]) || []);
    setInvoice(invoiceData as Invoice);
    setClientJobCount(cjc ?? 0);

    // Dispute
    const { data: disputeData } = await (supabase as any).from('disputes').select('*').eq('job_id', bookingId).maybeSingle();
    setDispute(disputeData ?? null);
    if (disputeData) {
      const { data: ev } = await (supabase as any).from('dispute_evidence').select('*').eq('dispute_id', disputeData.id).order('created_at');
      setEvidence(ev ?? []);
    }

    // Provider
    if (jobData.provider_id) {
      const [{ data: provUser }, { data: prov }, { data: pd }, { data: docData }, { count: pjc }] = await Promise.all([
        supabase.from('users').select('id,full_name,email,phone,avatar_url,flag_count,account_status,created_at').eq('id', jobData.provider_id).single(),
        supabase.from('providers').select('rating,total_reviews,stripe_payouts_enabled,stripe_account_id').eq('user_id', jobData.provider_id).maybeSingle(),
        supabase.from('provider_details').select('verification_status,ine_front_url,background_check_status,interview_completed').eq('user_id', jobData.provider_id).maybeSingle(),
        supabase.from('documents').select('id,doc_type,file_url,verification_status').eq('provider_id', jobData.provider_id),
        supabase.from('jobs').select('id', { count: 'exact', head: true }).eq('provider_id', jobData.provider_id).eq('status', 'completed'),
      ]);
      setProvider(provUser as UserProfile);
      setProviderData(prov as ProviderData);
      setProviderDetails(pd as ProviderDetails);
      setDocs((docData as Document[]) || []);
      setProviderJobCount(pjc ?? 0);
    }

    // Build user name map for chat
    const uids = [...new Set(msgsData?.map(m => m.sender_id).filter(Boolean) ?? [])];
    if (uids.length) {
      const { data: chatUsers } = await supabase.from('users').select('id,full_name').in('id', uids);
      const map: Record<string, string> = {};
      chatUsers?.forEach(u => { map[u.id] = u.full_name || 'Usuario'; });
      setUserMap(map);
    }

    setLoading(false);
  };

  // ── Actions ────────────────────────────────────────────────────────────────
  const paymentAction = async (action: string, amount?: number) => {
    setActing(true);
    try {
      const { data, error } = await supabase.functions.invoke('admin-payment-action', { body: { action, job_id: bookingId, ...(amount ? { amount_cents: amount } : {}) } });
      if (error || data?.error) { toast.error(data?.error || error?.message || 'Error'); }
      else { toast.success('Acción procesada exitosamente'); fetchAll(); }
    } catch (e: any) { toast.error(e.message); }
    setActing(false);
    setRefundModal(null);
  };

  const changeStatus = async () => {
    if (!pendingStatus) return;
    setActing(true);
    await supabase.from('jobs').update({ status: pendingStatus, updated_at: new Date().toISOString() }).eq('id', bookingId!);
    toast.success('Estado actualizado');
    setStatusModal(false); setPendingStatus(''); setActing(false);
    fetchAll();
  };

  const addFlag = async (role: 'client' | 'provider') => {
    const uid = role === 'client' ? job?.client_id : job?.provider_id;
    if (!uid) return;
    setActing(true);
    const { data: u } = await supabase.from('users').select('flag_count,account_status').eq('id', uid).single();
    const newCount = (u?.flag_count ?? 0) + 1;
    const newStatus = newCount >= 6 ? 'suspended' : newCount >= 3 ? 'frozen' : u?.account_status ?? 'active';
    await supabase.from('users').update({ flag_count: newCount, account_status: newStatus }).eq('id', uid);
    await (supabase as any).from('account_flags').insert({ user_id: uid, reason: `Advertencia admin — trabajo ${bookingId?.slice(0,8)}`, flagged_by: 'admin', booking_id: bookingId });
    toast.success(`Advertencia agregada (flag ${newCount})`);
    setFlagModal(null); setActing(false);
    fetchAll();
  };

  const resolveDispute = async () => {
    if (!dispute || !ruling) return;
    setActing(true);
    const { data, error } = await supabase.functions.invoke('resolve-dispute', { body: { dispute_id: dispute.id, admin_ruling: ruling, split_percentage_client: ruling === 'split' ? parseInt(splitPct) : null, admin_notes: adminNotes } });
    if (error || data?.error) toast.error(data?.error || error?.message || 'Error');
    else { toast.success(data.stripe_errors?.length ? `Resuelto. Stripe: ${data.stripe_errors[0]}` : 'Disputa resuelta'); fetchAll(); }
    setActing(false);
  };

  const approveReschedule = async () => {
    if (!job) return;
    setRescheduleActing(true);
    await supabase.from('jobs').update({ scheduled_at: job.reschedule_proposed_datetime, reschedule_agreed: true, reschedule_requested_by: null, reschedule_requested_at: null, reschedule_proposed_datetime: null }).eq('id', bookingId!);
    toast.success('Reagendamiento aprobado');
    setRescheduleActing(false); fetchAll();
  };

  const rejectReschedule = async () => {
    if (!job) return;
    setRescheduleActing(true);
    await supabase.from('jobs').update({ reschedule_requested_by: null, reschedule_requested_at: null, reschedule_proposed_datetime: null, reschedule_agreed: false }).eq('id', bookingId!);
    toast.success('Reagendamiento rechazado');
    setRescheduleActing(false); fetchAll();
  };

  const suspendUser = async (role: 'client' | 'provider') => {
    const uid = role === 'client' ? job?.client_id : job?.provider_id;
    if (!uid) return;
    setActing(true);
    await supabase.from('users').update({ account_status: 'suspended' }).eq('id', uid);
    toast.success(`${role === 'client' ? 'Cliente' : 'Proveedor'} suspendido`);
    setDangerModal(null); setDangerStep(1); setActing(false);
    fetchAll();
  };

  const cancelJob = async () => {
    setActing(true);
    const { data, error } = await supabase.functions.invoke('cancel-job', { body: { job_id: bookingId, cancelled_by: 'client' } });
    if (error || data?.error) toast.error(data?.error || error?.message || 'Error al cancelar');
    else { toast.success('Trabajo cancelado'); fetchAll(); }
    setDangerModal(null); setDangerStep(1); setActing(false);
  };

  const whatsapp = (phone: string | null, name: string) => {
    if (!phone) return;
    const clean = phone.replace(/\D/g, '');
    const num = clean.startsWith('52') ? clean : `52${clean}`;
    const msg = encodeURIComponent(`Hola ${name}, soy el equipo de Chamby. Te contactamos respecto al trabajo #${bookingId?.slice(0,8)} — ${job?.title ?? ''}.`);
    window.open(`https://wa.me/${num}?text=${msg}`, '_blank');
  };

  // ── Sub-components ─────────────────────────────────────────────────────────
  const Avatar = ({ u, size = 48 }: { u: UserProfile | null; size?: number }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: A.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, color: A.accentText, fontFamily: A.fontSans, flexShrink: 0, overflow: 'hidden' }}>
      {u?.avatar_url ? <img src={u.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (u?.full_name?.charAt(0) ?? '?')}
    </div>
  );

  const PersonCard = ({ u, data, isProvider }: { u: UserProfile | null; data?: ProviderData | null; isProvider?: boolean }) => {
    if (!u && isProvider) return (
      <div style={{ ...card(), display: 'flex', alignItems: 'center', justifyContent: 'center', height: 160, color: A.textTertiary, fontFamily: A.fontSans, fontSize: 13 }}>Sin proveedor asignado</div>
    );
    if (!u) return null;
    return (
      <div style={card()}>
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          <Avatar u={u} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 600, color: A.textPrimary, fontFamily: A.fontSans }}>{u.full_name ?? '—'}</div>
            <div style={{ fontSize: 12, color: A.textTertiary, fontFamily: A.fontSans }}>{isProvider ? 'Proveedor' : 'Cliente'}</div>
            {u.flag_count > 0 && <div style={{ fontSize: 12, color: '#A67B1A', fontFamily: A.fontSans, marginTop: 4 }}>⚠ {u.flag_count} advertencia{u.flag_count > 1 ? 's' : ''}</div>}
          </div>
          {pill(u.account_status)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {infoRow('Email', <a href={`mailto:${u.email}`} style={{ color: A.accent }}>{u.email}</a>)}
          {infoRow('Teléfono', u.phone ? <a href={`tel:${u.phone}`} style={{ color: A.accent }}>{u.phone}</a> : '—')}
          {infoRow('Miembro desde', fmtDate(u.created_at))}
          {infoRow('Trabajos completados', isProvider ? providerJobCount : clientJobCount)}
          {isProvider && data && <>{infoRow('Calificación', data.rating ? `⭐ ${Number(data.rating).toFixed(1)} (${data.total_reviews ?? 0})` : 'Sin calificaciones')}</>}
          {isProvider && providerDetails && infoRow('Verificación', providerDetails.verification_status ?? '—')}
        </div>
        {u.phone && (
          <button onClick={() => whatsapp(u.phone, u.full_name ?? '')} style={{ marginTop: 12, width: '100%', padding: '7px', border: `1px solid #25D366`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, background: '#F0FBF4', color: '#1A7A3A', cursor: 'pointer' }}>
            WhatsApp →
          </button>
        )}
      </div>
    );
  };

  const DocBadge = ({ label, ok }: { label: string; ok: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontFamily: A.fontSans, color: ok ? A.accentText : '#922E24' }}>
      <span>{ok ? '✓' : '✕'}</span>{label}
    </div>
  );

  const ConfirmModal = ({ title, message, onConfirm, onCancel, destructive }: { title: string; message: string; onConfirm: () => void; onCancel: () => void; destructive?: boolean }) => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div style={{ background: A.surface, borderRadius: 16, padding: 28, maxWidth: 400, width: '100%' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: A.textPrimary, fontFamily: A.fontSans, marginBottom: 10 }}>{title}</div>
        <div style={{ fontSize: 14, color: A.textSecondary, fontFamily: A.fontSans, marginBottom: 24, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: '9px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 14, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface }}>Cancelar</button>
          <button onClick={onConfirm} disabled={acting} style={{ flex: 1, padding: '9px', border: 'none', borderRadius: 8, fontSize: 14, fontFamily: A.fontSans, fontWeight: 600, cursor: 'pointer', background: destructive ? '#C4473A' : A.accent, color: '#fff', opacity: acting ? 0.6 : 1 }}>{acting ? 'Procesando…' : 'Confirmar'}</button>
        </div>
      </div>
    </div>
  );

  if (!authLoading && (!user || user.id !== ADMIN_ID)) return null;

  const visitFeePayment = payments.find(p => p.type === 'visit_fee');
  const invoicePayment = payments.find(p => ['invoice_payment', 'invoice'].includes(p.type));
  const providerPayout = payouts.find(p => p.payout_type === 'job_completion');
  const geoDistance = (job?.arrived_lat && job?.job_address_lat) ? haversineM(job.arrived_lat, job.arrived_lng!, job.job_address_lat, job.job_address_lng!) : null;
  const hasCancelHistory = !!(job?.cancellation_requested_by || job?.late_cancellation_penalty_applied);
  const hasRescheduleRequest = !!(job?.reschedule_requested_by && !job?.reschedule_agreed);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.fontSans }}>
      {/* Top bar */}
      <div style={{ position: 'sticky', top: 0, zIndex: 30, background: A.surface, borderBottom: `1px solid ${A.border}`, padding: '0 28px', height: 56, display: 'flex', alignItems: 'center', gap: 16 }}>
        <button onClick={() => navigate('/admin')} style={{ background: 'none', border: 'none', fontSize: 14, color: A.textSecondary, fontFamily: A.fontSans, cursor: 'pointer', padding: '6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>← Volver a trabajos</button>
        {job && (
          <>
            <span style={{ color: A.border }}>|</span>
            <div style={{ fontSize: 15, fontWeight: 700, color: A.textPrimary, fontFamily: A.fontSans }}>{job.title}</div>
            {pill(job.has_open_dispute ? 'disputed' : job.status)}
            <span style={{ fontFamily: A.fontMono, fontSize: 12, color: A.textTertiary }}>{job.id.slice(0,8)}</span>
          </>
        )}
      </div>

      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: A.textTertiary, fontFamily: A.fontSans }}>Cargando…</div>
      ) : !job ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#C4473A', fontFamily: A.fontSans }}>Trabajo no encontrado</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '60% 40%', gap: 0, minHeight: 'calc(100vh - 56px)' }}>

          {/* ── LEFT COLUMN ─────────────────────────────────────────────────── */}
          <div style={{ padding: 28, display: 'flex', flexDirection: 'column', gap: 20, borderRight: `1px solid ${A.border}` }}>

            {/* SECTION 1 — Personas */}
            <section>
              {sectionTitle('Personas')}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <PersonCard u={client} />
                <PersonCard u={provider} data={providerData} isProvider />
              </div>
              {/* Provider docs */}
              {provider && docs.length > 0 && (
                <div style={{ ...card(), marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: A.textTertiary, marginBottom: 10, fontFamily: A.fontSans }}>Documentos</div>
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                    <DocBadge label="INE" ok={docs.some(d => d.doc_type?.toLowerCase().includes('ine') && d.verification_status === 'approved') || !!providerDetails?.ine_front_url} />
                    <DocBadge label="CURP" ok={docs.some(d => d.doc_type?.toLowerCase().includes('curp'))} />
                    <DocBadge label="Comprobante domicilio" ok={docs.some(d => d.doc_type?.toLowerCase().includes('address') || d.doc_type?.toLowerCase().includes('domicilio'))} />
                    <DocBadge label="Antecedentes" ok={providerDetails?.background_check_status === 'clear'} />
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 2 — Detalles del trabajo */}
            <section>
              {sectionTitle('Detalles del trabajo')}
              <div style={card()}>
                {infoRow('Categoría', job.category + (job.service_type ? ` / ${job.service_type}` : ''))}
                {infoRow('Fecha programada', fmtDate(job.scheduled_at))}
                {infoRow('Creado', fmtDate(job.created_at))}
                {infoRow('Última actualización', relativeTime(job.updated_at))}
                {(job.description || job.problem) && (
                  <div style={{ padding: '10px 0', borderBottom: `1px solid ${A.border}` }}>
                    <div style={{ fontSize: 12, color: A.textTertiary, marginBottom: 4, fontFamily: A.fontSans }}>Descripción</div>
                    <div style={{ fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, lineHeight: 1.6 }}>{job.description || job.problem}</div>
                  </div>
                )}
                {infoRow('Ubicación', job.location || '—')}
              </div>
              {/* Map if we have coordinates */}
              {job.job_address_lat && job.job_address_lng && (
                <div style={{ marginTop: 12 }}>
                  <LeafletMap center={[job.job_address_lat, job.job_address_lng]} markers={[{ lat: job.job_address_lat, lng: job.job_address_lng, color: A.accent, label: 'Domicilio del trabajo' }]} height={200} />
                </div>
              )}
              {/* Status timeline from system messages */}
              {messages.filter(m => m.is_system_message).length > 0 && (
                <div style={{ ...card(), marginTop: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: A.textTertiary, marginBottom: 12, fontFamily: A.fontSans }}>Historial de estado</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {messages.filter(m => m.is_system_message).map(m => (
                      <div key={m.id} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: A.accent, marginTop: 5, flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 12, color: A.textPrimary, fontFamily: A.fontSans }}>{m.message_text}</div>
                          <div style={{ fontSize: 11, color: A.textTertiary, fontFamily: A.fontMono, marginTop: 2 }}>{relativeTime(m.created_at)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 3 — Geolocalización */}
            {job.arrived_at && (
              <section>
                {sectionTitle('Geolocalización del check-in')}
                <div style={card()}>
                  {job.geolocation_mismatch && geoDistance !== null && (
                    <div style={{ background: '#FDF6E8', border: '1px solid #E8C94A', borderRadius: 8, padding: '10px 14px', marginBottom: 14, fontSize: 13, color: '#7A5A12', fontFamily: A.fontSans }}>
                      ⚠ El proveedor registró check-in a <strong>{geoDistance} metros</strong> del domicilio
                    </div>
                  )}
                  {job.arrived_lat && job.arrived_lng && (
                    <div style={{ marginBottom: 14 }}>
                      <LeafletMap
                        center={[job.arrived_lat, job.arrived_lng]}
                        markers={[
                          ...(job.job_address_lat && job.job_address_lng ? [{ lat: job.job_address_lat, lng: job.job_address_lng, color: A.accent, label: 'Domicilio' }] : []),
                          { lat: job.arrived_lat, lng: job.arrived_lng, color: '#C4473A', label: 'Check-in del proveedor' },
                        ]}
                        drawLine={geoDistance !== null && geoDistance > 50}
                        height={220}
                      />
                    </div>
                  )}
                  {infoRow('Check-in', fmtDate(job.arrived_at))}
                  {geoDistance !== null && infoRow('Distancia al domicilio', `${geoDistance} m`)}
                  {job.arrived_lat && infoRow('Coordenadas GPS', <span style={{ fontFamily: A.fontMono, fontSize: 11 }}>{job.arrived_lat.toFixed(6)}, {job.arrived_lng?.toFixed(6)}</span>)}
                </div>
              </section>
            )}

            {/* SECTION 4 — Pagos */}
            <section>
              {sectionTitle('Pagos')}
              <div style={card()}>
                {visitFeePayment ? (
                  <>
                    <div style={{ fontSize: 12, fontWeight: 600, color: A.textTertiary, marginBottom: 8, fontFamily: A.fontSans }}>Tarifa de visita</div>
                    {infoRow('ID PaymentIntent', visitFeePayment.stripe_payment_intent_id ? (
                      <a href={`https://dashboard.stripe.com/payments/${visitFeePayment.stripe_payment_intent_id}`} target="_blank" rel="noopener noreferrer" style={{ fontFamily: A.fontMono, fontSize: 11, color: A.accent }}>{visitFeePayment.stripe_payment_intent_id.slice(-16)}</a>
                    ) : '—')}
                    {infoRow('Monto', <span style={{ fontFamily: A.fontMono }}>{fmtMXN(visitFeePayment.total_amount_cents ?? visitFeePayment.amount * 100)}</span>)}
                    {infoRow('Estado', pill(visitFeePayment.status))}
                  </>
                ) : <div style={{ color: A.textTertiary, fontSize: 13, fontFamily: A.fontSans, padding: '8px 0' }}>Sin pago de visita registrado</div>}

                {job.late_cancellation_penalty_applied && (
                  <div style={{ marginTop: 12, padding: '10px 14px', background: '#FBF0EE', borderRadius: 8, fontSize: 13, fontFamily: A.fontSans }}>
                    <strong style={{ color: '#922E24' }}>Cancelación tardía:</strong>
                    <span style={{ color: A.textSecondary, marginLeft: 6 }}>{job.cancellation_requested_by === 'client' ? '$200 MXN retenidos, $206 MXN reembolsados' : 'Reembolso completo. $100 MXN penalización al proveedor.'}</span>
                  </div>
                )}

                {invoicePayment && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: A.textTertiary, marginBottom: 8, fontFamily: A.fontSans }}>Pago de factura</div>
                    {infoRow('Monto', <span style={{ fontFamily: A.fontMono }}>{fmtMXN(invoicePayment.total_amount_cents ?? invoicePayment.amount * 100)}</span>)}
                    {infoRow('Estado', pill(invoicePayment.status))}
                    {invoicePayment.stripe_payment_intent_id && infoRow('Ver en Stripe', <a href={`https://dashboard.stripe.com/payments/${invoicePayment.stripe_payment_intent_id}`} target="_blank" style={{ color: A.accent, fontSize: 12 }}>Abrir →</a>)}
                  </div>
                )}

                {providerPayout ? (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: A.textTertiary, marginBottom: 8, fontFamily: A.fontSans }}>Pago al proveedor</div>
                    {infoRow('Monto', <span style={{ fontFamily: A.fontMono }}>{fmtMXN(providerPayout.amount * 100)}</span>)}
                    {infoRow('Estado', pill(providerPayout.status))}
                    {infoRow('Fecha', fmtDate(providerPayout.paid_at))}
                  </div>
                ) : job.provider_id && (
                  <div style={{ marginTop: 12, fontSize: 13, color: A.textTertiary, fontFamily: A.fontSans }}>Sin pago al proveedor registrado</div>
                )}
              </div>
            </section>

            {/* SECTION 5 — Chat */}
            <section>
              {sectionTitle('Comunicación')}
              <div style={{ ...card(), maxHeight: 400, overflowY: 'auto' }}>
                {messages.filter(m => !m.is_system_message).length === 0 ? (
                  <div style={{ color: A.textTertiary, fontSize: 13, fontFamily: A.fontSans }}>Sin mensajes de chat</div>
                ) : messages.filter(m => !m.is_system_message).map(m => (
                  <div key={m.id} style={{ marginBottom: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: A.textPrimary, fontFamily: A.fontSans }}>{userMap[m.sender_id] || 'Usuario'}</span>
                      <span style={{ fontSize: 11, color: A.textTertiary, fontFamily: A.fontMono }}>{relativeTime(m.created_at)}</span>
                    </div>
                    <div style={{ fontSize: 13, color: A.textSecondary, fontFamily: A.fontSans, background: A.bg, borderRadius: 8, padding: '8px 12px', lineHeight: 1.5 }}>{m.message_text}</div>
                    {m.attachment_url && (
                      <img src={m.attachment_url} onClick={() => setLightbox(m.attachment_url!)} style={{ maxHeight: 120, marginTop: 6, borderRadius: 8, cursor: 'zoom-in', border: `1px solid ${A.border}` }} />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* SECTION 6 — Evidencia y fotos */}
            <section>
              {sectionTitle('Evidencia y fotos')}
              <div style={card()}>
                {(() => {
                  const jobPhotos = (job.photos ?? []).filter(Boolean);
                  const dispPhotos = evidence.filter(e => e.file_type === 'image');
                  const docPhotos = docs.filter(d => d.file_url);
                  const all = [...jobPhotos.map(u => ({ url: u, label: 'Foto del trabajo' })), ...dispPhotos.map(e => ({ url: e.file_url, label: `Evidencia (${e.uploaded_by_role})` })), ...docPhotos.map(d => ({ url: d.file_url, label: d.doc_type }))];
                  if (!all.length) return <div style={{ color: A.textTertiary, fontSize: 13, fontFamily: A.fontSans }}>Sin archivos</div>;
                  return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
                      {all.map((item, i) => (
                        <div key={i}>
                          <img src={item.url} onClick={() => setLightbox(item.url)} style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 8, border: `1px solid ${A.border}`, cursor: 'zoom-in' }} />
                          <div style={{ fontSize: 10, color: A.textTertiary, fontFamily: A.fontSans, marginTop: 3, textAlign: 'center' }}>{item.label}</div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </section>

            {/* SECTION 7 — Historial cancelación / reagendamiento */}
            {hasCancelHistory && (
              <section>
                {sectionTitle('Historial de cancelación')}
                <div style={card()}>
                  {infoRow('Cancelado por', job.cancellation_requested_by ?? '—')}
                  {infoRow('Fecha de cancelación', fmtDate(job.cancellation_requested_at))}
                  {infoRow('Tipo', job.late_cancellation_penalty_applied ? '🔴 Tardía (<2h)' : '🟢 Temprana')}
                  {infoRow('Penalización', job.late_cancellation_penalty_applied ? (job.cancellation_requested_by === 'client' ? '$200 MXN' : '$100 MXN') : 'No')}
                </div>
              </section>
            )}

            {/* SECTION 8 — Disputas */}
            {dispute && (
              <section ref={disputeSectionRef}>
                {sectionTitle('Disputa')}
                <div style={card()}>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
                    {pill(dispute.status)}
                    <span style={{ fontSize: 12, color: A.textTertiary, fontFamily: A.fontSans }}>Abierta {relativeTime(dispute.created_at)} por {dispute.opened_by_role}</span>
                  </div>
                  {infoRow('Motivo', dispute.reason_code)}
                  {dispute.description && (
                    <div style={{ padding: '10px 0', borderBottom: `1px solid ${A.border}` }}>
                      <div style={{ fontSize: 12, color: A.textTertiary, marginBottom: 4 }}>Descripción</div>
                      <div style={{ fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, lineHeight: 1.6 }}>{dispute.description}</div>
                    </div>
                  )}
                  {evidence.length > 0 && (
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 12, color: A.textTertiary, marginBottom: 8 }}>Evidencia ({evidence.length})</div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: 8 }}>
                        {evidence.map(ev => (
                          <div key={ev.id}>
                            {ev.file_type === 'image' ? <img src={ev.file_url} onClick={() => setLightbox(ev.file_url)} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 8, cursor: 'zoom-in', border: `1px solid ${A.border}` }} /> : <video src={ev.file_url} controls style={{ width: '100%', height: 80, borderRadius: 8 }} />}
                            <div style={{ fontSize: 10, color: A.textTertiary, textAlign: 'center', marginTop: 2 }}>{ev.uploaded_by_role}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {dispute.status === 'resolved' && (
                    <div style={{ marginTop: 14, padding: '12px 14px', background: A.accentLight, borderRadius: 8 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: A.accentText, fontFamily: A.fontSans }}>Resolución</div>
                      <div style={{ fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, marginTop: 4 }}>
                        Fallo: <strong>{dispute.admin_ruling ?? '—'}</strong>
                        {dispute.admin_notes && <div style={{ color: A.textSecondary, marginTop: 4 }}>{dispute.admin_notes}</div>}
                        {dispute.resolved_at && <div style={{ color: A.textTertiary, fontSize: 11, fontFamily: A.fontMono, marginTop: 4 }}>{fmtDate(dispute.resolved_at)}</div>}
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          {/* ── RIGHT COLUMN (sticky) ────────────────────────────────────────── */}
          <div style={{ position: 'sticky', top: 56, height: 'calc(100vh - 56px)', overflowY: 'auto', padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Status management */}
            <div style={card()}>
              <div style={{ fontSize: 12, fontWeight: 700, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: A.fontSans, marginBottom: 12 }}>Estado</div>
              <div style={{ marginBottom: 12 }}>{pill(job.has_open_dispute ? 'disputed' : job.status)}</div>
              <select value={pendingStatus} onChange={e => setPendingStatus(e.target.value)}
                style={{ width: '100%', border: `1px solid ${A.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: A.fontSans, marginBottom: 8, cursor: 'pointer', background: A.surface }}>
                <option value="">Cambiar estado a…</option>
                {['draft','searching','assigned','on_site','quoted','job_paid','in_progress','provider_done','completed','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {pendingStatus && <button onClick={() => setStatusModal(true)} style={{ width: '100%', padding: '8px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 600, background: A.accentLight, color: A.accentText, cursor: 'pointer' }}>Confirmar cambio</button>}
            </div>

            {/* Payment actions */}
            <div style={card()}>
              <div style={{ fontSize: 12, fontWeight: 700, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: A.fontSans, marginBottom: 12 }}>Acciones de pago</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {visitFeePayment?.status === 'authorized' && (
                  <button onClick={() => setRefundModal('full')} style={{ padding: '8px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, background: A.surface, cursor: 'pointer' }}>Capturar pago de visita</button>
                )}
                <button onClick={() => setRefundModal('full')} style={{ padding: '8px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, background: A.surface, cursor: 'pointer' }}>Reembolso completo</button>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input type="number" placeholder="Monto MXN" value={refundAmount} onChange={e => setRefundAmount(e.target.value)} style={{ flex: 1, padding: '7px 10px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontMono }} />
                  <button onClick={() => paymentAction('partial_refund', Math.round(parseFloat(refundAmount) * 100))} disabled={!refundAmount} style={{ padding: '7px 12px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface, opacity: !refundAmount ? 0.5 : 1 }}>Reembolso parcial</button>
                </div>
                <button onClick={() => setRefundModal('payout')} style={{ padding: '8px', border: `1px solid ${A.accent}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, background: A.accentLight, color: A.accentText, cursor: 'pointer' }}>Enviar pago a proveedor</button>
              </div>
            </div>

            {/* Flagging */}
            <div style={card()}>
              <div style={{ fontSize: 12, fontWeight: 700, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: A.fontSans, marginBottom: 12 }}>Advertencias</div>
              <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
                <button onClick={() => setFlagModal('client')} style={{ padding: '8px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface, textAlign: 'left' }}>
                  + Advertencia al cliente <span style={{ fontFamily: A.fontMono, color: A.textTertiary, fontSize: 11 }}>({client?.flag_count ?? 0} flags)</span>
                </button>
                {job.provider_id && (
                  <button onClick={() => setFlagModal('provider')} style={{ padding: '8px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface, textAlign: 'left' }}>
                    + Advertencia al proveedor <span style={{ fontFamily: A.fontMono, color: A.textTertiary, fontSize: 11 }}>({provider?.flag_count ?? 0} flags)</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dispute resolution */}
            {dispute && dispute.status !== 'resolved' && (
              <div style={card()}>
                <div style={{ fontSize: 12, fontWeight: 700, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: A.fontSans, marginBottom: 12 }}>Resolver disputa</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <select value={ruling} onChange={e => setRuling(e.target.value)} style={{ width: '100%', border: `1px solid ${A.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface }}>
                    <option value="">Seleccionar fallo…</option>
                    <option value="client_wins">Cliente gana</option>
                    <option value="provider_wins">Proveedor gana</option>
                    <option value="split">Dividir pago</option>
                  </select>
                  {ruling === 'split' && (
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="range" min={0} max={100} value={splitPct} onChange={e => setSplitPct(e.target.value)} style={{ flex: 1 }} />
                      <span style={{ fontFamily: A.fontMono, fontSize: 12, width: 36 }}>{splitPct}%</span>
                    </div>
                  )}
                  <textarea value={adminNotes} onChange={e => setAdminNotes(e.target.value)} placeholder="Notas del administrador…" rows={3} style={{ width: '100%', border: `1px solid ${A.border}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, fontFamily: A.fontSans, resize: 'vertical', boxSizing: 'border-box' }} />
                  <button onClick={resolveDispute} disabled={!ruling || acting} style={{ padding: '9px', border: 'none', borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 600, background: A.accent, color: '#fff', cursor: 'pointer', opacity: !ruling || acting ? 0.5 : 1 }}>{acting ? 'Procesando…' : 'Resolver disputa'}</button>
                </div>
              </div>
            )}

            {/* Reschedule */}
            {hasRescheduleRequest && (
              <div style={card()}>
                <div style={{ fontSize: 12, fontWeight: 700, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: A.fontSans, marginBottom: 8 }}>Reagendamiento pendiente</div>
                <div style={{ fontSize: 13, color: A.textSecondary, fontFamily: A.fontSans, marginBottom: 12 }}>
                  Solicitado por <strong>{job.reschedule_requested_by}</strong> para el{' '}
                  <strong style={{ fontFamily: A.fontMono }}>{fmtDate(job.reschedule_proposed_datetime)}</strong>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={approveReschedule} disabled={rescheduleActing} style={{ flex: 1, padding: '8px', border: `1px solid ${A.accent}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, background: A.accentLight, color: A.accentText, cursor: 'pointer' }}>Aprobar</button>
                  <button onClick={rejectReschedule} disabled={rescheduleActing} style={{ flex: 1, padding: '8px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface }}>Rechazar</button>
                </div>
              </div>
            )}

            {/* Communication */}
            <div style={card()}>
              <div style={{ fontSize: 12, fontWeight: 700, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: A.fontSans, marginBottom: 12 }}>Comunicación</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => whatsapp(client?.phone ?? null, client?.full_name ?? 'Cliente')} style={{ padding: '8px', border: '1px solid #25D366', borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, background: '#F0FBF4', color: '#1A7A3A', cursor: 'pointer' }}>WhatsApp al cliente</button>
                {job.provider_id && <button onClick={() => whatsapp(provider?.phone ?? null, provider?.full_name ?? 'Proveedor')} style={{ padding: '8px', border: '1px solid #25D366', borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, background: '#F0FBF4', color: '#1A7A3A', cursor: 'pointer' }}>WhatsApp al proveedor</button>}
              </div>
            </div>

            {/* Danger zone */}
            <div style={{ ...card(), border: '1px solid #FBB4B4', background: '#FFF8F8' }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#922E24', textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: A.fontSans, marginBottom: 12 }}>Zona de peligro</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => { setDangerModal('cancel'); setDangerStep(1); }} style={{ padding: '8px', border: '1px solid #FBB4B4', borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, background: '#FBF0EE', color: '#922E24', cursor: 'pointer' }}>Cancelar trabajo</button>
                <button onClick={() => { setDangerModal('suspend_client'); setDangerStep(1); }} style={{ padding: '8px', border: '1px solid #FBB4B4', borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, color: '#922E24', cursor: 'pointer' }}>Suspender cliente</button>
                {job.provider_id && <button onClick={() => { setDangerModal('suspend_provider'); setDangerStep(1); }} style={{ padding: '8px', border: '1px solid #FBB4B4', borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, color: '#922E24', cursor: 'pointer' }}>Suspender proveedor</button>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modals ──────────────────────────────────────────────────────────────── */}
      {statusModal && (
        <ConfirmModal
          title="Cambiar estado"
          message={`¿Cambiar el estado del trabajo a "${pendingStatus}"? Esta acción actualizará el registro directamente.`}
          onConfirm={changeStatus}
          onCancel={() => { setStatusModal(false); setPendingStatus(''); }}
        />
      )}

      {refundModal && (
        <ConfirmModal
          title={refundModal === 'full' ? 'Reembolso completo' : refundModal === 'payout' ? 'Pago al proveedor' : 'Reembolso parcial'}
          message="¿Estás seguro? Esta acción ejecuta una operación de Stripe y no se puede deshacer."
          onConfirm={() => {
            if (refundModal === 'full') paymentAction('full_refund');
            else if (refundModal === 'payout') paymentAction('payout_provider');
          }}
          onCancel={() => setRefundModal(null)}
          destructive
        />
      )}

      {flagModal && (
        <ConfirmModal
          title={`Advertencia al ${flagModal === 'client' ? 'cliente' : 'proveedor'}`}
          message={`Se sumará +1 advertencia. Al llegar a 3 la cuenta se congela; a 6 se suspende automáticamente. Flags actuales: ${flagModal === 'client' ? client?.flag_count ?? 0 : provider?.flag_count ?? 0}`}
          onConfirm={() => addFlag(flagModal)}
          onCancel={() => setFlagModal(null)}
        />
      )}

      {dangerModal && dangerStep === 1 && (
        <ConfirmModal
          title="¿Estás seguro?"
          message="Esta es una acción de alto impacto. ¿Deseas continuar?"
          onConfirm={() => setDangerStep(2)}
          onCancel={() => { setDangerModal(null); setDangerStep(1); }}
          destructive
        />
      )}
      {dangerModal && dangerStep === 2 && (
        <ConfirmModal
          title="Confirmación final"
          message="Esto es permanente. ¿Confirmar la acción?"
          onConfirm={() => {
            if (dangerModal === 'cancel') cancelJob();
            else if (dangerModal === 'suspend_client') suspendUser('client');
            else if (dangerModal === 'suspend_provider') suspendUser('provider');
          }}
          onCancel={() => { setDangerModal(null); setDangerStep(1); }}
          destructive
        />
      )}

      {/* Lightbox */}
      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', padding: 20 }}>
          <img src={lightbox} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
