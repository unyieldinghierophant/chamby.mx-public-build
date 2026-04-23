import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import MobileBottomNav from "@/components/MobileBottomNav";
import ChambyLogoText from "@/components/ChambyLogoText";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronRight,
  LogOut,
  User,
  Settings,
  CreditCard,
  Shield,
  LayoutDashboard,
  TrendingUp,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { FullPageSkeleton } from "@/components/skeletons";
import { ROUTES } from "@/constants/routes";
import { CLIENT_ACTIVE_STATES } from "@/utils/jobStateMachine";
import { format } from "date-fns";
import { es } from "date-fns/locale";

import categoryHandyman from "@/assets/category-handyman.webp";
import categoryElectrician from "@/assets/category-electrician.webp";
import categoryPlumbing from "@/assets/category-plumbing.webp";
import categoryAuto from "@/assets/category-auto.webp";
import categoryCleaning from "@/assets/category-cleaning.webp";
import categoryGardening from "@/assets/category-gardening.webp";
import categoryAC from "@/assets/category-ac.webp";
import categoryAlbanileria from "@/assets/category-albanileria.webp";
import categoryPintura from "@/assets/category-pintura.webp";
import categoryElectrodomesticos from "@/assets/category-electrodomesticos.webp";

const BRAND = {
  primary: "#1456DB",
  primaryDark: "#0F47B8",
  accent: "#E86C25",
  bg: "#F7F7F5",
  card: "#FFFFFF",
  border: "#EEEDE9",
  text: "#1A1A18",
  textMuted: "#6B6A66",
  textSubtle: "#9C9B97",
  green: "#16A34A",
  amber: "#D97706",
  red: "#DC2626",
};

const HERO_CATEGORIES = [
  { slug: "plomeria", label: "Fontanería", icon: categoryPlumbing, serviceSlug: "plomeria-reparacion" },
  { slug: "electricidad", label: "Electricidad", icon: categoryElectrician, serviceSlug: "electricidad-general" },
  { slug: "limpieza", label: "Limpieza", icon: categoryCleaning, serviceSlug: "limpieza-hogar" },
  { slug: "jardineria", label: "Jardinería", icon: categoryGardening, serviceSlug: "jardineria-mantenimiento" },
] as const;

const ALL_CATEGORIES = [
  { slug: "plomeria", label: "Fontanería", icon: categoryPlumbing },
  { slug: "electricidad", label: "Electricidad", icon: categoryElectrician },
  { slug: "general", label: "Arreglos", icon: categoryHandyman },
  { slug: "limpieza", label: "Limpieza", icon: categoryCleaning },
  { slug: "jardineria", label: "Jardinería", icon: categoryGardening },
  { slug: "pintura", label: "Pintura", icon: categoryPintura },
  { slug: "albanileria", label: "Albañilería", icon: categoryAlbanileria },
  { slug: "aire-acondicionado", label: "A/C", icon: categoryAC },
  { slug: "electrodomesticos", label: "Electrodom.", icon: categoryElectrodomesticos },
  { slug: "auto", label: "Automotriz", icon: categoryAuto },
] as const;

const RECOMMENDED = [
  { slug: "limpieza", label: "Limpieza profunda", subtitle: "Casas y departamentos", icon: categoryCleaning },
  { slug: "electricidad", label: "Revisión eléctrica", subtitle: "Diagnóstico completo", icon: categoryElectrician },
  { slug: "plomeria", label: "Fugas y drenajes", subtitle: "Reparación urgente", icon: categoryPlumbing },
] as const;

interface ActiveJob {
  id: string;
  title: string;
  status: string;
  scheduled_at: string | null;
  provider_name: string | null;
}

interface LastJob {
  id: string;
  title: string;
  completed_at: string | null;
  provider_name: string | null;
  category: string | null;
}

const UserLanding = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { role, isAdmin, loading: roleLoading } = useUserRole();
  const { profile } = useProfile();
  const navigate = useNavigate();

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [activeJob, setActiveJob] = useState<ActiveJob | null>(null);
  const [lastJob, setLastJob] = useState<LastJob | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/", { replace: true });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!roleLoading && role === "provider") navigate("/provider-portal", { replace: true });
  }, [role, roleLoading, navigate]);

  // Safety-net: return-from-auth during booking flow
  useEffect(() => {
    const ret = localStorage.getItem("booking_auth_return");
    const checkoutPath = localStorage.getItem("booking_checkout_path");
    if (ret === "true") navigate(checkoutPath || "/book-job?checkout=1", { replace: true });
  }, [navigate]);

  // Active job + last completed job
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const fetchJobs = async () => {
      // Active
      const { data: active } = await supabase
        .from("jobs")
        .select("id, title, status, scheduled_at, provider_id")
        .eq("client_id", user.id)
        .in("status", CLIENT_ACTIVE_STATES as unknown as string[])
        .neq("status", "cancelled")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        if (active) {
          let providerName: string | null = null;
          if (active.provider_id) {
            const { data: p } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", active.provider_id)
              .maybeSingle();
            providerName = p?.full_name ?? null;
          }
          setActiveJob({
            id: active.id,
            title: active.title,
            status: active.status,
            scheduled_at: active.scheduled_at,
            provider_name: providerName,
          });
        } else {
          setActiveJob(null);
        }
      }

      // Last completed
      const { data: last } = await supabase
        .from("jobs")
        .select("id, title, updated_at, provider_id, category")
        .eq("client_id", user.id)
        .eq("status", "completed")
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!cancelled) {
        if (last) {
          let providerName: string | null = null;
          if (last.provider_id) {
            const { data: p } = await supabase
              .from("users")
              .select("full_name")
              .eq("id", last.provider_id)
              .maybeSingle();
            providerName = p?.full_name ?? null;
          }
          setLastJob({
            id: last.id,
            title: last.title,
            completed_at: last.updated_at,
            provider_name: providerName,
            category: last.category ?? null,
          });
        } else {
          setLastJob(null);
        }
      }
    };

    fetchJobs();

    const channel = supabase
      .channel("user-landing-jobs")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs", filter: `client_id=eq.${user.id}` },
        () => fetchJobs()
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
    navigate("/");
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchText.trim();
    if (!q) return;
    navigate(`/book-job?intent=${encodeURIComponent(q)}&source=home_search&new=${Date.now()}`);
  };

  const goToCategory = (slug: string) => {
    navigate(`/book-job?category=${slug}&source=home_category&new=${Date.now()}`);
  };

  if (authLoading || roleLoading) return <FullPageSkeleton />;
  if (!user) return null;

  const firstName = profile?.full_name?.split(" ")[0] ?? "";
  const initial = (profile?.full_name || user.email || "U").charAt(0).toUpperCase();

  return (
    <div className="min-h-screen font-jakarta" style={{ background: BRAND.bg, color: BRAND.text }}>
      <div className="mx-auto w-full max-w-[500px] pb-28">
        {/* ── 1. Sticky header ───────────────────────────────── */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-5 py-3.5"
          style={{ background: BRAND.bg, borderBottom: `1px solid ${BRAND.border}` }}
        >
          <ChambyLogoText onClick={() => navigate(ROUTES.DASHBOARD_USER)} size="md" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="relative h-10 w-10 rounded-full focus:outline-none">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback
                    className="text-sm font-semibold"
                    style={{ background: BRAND.primary, color: "#fff" }}
                  >
                    {initial}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 font-jakarta" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-semibold leading-none">{profile?.full_name || "Usuario"}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)}>
                <User className="mr-2 h-4 w-4" /> Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE_SETTINGS)}>
                <Settings className="mr-2 h-4 w-4" /> Configuración
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile/payment-settings")}>
                <CreditCard className="mr-2 h-4 w-4" /> Pagos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE_SECURITY)}>
                <Shield className="mr-2 h-4 w-4" /> Seguridad
              </DropdownMenuItem>
              {role === "provider" && (
                <DropdownMenuItem onClick={() => navigate(ROUTES.PROVIDER_PORTAL)}>
                  <TrendingUp className="mr-2 h-4 w-4" /> Portal de Proveedores
                </DropdownMenuItem>
              )}
              {isAdmin && (
                <DropdownMenuItem onClick={() => navigate("/admin")}>
                  <LayoutDashboard className="mr-2 h-4 w-4" /> Admin
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
                <LogOut className="mr-2 h-4 w-4" />
                {isLoggingOut ? "Saliendo…" : "Cerrar sesión"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="px-5 pt-5 space-y-7">
          {/* ── 2. Greeting + search ─────────────────────────── */}
          <section className="space-y-3 animate-fade-in">
            <div>
              <p className="text-[11px] uppercase tracking-[0.14em] font-semibold" style={{ color: BRAND.textSubtle }}>
                ¡Hola{firstName ? `, ${firstName}` : ""}!
              </p>
              <h1 className="text-[26px] font-bold leading-tight mt-1" style={{ color: BRAND.text }}>
                ¿Qué necesitas hoy?
              </h1>
            </div>
            <form onSubmit={handleSearch} className="relative">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 h-[18px] w-[18px]"
                style={{ color: BRAND.textMuted }}
              />
              <input
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar un servicio…"
                className="w-full rounded-[16px] py-3.5 pl-12 pr-4 text-[15px] outline-none transition-colors focus:border-[color:var(--brand-primary)]"
                style={{
                  background: BRAND.card,
                  border: `1.5px solid ${BRAND.border}`,
                  color: BRAND.text,
                  ["--brand-primary" as string]: BRAND.primary,
                }}
              />
            </form>
          </section>

          {/* ── 3. Hero category cards (2-col) ────────────────── */}
          <section className="animate-fade-in" style={{ animationDelay: "60ms" }}>
            <SectionHeading title="Categorías populares" />
            <div className="grid grid-cols-2 gap-3 mt-3">
              {HERO_CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => goToCategory(c.slug)}
                  className="group relative overflow-hidden rounded-[18px] p-4 text-left transition-all active:scale-[0.98]"
                  style={{
                    background: BRAND.card,
                    border: `1.5px solid ${BRAND.border}`,
                    minHeight: 132,
                  }}
                >
                  <img
                    src={c.icon}
                    alt={c.label}
                    className="absolute -right-2 -bottom-2 w-[92px] h-[92px] object-contain transition-transform group-hover:scale-110"
                    style={{ imageRendering: "auto" }}
                  />
                  <div className="relative z-10">
                    <p className="text-[11px] uppercase tracking-wider font-semibold" style={{ color: BRAND.textMuted }}>
                      Servicio
                    </p>
                    <p className="text-[17px] font-bold mt-1 leading-snug" style={{ color: BRAND.text }}>
                      {c.label}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* ── 4. Horizontal categories scroll ──────────────── */}
          <section className="animate-fade-in" style={{ animationDelay: "120ms" }}>
            <SectionHeading title="Todas las categorías" action={{ label: "Ver todas", onClick: () => navigate("/book-job") }} />
            <div className="-mx-5 px-5 mt-3 flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {ALL_CATEGORIES.map((c) => (
                <button
                  key={c.slug}
                  onClick={() => goToCategory(c.slug)}
                  className="flex flex-col items-center gap-2 flex-shrink-0 rounded-2xl px-3 py-3 transition-all active:scale-95"
                  style={{
                    background: BRAND.card,
                    border: `1.5px solid ${BRAND.border}`,
                    minWidth: 88,
                  }}
                >
                  <div className="w-12 h-12 flex items-center justify-center">
                    <img src={c.icon} alt={c.label} className="w-12 h-12 object-contain" style={{ transform: "scale(1.7)" }} />
                  </div>
                  <span className="text-[11px] font-semibold text-center leading-tight" style={{ color: BRAND.text }}>
                    {c.label}
                  </span>
                </button>
              ))}
            </div>
          </section>

          {/* ── 5. Active job banner (conditional) ───────────── */}
          {activeJob && (
            <section className="animate-fade-in" style={{ animationDelay: "180ms" }}>
              <button
                onClick={() => navigate("/active-jobs")}
                className="w-full flex items-center gap-3 rounded-[18px] p-4 text-left transition-all active:scale-[0.99]"
                style={{ background: BRAND.primary, color: "#fff" }}
              >
                <span className="relative flex-shrink-0 w-3 h-3">
                  <span className="absolute inset-0 rounded-full bg-white motion-safe:animate-ping opacity-60" />
                  <span className="relative block w-3 h-3 rounded-full bg-white" />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-white/70">
                    Trabajo en curso
                  </p>
                  <p className="text-[15px] font-bold truncate">{activeJob.title}</p>
                  {(activeJob.provider_name || activeJob.scheduled_at) && (
                    <p className="text-[12px] text-white/75 truncate mt-0.5">
                      {activeJob.provider_name}
                      {activeJob.provider_name && activeJob.scheduled_at ? " · " : ""}
                      {activeJob.scheduled_at &&
                        format(new Date(activeJob.scheduled_at), "d MMM, HH:mm", { locale: es })}
                    </p>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 flex-shrink-0" />
              </button>
            </section>
          )}

          {/* ── 6. Verified technicians banner ───────────────── */}
          <section className="animate-fade-in" style={{ animationDelay: "240ms" }}>
            <div
              className="flex items-center gap-4 rounded-[18px] p-4"
              style={{ background: BRAND.card, border: `1.5px solid ${BRAND.border}` }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: `${BRAND.primary}14` }}
              >
                <ShieldCheck className="w-6 h-6" style={{ color: BRAND.primary }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold leading-snug" style={{ color: BRAND.text }}>
                  Técnicos verificados
                </p>
                <p className="text-[12px] mt-0.5 leading-snug" style={{ color: BRAND.textMuted }}>
                  Identidad confirmada, experiencia comprobada.
                </p>
              </div>
              <button
                onClick={() => navigate("/how-it-works")}
                className="flex-shrink-0 rounded-full text-[12px] font-semibold px-3 py-2 transition-colors"
                style={{ background: BRAND.primary, color: "#fff" }}
              >
                Saber más
              </button>
            </div>
          </section>

          {/* ── 7. Recommended services ──────────────────────── */}
          <section className="animate-fade-in" style={{ animationDelay: "300ms" }}>
            <SectionHeading title="Servicios recomendados" icon={<Sparkles className="w-4 h-4" style={{ color: BRAND.accent }} />} />
            <div className="space-y-2.5 mt-3">
              {RECOMMENDED.map((r) => (
                <button
                  key={r.slug + r.label}
                  onClick={() => goToCategory(r.slug)}
                  className="w-full flex items-center gap-3 rounded-[16px] p-3 text-left transition-all active:scale-[0.99]"
                  style={{ background: BRAND.card, border: `1.5px solid ${BRAND.border}` }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: BRAND.bg }}
                  >
                    <img src={r.icon} alt={r.label} className="w-10 h-10 object-contain" style={{ transform: "scale(1.5)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold leading-snug" style={{ color: BRAND.text }}>
                      {r.label}
                    </p>
                    <p className="text-[12px] leading-snug mt-0.5" style={{ color: BRAND.textMuted }}>
                      {r.subtitle}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: BRAND.textSubtle }} />
                </button>
              ))}
            </div>
          </section>

          {/* ── 8. Last booking (conditional) ────────────────── */}
          {lastJob && (
            <section className="animate-fade-in" style={{ animationDelay: "360ms" }}>
              <SectionHeading title="Tu última chamba" />
              <div
                className="rounded-[18px] p-4 mt-3"
                style={{ background: BRAND.card, border: `1.5px solid ${BRAND.border}` }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: `${BRAND.green}18` }}
                  >
                    <Star className="w-5 h-5" style={{ color: BRAND.green }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold leading-snug truncate" style={{ color: BRAND.text }}>
                      {lastJob.title}
                    </p>
                    <p className="text-[12px] leading-snug mt-0.5" style={{ color: BRAND.textMuted }}>
                      {lastJob.provider_name || "Proveedor Chamby"}
                      {lastJob.completed_at
                        ? ` · ${format(new Date(lastJob.completed_at), "d MMM yyyy", { locale: es })}`
                        : ""}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={() => navigate(`/active-jobs?job_id=${lastJob.id}`)}
                    variant="outline"
                    className="flex-1 font-jakarta font-semibold text-[13px] rounded-full h-10"
                    style={{ borderColor: BRAND.border, color: BRAND.text }}
                  >
                    Ver detalles
                  </Button>
                  <Button
                    onClick={() => lastJob.category && goToCategory(lastJob.category)}
                    className="flex-1 font-jakarta font-semibold text-[13px] rounded-full h-10"
                    style={{ background: BRAND.primary, color: "#fff" }}
                  >
                    Repetir servicio
                  </Button>
                </div>
              </div>
            </section>
          )}

          {/* ── 9. Bottom spacer (covered by MobileBottomNav) ── */}
          <div className="h-2" />
        </main>
      </div>

      <MobileBottomNav />
    </div>
  );
};

function SectionHeading({
  title,
  action,
  icon,
}: {
  title: string;
  action?: { label: string; onClick: () => void };
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-[15px] font-bold flex items-center gap-2" style={{ color: BRAND.text }}>
        {icon}
        {title}
      </h2>
      {action && (
        <button
          onClick={action.onClick}
          className="text-[12px] font-semibold transition-colors"
          style={{ color: BRAND.primary }}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default UserLanding;
