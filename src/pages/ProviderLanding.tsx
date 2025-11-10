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
  TrendingUp
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { useProfile } from "@/hooks/useProfile";
import { useState } from "react";
import logo from "@/assets/chamby-logo-text.png";
import walkingProvider from "@/assets/provider-character.png";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

const ProviderLanding = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const { isVerified } = useVerificationStatus();
  const { profile } = useProfile();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
  };

  const handleGetStarted = () => {
    if (user) {
      // Usuario logueado - verificar si es tasker
      if (profile?.is_tasker) {
        navigate('/provider-portal');
      } else {
        navigate('/become-provider');
      }
    } else {
      // Usuario no logueado - llevar a registro con tab de signup
      navigate('/auth/tasker?tab=signup');
    }
  };

  const handleListServices = () => {
    if (!user) {
      // No logueado - llevar a registro
      navigate('/auth/tasker?tab=signup');
    } else if (!profile?.is_tasker) {
      // Logueado pero no es tasker - llevar a onboarding
      navigate('/become-provider');
    } else if (!isVerified) {
      // Es tasker pero no verificado - llevar a verificación
      navigate('/tasker-verification');
    } else {
      // Es tasker y verificado - llevar a portal
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
    <div className="min-h-screen bg-gradient-subtle">
      {/* Simple Header matching user landing page */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Chamby" className="w-40 h-40 -my-16" />
          </button>
          
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
                  {profile?.is_tasker && (
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
            <Button onClick={() => navigate('/auth/tasker')} className="bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant">
              Iniciar Sesión
            </Button>
          )}
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-24 pb-12 overflow-hidden bg-gradient-to-br from-background to-accent/20">
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Left Column - Text Content */}
              <div className="space-y-8 text-left">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-sm font-medium px-4 py-2 inline-flex items-center gap-2">
                  🚀 Únete a más de 500+ profesionales
                </Badge>
                
                <div className="space-y-6">
                  <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-[1.1]">
                    Sé tu Propio Jefe.{" "}
                    <span className="block mt-2">
                      Trabaja Cuando Quieras.
                    </span>
                  </h1>
                  
                  <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-2xl">
                    Únete a Chamby y gana más con comisiones bajas, pagos garantizados y un flujo constante de clientes.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <ModernButton 
                    size="xl" 
                    className="bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant font-semibold px-8 py-4 text-lg"
                    onClick={handleGetStarted}
                  >
                    Comenzar Ahora
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </ModernButton>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Sin costos ocultos</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span>Registro gratuito</span>
                  </div>
                </div>
              </div>

              {/* Right Column - Character Illustration - 2x larger */}
              <div className="relative flex items-center justify-center lg:justify-end">
                <div className="relative w-full" style={{ maxWidth: '800px' }}>
                  <img 
                    src={walkingProvider} 
                    alt="Chamby Professional" 
                    className="w-full h-auto animate-[float_3s_ease-in-out_infinite]"
                    style={{
                      filter: 'drop-shadow(0 20px 40px rgba(30, 58, 138, 0.3))'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ¿Por qué elegir Chamby?
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Te damos todas las herramientas para que construyas un negocio exitoso
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {valueProps.map((prop, index) => (
              <Card key={index} className="bg-gradient-card border-white/20 hover:shadow-elegant transition-all duration-300 hover:transform hover:-translate-y-2">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <prop.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{prop.title}</h3>
                  <p className="text-muted-foreground mb-4">{prop.description}</p>
                  <Badge className="bg-green-100 text-green-700 border-green-200">
                    {prop.highlight}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Cómo Funciona
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Comenzar es fácil, solo sigue estos 3 simples pasos
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <div key={index} className="relative">
                  <Card className="bg-gradient-card border-white/20 hover:shadow-elegant transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="text-6xl font-bold text-primary/20 mb-4">{step.number}</div>
                      <h3 className="text-xl font-bold text-foreground mb-4">{step.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                    </CardContent>
                  </Card>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="h-8 w-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Lo que dicen nuestros profesionales
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Historias reales de éxito de nuestra comunidad
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[1, 2, 3].map((item) => (
              <Card key={item} className="bg-gradient-card border-white/20">
                <CardContent className="p-8">
                  <Quote className="h-8 w-8 text-primary mb-4" />
                  <p className="text-muted-foreground mb-6 italic">
                    "Testimonial placeholder - Historia de éxito de un profesional que trabaja con Chamby."
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-muted rounded-full mr-4"></div>
                    <div>
                      <div className="font-semibold text-foreground">Nombre del Profesional</div>
                      <div className="text-sm text-muted-foreground">Especialidad</div>
                    </div>
                  </div>
                  <div className="flex mt-4">
                    {[...Array(5)].map((_, i) => (
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
      <section className="py-20 bg-gradient-subtle">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Preguntas Frecuentes
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Resolvemos tus dudas más comunes
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-gradient-card border-white/20">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-4">{faq.question}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-4xl font-bold text-white mb-4">
              ¿Listo para Empezar?
            </h2>
            <p className="text-xl text-white/90 leading-relaxed">
              Únete a cientos de profesionales que ya están ganando más con Chamby
            </p>
            
            <ModernButton 
              size="xl" 
              className="bg-white text-primary hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
              onClick={handleGetStarted}
            >
              Comenzar Ahora - Es Gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </ModernButton>
            
            <p className="text-white/80 text-sm">
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