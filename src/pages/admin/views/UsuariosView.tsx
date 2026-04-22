import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { A, fmtMXN } from '../adminTokens';
import { toast } from 'sonner';

interface UserRow { id: string; full_name: string | null; email: string | null; flag_count: number; account_status: string; pending_penalty_balance: number; role?: string }

type Filter = 'all' | 'frozen' | 'suspended' | 'providers' | 'clients';
const ACCOUNT_STATUS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  active:    { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Activo' },
  frozen:    { bg: '#FDF6E8', text: '#7A5A12', dot: '#A67B1A', label: 'Congelado' },
  suspended: { bg: '#FBF0EE', text: '#922E24', dot: '#C4473A', label: 'Suspendido' },
};

const card: React.CSSProperties = { background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 24 };

export function UsuariosView({ providerOnly = false }: { providerOnly?: boolean }) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>(providerOnly ? 'providers' : 'all');
  const [selected, setSelected] = useState<UserRow | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from('users').select('id,full_name,email,flag_count,account_status,pending_penalty_balance').order('flag_count', { ascending: false });
    if (!data?.length) { setUsers([]); setLoading(false); return; }

    const { data: roles } = await supabase.from('user_roles').select('user_id,role').in('user_id', data.map(u => u.id));
    const rMap: Record<string, string> = {};
    roles?.forEach(r => { rMap[r.user_id] = r.role; });

    setUsers(data.map(u => ({ ...u, flag_count: u.flag_count ?? 0, account_status: u.account_status ?? 'active', pending_penalty_balance: u.pending_penalty_balance ?? 0, role: rMap[u.id] || 'client' })));
    setLoading(false);
  };

  const updateUser = async (uid: string, patch: Partial<UserRow>) => {
    setActing(true);
    await supabase.from('users').update(patch as any).eq('id', uid);
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, ...patch } : u));
    if (selected?.id === uid) setSelected(prev => prev ? { ...prev, ...patch } : null);
    toast.success('Usuario actualizado');
    setActing(false);
  };

  const addFlag = async (u: UserRow) => {
    const newCount = u.flag_count + 1;
    const newStatus = newCount >= 6 ? 'suspended' : newCount >= 3 ? 'frozen' : u.account_status;
    await updateUser(u.id, { flag_count: newCount, account_status: newStatus });
    await (supabase as any).from('account_flags').insert({ user_id: u.id, reason: 'Advertencia manual del administrador', flagged_by: 'admin' });
  };

  const removeFlag = async (u: UserRow) => {
    const newCount = Math.max(0, u.flag_count - 1);
    const newStatus = newCount < 3 ? 'active' : newCount < 6 ? 'frozen' : 'suspended';
    updateUser(u.id, { flag_count: newCount, account_status: newStatus });
  };

  const filtered = users.filter(u => {
    if (filter === 'frozen') return u.account_status === 'frozen';
    if (filter === 'suspended') return u.account_status === 'suspended';
    if (filter === 'providers') return u.role === 'provider' || u.role === 'admin';
    if (filter === 'clients') return u.role === 'client';
    return true;
  });

  const th: React.CSSProperties = { padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: A.textTertiary, fontFamily: A.fontSans, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: `1px solid ${A.border}`, whiteSpace: 'nowrap' };
  const td: React.CSSProperties = { padding: '12px', fontSize: 13, color: A.textPrimary, fontFamily: A.fontSans, borderBottom: `1px solid ${A.border}`, verticalAlign: 'middle' };
  const pill = (s: string) => { const p = ACCOUNT_STATUS[s] ?? ACCOUNT_STATUS.active; return <span style={{ background: p.bg, color: p.text, fontSize: 12, fontWeight: 500, fontFamily: A.fontSans, borderRadius: 100, padding: '2px 10px', display: 'inline-flex', alignItems: 'center', gap: 5 }}><span style={{ width: 5, height: 5, borderRadius: '50%', background: p.dot }} />{p.label}</span>; };
  const btn = (label: string, onClick: () => void, color = A.textPrimary, bg = A.surface) => <button onClick={onClick} disabled={acting} style={{ padding: '6px 12px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 12, fontFamily: A.fontSans, fontWeight: 500, color, background: bg, cursor: 'pointer', opacity: acting ? 0.5 : 1 }}>{label}</button>;

  const DetailPanel = ({ u }: { u: UserRow }) => (
    <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 600, fontFamily: A.fontSans, color: A.textPrimary }}>{u.full_name || '(sin nombre)'}</div>
          <div style={{ fontSize: 13, color: A.textTertiary, fontFamily: A.fontSans }}>{u.email}</div>
        </div>
        <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: A.textTertiary }}>×</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 13, fontFamily: A.fontSans }}>
        <div style={{ color: A.textSecondary }}>Flags: <strong style={{ color: u.flag_count >= 3 ? '#C4473A' : A.textPrimary }}>{u.flag_count}</strong></div>
        <div style={{ color: A.textSecondary }}>Estado: {pill(u.account_status)}</div>
        <div style={{ color: A.textSecondary }}>Rol: <span style={{ fontWeight: 500 }}>{u.role}</span></div>
        <div style={{ color: A.textSecondary }}>Balance: <span style={{ fontFamily: A.fontMono, color: u.pending_penalty_balance > 0 ? '#C4473A' : A.textSecondary }}>{fmtMXN(u.pending_penalty_balance)}</span></div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {btn('+ Advertencia', () => addFlag(u), '#922E24', '#FBF0EE')}
          {btn('- Advertencia', () => removeFlag(u))}
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {u.account_status === 'active' && btn('Congelar', () => updateUser(u.id, { account_status: 'frozen' }), '#7A5A12', '#FDF6E8')}
          {u.account_status === 'frozen' && btn('Descongelar', () => updateUser(u.id, { account_status: 'active' }), A.accentText, A.accentLight)}
          {u.account_status !== 'suspended' && btn('Suspender', () => updateUser(u.id, { account_status: 'suspended' }), '#922E24', '#FBF0EE')}
          {u.account_status === 'suspended' && btn('Reactivar', () => updateUser(u.id, { account_status: 'active' }), A.accentText, A.accentLight)}
          {u.pending_penalty_balance > 0 && btn('Limpiar balance', () => updateUser(u.id, { pending_penalty_balance: 0 }))}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {selected && <DetailPanel u={selected} />}
      <div style={card}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          {(['all','frozen','suspended','providers','clients'] as Filter[]).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '5px 12px', border: `1px solid ${A.border}`, borderRadius: 100, fontSize: 12, fontFamily: A.fontSans, fontWeight: filter === f ? 600 : 400, background: filter === f ? A.accentLight : 'transparent', color: filter === f ? A.accentText : A.textSecondary, cursor: 'pointer' }}>
              {{ all: 'Todos', frozen: 'Congelados', suspended: 'Suspendidos', providers: 'Proveedores', clients: 'Clientes' }[f]}
            </button>
          ))}
          <button onClick={fetchData} style={{ padding: '5px 12px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 12, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface, marginLeft: 'auto' }}>Actualizar</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: A.bg }}>
              <tr>{['Nombre','Email','Rol','Advertencias','Estado','Balance pendiente',''].map(h => <th key={h} style={th}>{h}</th>)}</tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Cargando…</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={7} style={{ ...td, textAlign: 'center', color: A.textTertiary, padding: 32 }}>Sin usuarios</td></tr>
                : filtered.map(u => (
                  <tr key={u.id} onMouseEnter={e => (e.currentTarget.style.background = A.rowHover)} onMouseLeave={e => (e.currentTarget.style.background = '')}>
                    <td style={{ ...td, fontWeight: 500 }}>{u.full_name || '—'}</td>
                    <td style={{ ...td, color: A.textSecondary, fontSize: 12 }}>{u.email}</td>
                    <td style={td}><span style={{ background: u.role === 'provider' ? A.accentLight : '#F0EFEC', color: u.role === 'provider' ? A.accentText : A.textSecondary, fontSize: 12, fontWeight: 500, borderRadius: 100, padding: '2px 10px', fontFamily: A.fontSans, textTransform: 'capitalize' }}>{u.role}</span></td>
                    <td style={td}><span style={{ fontFamily: A.fontMono, fontWeight: u.flag_count >= 3 ? 600 : 400, color: u.flag_count >= 3 ? '#C4473A' : A.textPrimary }}>{u.flag_count}</span></td>
                    <td style={td}>{pill(u.account_status)}</td>
                    <td style={{ ...td, fontFamily: A.fontMono, fontSize: 13, color: u.pending_penalty_balance > 0 ? '#C4473A' : A.textTertiary }}>{u.pending_penalty_balance > 0 ? fmtMXN(u.pending_penalty_balance) : '—'}</td>
                    <td style={td}><button onClick={() => setSelected(u)} style={{ padding: '5px 12px', border: `1px solid ${A.border}`, borderRadius: 6, fontSize: 12, fontFamily: A.fontSans, cursor: 'pointer', background: A.surface }}>Ver detalle</button></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div style={{ marginTop: 8, fontSize: 12, color: A.textTertiary, fontFamily: A.fontSans }}>{filtered.length} usuarios</div>
      </div>
    </div>
  );
}
