import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { A, statusPill, fmtDate, fmtMXN } from '../adminTokens';

type TabFilter = 'todos' | 'activos' | 'cancelados' | 'disputas' | 'pendientes';
type ChipFilter = 'todas' | 'semana' | 'penalizacion' | 'gps';

const ACTIVE = ['draft','searching','pending','assigned','on_site','quoted','quote_accepted','job_paid','in_progress','provider_done'];
const TERMINAL = ['cancelled','completed','no_match'];

interface Job {
  id: string;
  title: string;
  category: string;
  status: string;
  scheduled_at: string | null;
  total_amount: number | null;
  client_id: string;
  provider_id: string | null;
  late_cancellation_penalty_applied: boolean | null;
  geolocation_mismatch: boolean | null;
  has_open_dispute: boolean | null;
  updated_at: string;
  clientName?: string;
  clientEmail?: string;
  providerName?: string;
  providerEmail?: string;
}

interface Props {
  searchQuery?: string;
  defaultTab?: TabFilter;
  onSelectJob?: (jobId: string) => void;
  compact?: boolean;
}

const PAGE_SIZE = 10;

export function JobsTable({ searchQuery = '', defaultTab = 'todos', onSelectJob, compact }: Props) {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>(defaultTab);
  const [chip, setChip] = useState<ChipFilter>('todas');
  const [serviceFilter, setServiceFilter] = useState('todos');
  const [categories, setCategories] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [openDisputeCount, setOpenDisputeCount] = useState(0);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('jobs')
      .select('id,title,category,status,scheduled_at,total_amount,client_id,provider_id,late_cancellation_penalty_applied,geolocation_mismatch,has_open_dispute,updated_at')
      .order('updated_at', { ascending: false });

    if (tab === 'activos') q = q.in('status', ACTIVE);
    else if (tab === 'cancelados') q = q.eq('status', 'cancelled');
    else if (tab === 'disputas') q = q.eq('has_open_dispute', true);
    else if (tab === 'pendientes') q = q.in('status', ['draft', 'searching', 'pending']);

    if (chip === 'semana') {
      const d = new Date(); d.setDate(d.getDate() - 7); d.setHours(0,0,0,0);
      q = q.gte('updated_at', d.toISOString());
    } else if (chip === 'penalizacion') {
      q = q.eq('late_cancellation_penalty_applied', true);
    } else if (chip === 'gps') {
      q = q.eq('geolocation_mismatch', true);
    }

    if (serviceFilter !== 'todos') q = q.eq('category', serviceFilter);

    const { data } = await q.limit(200);
    if (!data?.length) { setJobs([]); setLoading(false); return; }

    setCategories(prev => {
      const cats = [...new Set(data.map(j => j.category).filter(Boolean))];
      return cats.length > prev.length ? cats : prev;
    });

    const ids = [...new Set([...data.map(j => j.client_id), ...data.filter(j => j.provider_id).map(j => j.provider_id!)])];
    const { data: users } = await supabase.from('users').select('id,full_name,email').in('id', ids);
    const uMap: Record<string, { name: string; email: string }> = {};
    users?.forEach(u => { uMap[u.id] = { name: u.full_name || '—', email: u.email || '—' }; });

    let filtered = data.map(j => ({
      ...j,
      clientName: uMap[j.client_id]?.name || '—',
      clientEmail: uMap[j.client_id]?.email || '—',
      providerName: j.provider_id ? uMap[j.provider_id]?.name || '—' : null,
      providerEmail: j.provider_id ? uMap[j.provider_id]?.email || '—' : null,
    }));

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(j =>
        j.title?.toLowerCase().includes(q) ||
        j.id.toLowerCase().includes(q) ||
        j.clientName?.toLowerCase().includes(q) ||
        j.providerName?.toLowerCase().includes(q)
      );
    }

    setJobs(filtered);
    setLoading(false);
    setPage(1);
  }, [tab, chip, serviceFilter, searchQuery]);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  useEffect(() => {
    supabase.from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open')
      .then(({ count }) => setOpenDisputeCount(count ?? 0));
  }, []);

  const tabs: { key: TabFilter; label: string }[] = [
    { key: 'todos', label: 'Todos' },
    { key: 'activos', label: 'Activos' },
    { key: 'cancelados', label: 'Cancelados' },
    { key: 'disputas', label: 'Disputas' },
    { key: 'pendientes', label: 'Pendientes' },
  ];

  const chips: { key: ChipFilter; label: string }[] = [
    { key: 'todas', label: 'Todas las fechas' },
    { key: 'semana', label: 'Esta semana' },
    { key: 'penalizacion', label: 'Penalización aplicada' },
    { key: 'gps', label: 'GPS sospechoso' },
  ];

  const paged = jobs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(jobs.length / PAGE_SIZE);

  const pill = (status: string) => {
    const s = statusPill(status);
    return (
      <span style={{ background: s.bg, color: s.text, fontFamily: A.fontSans, fontSize: 12, fontWeight: 500, borderRadius: 100, padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap' }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.dot, flexShrink: 0 }} />
        {s.label}
      </span>
    );
  };

  const border = `1px solid ${A.border}`;
  const thStyle: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: A.textTertiary, fontFamily: A.fontSans, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: border, whiteSpace: 'nowrap' };
  const tdStyle: React.CSSProperties = { padding: '12px', fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, borderBottom: border, verticalAlign: 'middle' };

  return (
    <div>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, borderBottom: border, paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1); }}
            style={{ padding: '8px 14px', fontSize: 13, fontWeight: tab === t.key ? 600 : 400, fontFamily: A.fontSans, color: tab === t.key ? A.accentText : A.textSecondary, borderBottom: tab === t.key ? `2px solid ${A.accent}` : '2px solid transparent', background: 'none', border: 'none', borderBottom: tab === t.key ? `2px solid ${A.accent}` : '2px solid transparent', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            {t.label}
            {t.key === 'todos' && <span style={{ background: A.accentLight, color: A.accentText, fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '1px 7px' }}>{jobs.length}</span>}
            {t.key === 'disputas' && openDisputeCount > 0 && <span style={{ background: '#FBF0EE', color: '#922E24', fontSize: 11, fontWeight: 600, borderRadius: 10, padding: '1px 7px' }}>{openDisputeCount}</span>}
          </button>
        ))}
      </div>

      {/* Filters row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <select value={serviceFilter} onChange={e => setServiceFilter(e.target.value)}
          style={{ border, borderRadius: 6, padding: '6px 10px', fontSize: 13, fontFamily: A.fontSans, color: A.textPrimary, background: A.surface, cursor: 'pointer' }}>
          <option value="todos">Todos los servicios</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <div style={{ display: 'flex', gap: 4 }}>
          {chips.map(c => (
            <button key={c.key} onClick={() => { setChip(c.key); setPage(1); }}
              style={{ padding: '5px 12px', fontSize: 12, fontWeight: chip === c.key ? 600 : 400, fontFamily: A.fontSans, background: chip === c.key ? A.accentLight : 'transparent', color: chip === c.key ? A.accentText : A.textSecondary, border, borderRadius: 100, cursor: 'pointer' }}>
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', border, borderRadius: 12, background: A.surface }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ background: A.bg }}>
            <tr>
              <th style={thStyle}>Trabajo</th>
              <th style={thStyle}>Cliente</th>
              <th style={thStyle}>Proveedor</th>
              <th style={thStyle}>Fecha</th>
              <th style={thStyle}>Monto</th>
              <th style={thStyle}>Estado</th>
              <th style={thStyle}>Acción</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Cargando…</td></tr>
            ) : paged.length === 0 ? (
              <tr><td colSpan={7} style={{ ...tdStyle, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Sin resultados</td></tr>
            ) : paged.map(j => (
              <tr key={j.id} style={{ cursor: 'default' }} onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                <td style={tdStyle}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {j.geolocation_mismatch && <span title="GPS sospechoso" style={{ color: '#A67B1A', fontSize: 14 }}>⚠️</span>}
                    <div>
                      <div style={{ fontWeight: 500 }}>{j.title || '(sin título)'}</div>
                      <div style={{ fontSize: 11, color: A.textTertiary }}>{j.category}</div>
                      <div style={{ fontFamily: A.fontMono, fontSize: 11, color: A.textTertiary }}>{j.id.slice(0,8)}</div>
                    </div>
                  </div>
                </td>
                <td style={tdStyle}>
                  <div style={{ fontWeight: 500 }}>{j.clientName}</div>
                  <div style={{ fontSize: 11, color: A.textTertiary }}>{j.clientEmail}</div>
                </td>
                <td style={tdStyle}>
                  {j.providerName ? (
                    <>
                      <div style={{ fontWeight: 500 }}>{j.providerName}</div>
                      <div style={{ fontSize: 11, color: A.textTertiary }}>{j.providerEmail}</div>
                    </>
                  ) : <span style={{ color: A.textTertiary }}>Sin asignar</span>}
                </td>
                <td style={{ ...tdStyle, fontFamily: A.fontMono, fontSize: 12 }}>{fmtDate(j.scheduled_at)}</td>
                <td style={{ ...tdStyle, fontFamily: A.fontMono, fontSize: 13 }}>{j.total_amount ? fmtMXN(j.total_amount * 100) : '—'}</td>
                <td style={tdStyle}>{pill(j.has_open_dispute ? 'disputed' : j.status)}</td>
                <td style={tdStyle}>
                  <button
                    onClick={() => { if (onSelectJob) onSelectJob(j.id); else navigate(`/admin/jobs/${j.id}`); }}
                    style={{ padding: '5px 12px', fontSize: 12, fontWeight: 500, fontFamily: A.fontSans, border, borderRadius: 6, background: j.has_open_dispute ? '#FBF0EE' : A.surface, color: j.has_open_dispute ? '#922E24' : A.textPrimary, cursor: 'pointer' }}>
                    {j.has_open_dispute ? 'Revisar' : 'Ver detalle'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
          <span style={{ fontSize: 12, color: A.textTertiary, fontFamily: A.fontSans }}>Mostrando {Math.min(page * PAGE_SIZE, jobs.length)} de {jobs.length} trabajos</span>
          <div style={{ display: 'flex', gap: 4 }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).slice(Math.max(0, page - 3), page + 2).map(p => (
              <button key={p} onClick={() => setPage(p)}
                style={{ width: 32, height: 32, border, borderRadius: 6, fontSize: 13, fontFamily: A.fontSans, cursor: 'pointer', background: p === page ? A.accent : A.surface, color: p === page ? '#fff' : A.textPrimary, fontWeight: p === page ? 600 : 400 }}>
                {p}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
