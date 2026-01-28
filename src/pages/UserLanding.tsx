import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { useScrollParallax } from "@/hooks/useScrollParallax";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import InteractiveHeroBackground from "@/components/provider-portal/InteractiveHeroBackground";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, LogOut, User, Settings, CreditCard, Shield, LayoutDashboard, Plus, CheckCircle } from "lucide-react";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { ROUTES } from "@/constants/routes";
import { AISearchBar } from "@/components/AISearchBar";
import logo from "@/assets/chamby-logo-new-horizontal.png";
import { ArrowRight } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CategoryTabs } from "@/components/CategoryTabs";
const faqs = [
  {
    question: "¿Cómo funciona Chamby?",
    answer: "Chamby te conecta con profesionales verificados para todo tipo de servicios del hogar. Simplemente describe lo que necesitas, recibe cotizaciones y elige al mejor proveedor."
  },
  {
    question: "¿Cómo se garantiza la calidad del servicio?",
    answer: "Todos nuestros proveedores pasan por un proceso de verificación. Además, puedes ver las reseñas y calificaciones de otros usuarios antes de contratar."
  },
  {
    question: "¿Cuáles son los métodos de pago aceptados?",
    answer: "Aceptamos tarjetas de crédito, débito y otros métodos de pago electrónico para tu comodidad y seguridad."
  },
  {
    question: "¿Qué pasa si no estoy satisfecho con el servicio?",
    answer: "Tu satisfacción es nuestra prioridad. Si tienes algún problema, nuestro equipo de soporte está disponible para ayudarte a resolverlo."
  }
];

const UserLanding = () => {
  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();
  const {
    role,
    isAdmin,
    loading: roleLoading
  } = useUserRole();
  const {
    profile
  } = useProfile();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [ctaPulse, setCtaPulse] = useState(false);
  
  const { scrollY, parallaxOffset, dotOpacity, cardOpacity, mapOpacity, heroOpacity } = useScrollParallax(500);
  
  const handleJobCardVisible = useCallback((visible: boolean) => {
    setCtaPulse(visible);
  }, []);
  
  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
  };

  // Redirect non-authenticated users to public landing
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/", {
        replace: true
      });
    }
  }, [user, authLoading, navigate]);

  // Redirect providers to provider portal
  useEffect(() => {
    if (!roleLoading && role === "provider") {
      navigate("/provider-portal", {
        replace: true
      });
    }
  }, [role, roleLoading, navigate]);
  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>;
  }
  if (!user) {
    return null;
  }
  return <div className="min-h-screen bg-gradient-subtle">
      {/* Simple Header matching home page */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-0 flex items-center justify-between">
          <button onClick={() => navigate('/user-landing')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Chamby" className="h-48 md:h-56 w-auto -my-16 md:-my-20" />
          </button>
          
          {/* Desktop Profile Menu */}
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
                <DropdownMenuItem onClick={() => navigate("/profile/security")}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Seguridad</span>
                </DropdownMenuItem>
                {role === 'provider' && (
                  <DropdownMenuItem onClick={() => navigate("/provider-portal")}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Portal de Proveedores</span>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
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

          {/* Mobile Profile Avatar */}
          <div className="md:hidden">
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
                <DropdownMenuItem onClick={() => navigate("/profile/security")}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Seguridad</span>
                </DropdownMenuItem>
                {role === 'provider' && (
                  <DropdownMenuItem onClick={() => navigate("/provider-portal")}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Portal de Proveedores</span>
                  </DropdownMenuItem>
                )}
                {isAdmin && (
                  <DropdownMenuItem onClick={() => navigate("/admin")}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Admin Dashboard</span>
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
        </div>
      </header>
      
      {/* Hero Section with Interactive Background - matching Provider Landing */}
      <section className="relative min-h-[70vh] md:min-h-[80vh] lg:min-h-[90vh] flex items-center justify-center pt-24 pb-12 overflow-hidden">
        {/* Interactive animated background with parallax */}
        <InteractiveHeroBackground 
          onJobCardVisible={handleJobCardVisible}
          scrollY={scrollY}
          parallaxOffset={parallaxOffset}
          dotOpacity={dotOpacity}
          cardOpacity={cardOpacity}
          mapOpacity={mapOpacity}
        />
        
        {/* Hero content with fade effect on scroll */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{ 
            opacity: heroOpacity,
            transition: 'opacity 0.1s ease-out'
          }}
        />
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-5xl mx-auto text-center space-y-8">
            <Badge className="bg-white/10 text-white border-white/20 text-sm font-medium px-4 py-2 inline-flex items-center gap-2 backdrop-blur-sm">
              👋 ¡Hola{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
            </Badge>
            
            <h1 className="font-dillan text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white leading-[1.1] tracking-wide drop-shadow-lg">
              SOLUCIONA EN
              <span className="block">MINUTOS NO</span>
              <span className="block">EN DÍAS.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 leading-relaxed max-w-2xl mx-auto drop-shadow-md">
              Conectamos contigo a los mejores profesionales verificados
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-fit p-[3px] rounded-[14px] shadow-elegant overflow-hidden">
                {/* Rotating gradient border - hugs button tightly */}
                <div className="absolute inset-0">
                  <div className="absolute inset-[-100%] animate-rotate-gradient bg-[conic-gradient(from_0deg,hsl(214_80%_41%),hsl(210_20%_85%),hsl(214_80%_55%),hsl(214_80%_30%),hsl(210_20%_85%),hsl(214_80%_41%))]" />
                </div>
                <button 
                  className="relative inline-flex items-center justify-center bg-white text-primary hover:bg-white/90 font-semibold px-8 py-4 text-lg rounded-[10px] whitespace-nowrap"
                  onClick={() => navigate('/book-job')}
                >
                  Buscar Servicio
                  <ArrowRight className="ml-2 h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-white/90">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-white" />
                <span>Proveedores verificados</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-white" />
                <span>Pagos seguros</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-white" />
                <span>Garantía de calidad</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 pb-24">
        {/* Category Tabs - Using shared component */}
        <div className="mb-8 md:mb-12 -mt-8">
          <CategoryTabs />
        </div>

        {/* Recent Activity Section */}
        <div className="mb-6 md:mb-8">
          <h2 className="text-lg md:text-2xl font-semibold text-foreground mb-3 md:mb-4">
            Actividad Reciente
          </h2>
          <Card className="bg-gradient-card border-white/20">
            <CardContent className="py-8 md:py-12 text-center">
              <TrendingUp className="w-10 h-10 md:w-12 md:h-12 text-muted-foreground mx-auto mb-3 md:mb-4" />
              <p className="text-sm md:text-base text-muted-foreground">
                No tienes actividad reciente todavía
              </p>
              <Button onClick={() => navigate("/book-job")} className="mt-3 md:mt-4 bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant text-sm md:text-base">
                Buscar Servicios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Become Provider CTA */}
        {role === "client" && <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20 mb-4">
            <CardContent className="py-6 md:py-8 text-center">
              <h3 className="text-base md:text-xl font-semibold text-foreground mb-1.5 md:mb-2">
                ¿Quieres ofrecer tus servicios?
              </h3>
              <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4">
                Únete como proveedor y empieza a ganar dinero
              </p>
              <Button onClick={() => navigate(ROUTES.PROVIDER_AUTH)} className="bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant text-sm md:text-base">
                Convertirse en Proveedor
              </Button>
            </CardContent>
          </Card>}

        {/* FAQ Section */}
        <section className="py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="font-['Made_Dillan'] text-2xl sm:text-3xl md:text-4xl text-foreground mb-3">
              PREGUNTAS FRECUENTES
            </h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
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
        </section>
      </main>

      <Footer />
      <div className="desktop-only">
        <MobileBottomNav />
      </div>
    </div>;
};
export default UserLanding;