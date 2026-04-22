import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { A, ADMIN_ID, type AdminView, dotColor, relativeTime } from './admin/adminTokens';
import { ResumenView } from './admin/views/ResumenView';
import { TrabajosView } from './admin/views/TrabajosView';
import { DisputasView } from './admin/views/DisputasView';
import { CancelacionesView } from './admin/views/CancelacionesView';
import { ReagendamientosView } from './admin/views/ReagendamientosView';
import { UsuariosView } from './admin/views/UsuariosView';
import { ProveedoresView } from './admin/views/ProveedoresView';
import { PagosView } from './admin/views/PagosView';
import { RegistroView } from './admin/views/RegistroView';

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV: { section: string; items: { key: AdminView; label: string; icon: string }[] }[] = [
  { section: 'General', items: [
    { key: 'resumen',         label: 'Resumen',         icon: '◻' },
    { key: 'trabajos',        label: 'Trabajos',        icon: '≡' },
    { key: 'reagendamientos', label: 'Reagendamientos', icon: '⌖' },
  ]},
  { section: 'Conflictos', items: [
    { key: 'disputas',        label: 'Disputas',        icon: '⚠' },
    { key: 'cancelaciones',   label: 'Cancelaciones',   icon: '✕' },
  ]},
  { section: 'Plataforma', items: [
    { key: 'usuarios',        label: 'Usuarios',        icon: '⊙' },
    { key: 'proveedores',     label: 'Proveedores',     icon: '✔' },
    { key: 'pagos',           label: 'Pagos',           icon: '◈' },
  ]},
  { section: 'Sistema', items: [
    { key: 'registro',        label: 'Registro de actividad', icon: '↻' },
    { key: 'configuracion',   label: 'Configuración',   icon: '⊞' },
  ]},
];

const VIEW_TITLES: Record<AdminView, string> = {
  resumen: 'Resumen', trabajos: 'Trabajos', reagendamientos: 'Reagendamientos',
  disputas: 'Disputas', cancelaciones: 'Cancelaciones',
  usuarios: 'Usuarios', proveedores: 'Proveedores', pagos: 'Pagos',
  registro: 'Registro de actividad', configuracion: 'Configuración',
};

const todayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase());
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<AdminView>('resumen');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  const [badges, setBadges] = useState({ disputes: 0, reschedules: 0 });
  const searchTimer = useRef<NodeJS.Timeout>();
  // ProtectedRoute requireAdmin already guards this route — no inline redirect needed

  useEffect(() => {
    if (!user) return;
    supabase.from('users').select('full_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.full_name) setAdminName(data.full_name); });
    fetchBadges();
  }, [user]);

  const fetchBadges = async () => {
    const [{ count: d }, { count: r }] = await Promise.all([
      (supabase as any).from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).not('reschedule_requested_at', 'is', null).eq('reschedule_agreed', false),
    ]);
    setBadges({ disputes: d ?? 0, reschedules: r ?? 0 });
  };

  const handleSearch = (val: string) => {
    setSearchDraft(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => setSearchQuery(val), 300);
  };

  if (!user) return null;

  const sidebarW = 240;
  const topbarH = 64;

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div style={{ position: 'fixed', top: 0, left: 0, width: sidebarW, height: '100vh', background: A.surface, borderRight: `1px solid ${A.border}`, display: 'flex', flexDirection: 'column', zIndex: 40, fontFamily: A.fontSans }}>
      {/* Logo */}
      <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${A.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: A.accent, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 16, fontWeight: 700 }}>C</div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: A.textPrimary, lineHeight: 1.1 }}>Chamby</div>
            <div style={{ fontSize: 10, color: A.textTertiary, fontWeight: 400 }}>admin v1.0</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
        {NAV.map(section => (
          <div key={section.section} style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px', marginBottom: 4 }}>{section.section}</div>
            {section.items.map(item => {
              const isActive = activeView === item.key;
              const badge = item.key === 'disputas' ? badges.disputes : item.key === 'reagendamientos' ? badges.reschedules : 0;
              return (
                <button key={item.key} onClick={() => setActiveView(item.key)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isActive ? A.accentLight : 'transparent', color: isActive ? A.accentText : A.textSecondary, fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily: A.fontSans, textAlign: 'left', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = A.rowHover; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: 14, width: 18, textAlign: 'center', flexShrink: 0 }}>{item.icon}</span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badge > 0 && (
                    <span style={{ background: item.key === 'disputas' ? '#FBF0EE' : '#FDF6E8', color: item.key === 'disputas' ? '#922E24' : '#7A5A12', fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px', fontFamily: A.fontMono }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Admin avatar */}
      <div style={{ padding: '14px 20px', borderTop: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', background: A.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: A.accentText, flexShrink: 0 }}>
          {adminName.charAt(0).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: A.textPrimary, fontFamily: A.fontSans, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
          <div style={{ fontSize: 11, color: A.textTertiary, fontFamily: A.fontSans }}>Super admin</div>
        </div>
      </div>
    </div>
  );

  // ── Topbar ─────────────────────────────────────────────────────────────────
  const Topbar = () => (
    <div style={{ position: 'fixed', top: 0, left: sidebarW, right: 0, height: topbarH, background: A.surface, borderBottom: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', zIndex: 30, fontFamily: A.fontSans }}>
      <div>
        <div style={{ fontSize: 17, fontWeight: 700, color: A.textPrimary }}>{VIEW_TITLES[activeView]}</div>
        <div style={{ fontSize: 12, color: A.textTertiary }}>{todayLabel()} · Guadalajara</div>
      </div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <div style={{ position: 'relative' }}>
          <input
            value={searchDraft}
            onChange={e => handleSearch(e.target.value)}
            placeholder="Buscar trabajos, clientes, proveedores…"
            style={{ padding: '8px 14px 8px 36px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, color: A.textPrimary, background: A.bg, width: 280, outline: 'none' }}
          />
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: A.textTertiary, fontSize: 14 }}>⌕</span>
        </div>
        <button style={{ padding: '8px 16px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, color: A.textSecondary, background: A.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ↓ Exportar
        </button>
      </div>
    </div>
  );

  // ── Active view ────────────────────────────────────────────────────────────
  const renderView = () => {
    switch (activeView) {
      case 'resumen':         return <ResumenView />;
      case 'trabajos':        return <TrabajosView searchQuery={searchQuery} />;
      case 'disputas':        return <DisputasView />;
      case 'cancelaciones':   return <CancelacionesView />;
      case 'reagendamientos': return <ReagendamientosView />;
      case 'usuarios':        return <UsuariosView />;
      case 'proveedores':     return <ProveedoresView />;
      case 'pagos':           return <PagosView />;
      case 'registro':        return <RegistroView />;
      case 'configuracion':   return (
        <div style={{ background: A.surface, border: `1px solid ${A.border}`, borderRadius: 14, padding: 48, textAlign: 'center', fontFamily: A.fontSans, color: A.textTertiary }}>
          Configuración próximamente
        </div>
      );
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: A.bg, fontFamily: A.fontSans }}>
      <Sidebar />
      <Topbar />
      <main style={{ marginLeft: sidebarW, paddingTop: topbarH, minHeight: '100vh' }}>
        <div style={{ padding: 28 }}>
          {renderView()}
        </div>
      </main>
    </div>
  );
}
