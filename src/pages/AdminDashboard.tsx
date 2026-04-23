import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { A, type AdminView } from './admin/adminTokens';
import { ResumenView } from './admin/views/ResumenView';
import { TrabajosView } from './admin/views/TrabajosView';
import { DisputasView } from './admin/views/DisputasView';
import { CancelacionesView } from './admin/views/CancelacionesView';
import { ReagendamientosView } from './admin/views/ReagendamientosView';
import { UsuariosView } from './admin/views/UsuariosView';
import { ProveedoresView } from './admin/views/ProveedoresView';
import { PagosView } from './admin/views/PagosView';
import { RegistroView } from './admin/views/RegistroView';
import { SoporteView } from './admin/views/SoporteView';
import ChambyLogoText from '@/components/ChambyLogoText';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard, Briefcase, CalendarClock,
  AlertTriangle, XCircle,
  Users, Wrench, CreditCard, LifeBuoy,
  History, Settings,
  Search, Download, LogOut, Home, ChevronUp, User,
  type LucideIcon,
} from 'lucide-react';

// ── Nav config ────────────────────────────────────────────────────────────────
const NAV: { section: string; items: { key: AdminView; label: string; icon: LucideIcon }[] }[] = [
  { section: 'General', items: [
    { key: 'resumen',         label: 'Resumen',         icon: LayoutDashboard },
    { key: 'trabajos',        label: 'Trabajos',        icon: Briefcase },
    { key: 'reagendamientos', label: 'Reagendamientos', icon: CalendarClock },
  ]},
  { section: 'Conflictos', items: [
    { key: 'disputas',        label: 'Disputas',        icon: AlertTriangle },
    { key: 'cancelaciones',   label: 'Cancelaciones',   icon: XCircle },
  ]},
  { section: 'Plataforma', items: [
    { key: 'usuarios',        label: 'Usuarios',        icon: Users },
    { key: 'proveedores',     label: 'Proveedores',     icon: Wrench },
    { key: 'pagos',           label: 'Pagos',           icon: CreditCard },
    { key: 'soporte',         label: 'Soporte',         icon: LifeBuoy },
  ]},
  { section: 'Sistema', items: [
    { key: 'registro',        label: 'Registro de actividad', icon: History },
    { key: 'configuracion',   label: 'Configuración',   icon: Settings },
  ]},
];

const VIEW_TITLES: Record<AdminView, string> = {
  resumen: 'Resumen', trabajos: 'Trabajos', reagendamientos: 'Reagendamientos',
  disputas: 'Disputas', cancelaciones: 'Cancelaciones',
  usuarios: 'Usuarios', proveedores: 'Proveedores', pagos: 'Pagos', soporte: 'Soporte',
  registro: 'Registro de actividad', configuracion: 'Configuración',
};

const todayLabel = () => {
  const d = new Date();
  return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase());
};

export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<AdminView>('resumen');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [adminName, setAdminName] = useState('Admin');
  const [adminEmail, setAdminEmail] = useState('');
  const [badges, setBadges] = useState({ disputes: 0, reschedules: 0, support: 0 });

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };
  const searchTimer = useRef<NodeJS.Timeout>();
  // ProtectedRoute requireAdmin already guards this route — no inline redirect needed

  useEffect(() => {
    if (!user) return;
    setAdminEmail(user.email ?? '');
    supabase.from('users').select('full_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => { if (data?.full_name) setAdminName(data.full_name); });
    fetchBadges();

    // Realtime: conversations table drives Disputas + Soporte unread badges.
    const channel = supabase
      .channel('admin_conversation_badges')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations' }, () => { fetchBadges(); })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchBadges = async () => {
    const [{ count: d }, { count: r }, { data: convs }] = await Promise.all([
      (supabase as any).from('disputes').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).not('reschedule_requested_at', 'is', null).eq('reschedule_agreed', false),
      (supabase as any).from('conversations').select('type, unread_count_admin').gt('unread_count_admin', 0),
    ]);
    let disputeUnread = 0, supportUnread = 0;
    for (const c of (convs ?? []) as Array<{ type: string; unread_count_admin: number }>) {
      if (c.type === 'support') supportUnread += c.unread_count_admin;
      else disputeUnread += c.unread_count_admin;
    }
    setBadges({ disputes: (d ?? 0) + disputeUnread, reschedules: r ?? 0, support: supportUnread });
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
      {/* Logo — Chamby wordmark, links back to the public site */}
      <div style={{ padding: '18px 20px 14px', borderBottom: `1px solid ${A.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, minWidth: 0 }}>
          <ChambyLogoText size="sm" onClick={() => setActiveView('resumen')} />
          <span style={{ fontSize: 10, color: A.textTertiary, fontFamily: A.fontMono, letterSpacing: '0.04em', textTransform: 'uppercase', flexShrink: 0 }}>admin</span>
        </div>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 10px' }}>
        {NAV.map(section => (
          <div key={section.section} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: A.textTertiary, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 10px', marginBottom: 4 }}>{section.section}</div>
            {section.items.map(item => {
              const isActive = activeView === item.key;
              const Icon = item.icon;
              const badge = item.key === 'disputas' ? badges.disputes
                : item.key === 'reagendamientos' ? badges.reschedules
                : item.key === 'soporte' ? badges.support
                : 0;
              const badgeBg = item.key === 'disputas' ? '#FBF0EE' : item.key === 'soporte' ? '#FBF0EE' : '#FDF6E8';
              const badgeFg = item.key === 'disputas' ? '#922E24' : item.key === 'soporte' ? '#922E24' : '#7A5A12';
              return (
                <button key={item.key} onClick={() => setActiveView(item.key)}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: isActive ? A.accentLight : 'transparent', color: isActive ? A.accentText : A.textSecondary, fontSize: 13, fontWeight: isActive ? 600 : 400, fontFamily: A.fontSans, textAlign: 'left', transition: 'background 0.1s' }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = A.rowHover; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}>
                  <Icon size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {badge > 0 && (
                    <span style={{ background: badgeBg, color: badgeFg, fontSize: 10, fontWeight: 700, borderRadius: 10, padding: '1px 6px', fontFamily: A.fontMono }}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      {/* Admin footer — dropdown menu with clear exit */}
      <div style={{ padding: '10px 12px 14px', borderTop: `1px solid ${A.border}` }}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left', fontFamily: A.fontSans }}
              onMouseEnter={e => { e.currentTarget.style.background = A.rowHover; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: A.accentLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: A.accentText, flexShrink: 0 }}>
                {adminName.charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: A.textPrimary, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{adminName}</div>
                <div style={{ fontSize: 11, color: A.textTertiary }}>Super admin</div>
              </div>
              <ChevronUp size={14} strokeWidth={1.75} style={{ color: A.textTertiary, flexShrink: 0 }} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="top" align="start" className="w-56" style={{ fontFamily: A.fontSans }}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-0.5">
                <p className="text-sm font-semibold leading-tight">{adminName}</p>
                {adminEmail && <p className="text-[11px] leading-none text-muted-foreground">{adminEmail}</p>}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/user-landing')}>
              <Home className="mr-2 h-4 w-4" /> Volver al sitio
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="mr-2 h-4 w-4" /> Mi perfil
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="text-red-600 focus:text-red-600">
              <LogOut className="mr-2 h-4 w-4" /> Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
          <Search size={14} strokeWidth={1.75} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: A.textTertiary }} />
        </div>
        <button style={{ padding: '8px 14px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, color: A.textSecondary, background: A.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Download size={14} strokeWidth={1.75} /> Exportar
        </button>
        <button
          onClick={() => navigate('/user-landing')}
          title="Volver al sitio"
          style={{ padding: '8px 14px', border: `1px solid ${A.border}`, borderRadius: 8, fontSize: 13, fontFamily: A.fontSans, fontWeight: 500, color: A.textSecondary, background: A.surface, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          onMouseEnter={e => { e.currentTarget.style.background = A.rowHover; }}
          onMouseLeave={e => { e.currentTarget.style.background = A.surface; }}
        >
          <Home size={14} strokeWidth={1.75} /> Salir del admin
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
      case 'soporte':         return <SoporteView />;
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
