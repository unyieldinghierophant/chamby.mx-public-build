import { useState, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ModernButton } from "@/components/ui/modern-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { 
  Star, 
  DollarSign, 
  Shield, 
  Clock, 
  CheckCircle, 
  Users, 
  Home, 
  Wrench, 
  Droplets, 
  Truck, 
  SprayCan,
  ArrowRight,
  Quote,
  LogOut,
  User,
  Settings,
  CreditCard,
  TrendingUp,
  Plus,
  Menu,
  X
} from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { useProfile } from "@/hooks/useProfile";
// useState/useCallback moved to top import
import ChambyLogoText from "@/components/ChambyLogoText";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { ProviderHeroMap, type JobInfo } from "@/components/provider-portal/ProviderHeroMap";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import { useLandingSkeleton } from "@/hooks/useLandingSkeleton";
import { ProviderLandingSkeleton } from "@/components/ProviderLandingSkeleton";

const ProviderLanding = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const { isVerified } = useVerificationStatus();
  const { profile } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [ctaPulse, setCtaPulse] = useState(false);
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [incompleteOnboarding, setIncompleteOnboarding] = useState(false);

  useEffect(() => {
    if (!user || role !== 'provider') return;
    supabase
      .from('providers')
      .select('onboarding_complete')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && data.onboarding_complete === false) setIncompleteOnboarding(true);
      });
  }, [user, role]);
  const { isSkeletonVisible, onHeroMediaReady } = useLandingSkeleton();

  // Parallax scroll effect
  const { scrollY, parallaxOffset, dotOpacity, cardOpacity, mapOpacity, heroOpacity } = useScrollParallax(500);

  // Job label state — synced with ProviderHeroMap fly-to animation
  const [activeJob, setActiveJob] = useState<JobInfo | null>(null);
  const [labelPhase, setLabelPhase] = useState<"hidden" | "visible" | "exiting">("hidden");
  const labelExitTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleJobEnter = useCallback((job: JobInfo) => {
    setActiveJob(job);
    setLabelPhase("visible");
  }, []);

  const handleJobExit = useCallback(() => {
    setLabelPhase("exiting");
    if (labelExitTimer.current) clearTimeout(labelExitTimer.current);
    labelExitTimer.current = setTimeout(() => setLabelPhase("hidden"), 500);
  }, []);

  const handleJobCardVisible = useCallback((visible: boolean) => {
    setCtaPulse(visible);
  }, []);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
    navigate("/provider-landing");
  };

  const handleGetStarted = () => {
    if (user) {
      // Usuario logueado - verificar si es proveedor
      if (role === 'provider') {
        navigate('/provider-portal');
      } else {
        navigate('/provider/onboarding');
      }
    } else {
      // Usuario no logueado - llevar a registro con tab de signup
      navigate('/provider/onboarding?tab=signup');
    }
  };

  const handleListServices = () => {
    if (!user) {
      // No logueado - llevar a registro
      navigate('/provider/onboarding?tab=signup');
    } else if (role !== 'provider') {
      // Logueado pero no es proveedor - llevar a auth
      navigate('/provider/onboarding');
    } else if (!isVerified) {
      // Es provider pero no verificado - llevar a verificación
      navigate('/provider-verification');
    } else {
      // Es provider y verificado - llevar a portal
      navigate('/provider-portal');
    }
  };

  const valueProps = [
    {
      icon: DollarSign,
      title: "Comisiones Bajas",
      description: "Mantén más de lo que ganas",
      highlight: "Solo 10% de comisión"
    },
    {
      icon: Shield,
      title: "Pagos Garantizados",
      description: "Cada trabajo se paga de forma segura",
      highlight: "100% protegido"
    },
    {
      icon: Clock,
      title: "Horario Flexible",
      description: "Elige cuándo y dónde trabajar",
      highlight: "Tu decides"
    },
    {
      icon: Users,
      title: "Clientes Verificados",
      description: "Trabaja solo con clientes confiables",
      highlight: "Verificación completa"
    }
  ];

  const steps = [
    {
      number: "01",
      title: "Regístrate y Verifica",
      description: "Completa tu perfil con ID, antecedentes penales y comprobante de domicilio"
    },
    {
      number: "02", 
      title: "Lista tus Habilidades",
      description: "Añade tus servicios y establece tus tarifas (plomería, limpieza, mudanzas, etc.)"
    },
    {
      number: "03",
      title: "Comienza a Ganar",
      description: "Conéctate con clientes y empieza a trabajar inmediatamente"
    }
  ];

  const faqs = [
    {
      question: "¿Cómo me pagan?",
      answer: "Los pagos se procesan automáticamente después de completar cada trabajo. Recibe tu dinero en 1-2 días hábiles directamente en tu cuenta bancaria."
    },
    {
      question: "¿Cuánta comisión cobra Chamby?",
      answer: "Cobramos solo 10% de comisión, una de las más bajas del mercado. Esto significa que te quedas con 90% de tus ganancias."
    },
    {
      question: "¿Puedo elegir mi propio horario?",
      answer: "¡Absolutamente! Tú decides cuándo trabajar, qué trabajos aceptar y en qué área de la ciudad operar. Tienes control total de tu tiempo."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle relative">
      {/* Skeleton overlay to hide asset pop-in */}
      {isSkeletonVisible && (
        <div className="fixed inset-0 z-[9999]">
          <ProviderLandingSkeleton />
        </div>
      )}
      {/* Simple Header matching user landing page */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="relative flex h-16 md:h-20 w-full items-center px-4 md:px-8">
          {/* Logo - centered on mobile, left-aligned on desktop */}
          <div className="absolute left-1/2 -translate-x-[calc(50%+10px)] md:static md:translate-x-0 flex items-center">
            <ChambyLogoText onClick={() => navigate('/')} size="lg" />
          </div>

          {/* Right */}
          <div className="ml-auto flex items-center">
          
          {user && (
            <div className="hidden md:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user?.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {profile?.full_name || "Usuario"}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile/payment-settings")}>
                    <CreditCard className="mr-2 h-4 w-4" />
                    <span>Pagos</span>
                  </DropdownMenuItem>
                  {role === 'provider' && (
                    <DropdownMenuItem onClick={() => navigate("/provider-portal")}>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      <span>Portal de Proveedores</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          {!user && (
            <>
              <Button onClick={() => navigate('/provider/login')} className="hidden md:inline-flex bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant">
                Iniciar Sesión
              </Button>
              <button
                className="md:hidden p-2 hover:bg-accent rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </>
          )}
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && !user && (
          <div className="md:hidden border-t border-border bg-background px-4 py-4 space-y-3">
            <button
              onClick={() => { navigate('/provider/login'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
            >
              Iniciar Sesión
            </button>
            <button
              onClick={() => { navigate('/provider/onboarding?tab=signup'); setMobileMenuOpen(false); }}
              className="block w-full text-left py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
            >
              Registrarse como Proveedor
            </button>
          </div>
        )}
      </header>
      
      {/* Incomplete onboarding banner */}
      {incompleteOnboarding && (
        <div className="fixed top-16 md:top-20 left-0 right-0 z-40 bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between gap-3">
          <p className="text-sm text-amber-800 font-medium">
            Completa tu perfil para empezar a recibir trabajos
          </p>
          <button
            onClick={() => navigate('/provider/onboarding')}
            className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-800 text-white hover:bg-amber-900 transition-colors"
          >
            Retomar registro
          </button>
        </div>
      )}

      {/* Hero Section — full-screen map with animated job label */}
      <section className="relative h-screen min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Map — isolation:isolate keeps Leaflet's z-indices contained */}
        <div className="absolute inset-0 z-0" style={{ isolation: "isolate" }}>
          <ProviderHeroMap
            onReady={onHeroMediaReady}
            onJobEnter={handleJobEnter}
            onJobExit={handleJobExit}
          />
        </div>

        {/* Soft light vignette — fades map edges, keeps center clear */}
        <div
          className="absolute inset-0 z-[2] pointer-events-none"
          style={{
            background: [
              "radial-gradient(ellipse 90% 60% at 50% 48%, transparent 20%, rgba(248,250,252,0.5) 100%)",
              "linear-gradient(to bottom, rgba(248,250,252,0.5) 0%, transparent 15%, transparent 75%, rgba(248,250,252,0.95) 100%)",
            ].join(", "),
          }}
        />

        {/* Hero content */}
        <div className="relative z-[3] px-6 w-full flex justify-center">
          <motion.div
            className="flex flex-col items-center text-center"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          >
            {/* Badge — clickable pill to onboarding */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
              className="mb-4"
            >
              <button
                onClick={() => navigate('/provider/onboarding?tab=signup')}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#2563EB] text-white text-sm font-medium border border-blue-400/30 shadow-sm hover:bg-[#1D4ED8] transition-colors backdrop-blur-sm"
              >
                🚀 Únete a más de 500 chambynautas
              </button>
            </motion.div>

            {/* Title */}
            <motion.h1
              className="font-jakarta font-bold text-[#1B2A4A] leading-[1.05]"
              style={{ fontSize: "clamp(38px, 6vw, 76px)", letterSpacing: "-1.5px" }}
              variants={{ hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6 } } }}
            >
              Sé tu propio jefe
            </motion.h1>

            {/* Job label slot — fixed height so layout never shifts */}
            <div
              style={{
                height: "68px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                margin: "20px 0",
                minWidth: "260px",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "10px",
                  padding: "10px 18px 10px 12px",
                  background: "rgba(255,255,255,0.92)",
                  backdropFilter: "blur(16px)",
                  WebkitBackdropFilter: "blur(16px)",
                  border: "1px solid #E2E8F0",
                  borderRadius: "12px",
                  whiteSpace: "nowrap",
                  boxShadow: "0 4px 24px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)",
                  opacity: labelPhase === "visible" ? 1 : 0,
                  transform:
                    labelPhase === "visible"
                      ? "translateY(0) scale(1)"
                      : labelPhase === "exiting"
                      ? "translateY(-6px) scale(0.96)"
                      : "translateY(6px) scale(0.96)",
                  transition:
                    "opacity 0.5s ease, transform 0.5s cubic-bezier(0.16,1,0.3,1)",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "8px",
                    background: "rgba(37,99,235,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontSize: "16px",
                    lineHeight: 1,
                  }}
                >
                  {activeJob?.icon ?? "🔧"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 600,
                      color: "#1B2A4A",
                      letterSpacing: "-0.2px",
                    }}
                  >
                    {activeJob?.title ?? ""}
                  </span>
                  <span style={{ fontSize: "11px", color: "#94A3B8", fontWeight: 400 }}>
                    {activeJob?.zone ?? ""} · hace un momento
                  </span>
                </div>
              </div>
            </div>

            {/* CTA — keep existing animated-border design */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            >
              <div className="relative w-fit p-[3px] rounded-[14px] shadow-elegant overflow-hidden">
                <div className="absolute inset-0">
                  <div className="absolute inset-[-100%] animate-rotate-gradient bg-[conic-gradient(from_0deg,hsl(214_80%_41%),hsl(210_20%_85%),hsl(214_80%_55%),hsl(214_80%_30%),hsl(210_20%_85%),hsl(214_80%_41%))]" />
                </div>
                <button
                  className="relative inline-flex items-center justify-center bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg rounded-[10px] whitespace-nowrap"
                  onClick={handleGetStarted}
                >
                  Comenzar Ahora
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </motion.div>

            {/* Trust bar */}
            <motion.div
              className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-7 text-sm font-medium text-slate-500 mt-6"
              variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
            >
              {["Sin costos ocultos", "Registro gratuito", "Solo 10% comisión"].map(
                (label) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-4 h-4 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                      <svg viewBox="0 0 24 24" className="w-2.5 h-2.5" fill="none" stroke="#2563EB" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    </span>
                    {label}
                  </div>
                )
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Live indicator — bottom-left */}
        <div className="absolute bottom-4 left-4 z-[4] md:bottom-6 md:left-6 flex items-center gap-2 px-3 py-2 rounded-lg bg-white/90 backdrop-blur-sm border border-[#E2E8F0] text-xs font-medium text-slate-500 pointer-events-none">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          En vivo · Guadalajara
        </div>
      </section>

      {/* Client CTA Section */}
      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div 
            onClick={() => navigate('/')}
            className="group relative max-w-2xl mx-auto w-full rounded-2xl border-2 border-foreground/80 bg-gradient-to-br from-background via-muted/30 to-background p-5 md:p-6 shadow-md hover:shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center gap-4 cursor-pointer"
          >
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Home className="w-7 h-7 text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <h3 className="text-lg md:text-xl font-bold text-foreground leading-tight">
                ¿Quieres contratar un servicio?
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                Encuentra profesionales verificados cerca de ti
              </p>
            </div>
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground flex items-center justify-center group-hover:bg-primary transition-colors">
              <ArrowRight className="w-5 h-5 text-background" />
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-jakarta font-semibold text-3xl sm:text-4xl text-foreground mb-4">
              ¿POR QUÉ ELEGIR CHAMBY?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Te damos todas las herramientas para que construyas un negocio exitoso
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((prop, index) => (
              <Card key={index} className="bg-card border border-border hover:shadow-elegant transition-all duration-300 hover:transform hover:-translate-y-2">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
                    <prop.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{prop.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{prop.description}</p>
                  <Badge className="bg-primary/10 text-primary border-primary/20">
                    {prop.highlight}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-jakarta font-semibold text-3xl sm:text-4xl text-foreground mb-4">
              CÓMO FUNCIONA
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comenzar es fácil, solo sigue estos 3 simples pasos
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="bg-card border border-border hover:shadow-elegant transition-all duration-300 h-full">
                    <CardContent className="p-6">
                      <div className="text-5xl font-bold text-primary/20 mb-4">{step.number}</div>
                      <h3 className="text-lg font-bold text-foreground mb-3">{step.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                    </CardContent>
                  </Card>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                      <ArrowRight className="h-6 w-6 text-primary/40" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-jakarta font-semibold text-3xl sm:text-4xl text-foreground mb-4">
              LO QUE DICEN NUESTROS PROFESIONALES
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Historias reales de éxito de nuestra comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                quote: "Antes tenía que buscar clientes por mi cuenta. Ahora con Chamby me llegan trabajos constantes y el pago siempre es seguro. En 3 meses dupliqué mis ingresos.",
                name: "Roberto Mendoza",
                specialty: "Plomero · Guadalajara",
                rating: 5,
                initials: "RM"
              },
              {
                quote: "Lo que más me gusta es la flexibilidad. Yo decido cuándo trabajar y qué trabajos aceptar. La comisión del 10% es mucho mejor que otras plataformas.",
                name: "María Elena Torres",
                specialty: "Limpieza · Zapopan",
                rating: 5,
                initials: "MT"
              },
              {
                quote: "El proceso de verificación me dio confianza. Los clientes saben que somos profesionales serios. He conseguido clientes recurrentes gracias a Chamby.",
                name: "Carlos Jiménez",
                specialty: "Electricista · Tlaquepaque",
                rating: 5,
                initials: "CJ"
              }
            ].map((testimonial, index) => (
              <Card key={index} className="bg-card border border-border">
                <CardContent className="p-6">
                  <Quote className="h-6 w-6 text-primary mb-4" />
                  <p className="text-sm text-muted-foreground mb-5 italic">
                    "{testimonial.quote}"
                  </p>
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-primary/10 rounded-full mr-3 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary">{testimonial.initials}</span>
                    </div>
                    <div>
                      <div className="font-semibold text-foreground text-sm">{testimonial.name}</div>
                      <div className="text-xs text-muted-foreground">{testimonial.specialty}</div>
                    </div>
                  </div>
                  <div className="flex mt-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-accent/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="font-jakarta font-semibold text-3xl sm:text-4xl text-foreground mb-4">
              PREGUNTAS FRECUENTES
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Resolvemos tus dudas más comunes
            </p>
          </div>

          <Accordion type="single" collapsible className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`faq-${index}`}
                className="group bg-card border border-border/50 rounded-xl px-6 overflow-hidden data-[state=open]:shadow-lg transition-all duration-300"
              >
                <AccordionTrigger className="text-base sm:text-lg font-semibold text-foreground hover:no-underline py-5 [&>svg]:hidden">
                  <span className="text-left flex-1 pr-4">{faq.question}</span>
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 shrink-0">
                    <Plus className="h-4 w-4 text-primary transition-transform duration-300 group-data-[state=open]:rotate-45" />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-sm sm:text-base text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="font-jakarta font-semibold text-3xl sm:text-4xl text-white mb-4">
              ¿LISTO PARA EMPEZAR?
            </h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Únete a cientos de profesionales que ya están ganando más con Chamby
            </p>
            
            <ModernButton 
              size="xl" 
              className="bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg"
              onClick={handleGetStarted}
            >
              Comenzar Ahora - Es Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </ModernButton>
            
            <p className="text-white/70 text-sm">
              Sin compromisos • Cancelación gratuita • Soporte incluido
            </p>
          </div>
        </div>
      </section>

      <Footer />
      <div className="desktop-only">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default ProviderLanding;