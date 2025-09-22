import { ModernButton } from "@/components/ui/modern-button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  Quote
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const ProviderLanding = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth?role=provider');
  };

  const valueProps = [
    {
      icon: DollarSign,
      title: "Comisiones Bajas",
      description: "Mantén más de lo que ganas",
      highlight: "Solo 8% de comisión"
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
      answer: "Cobramos solo 8% de comisión, una de las más bajas del mercado. Esto significa que te quedas con 92% de tus ganancias."
    },
    {
      question: "¿Puedo elegir mi propio horario?",
      answer: "¡Absolutamente! Tú decides cuándo trabajar, qué trabajos aceptar y en qué área de la ciudad operar. Tienes control total de tu tiempo."
    }
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
        {/* Background Icons */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-32 left-16">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/30 flex items-center justify-center transform rotate-12 hover:rotate-6 transition-transform duration-300">
              <Home size={32} className="text-gray-600/60" />
            </div>
          </div>
          
          <div className="absolute top-40 right-20">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/30 flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-300">
              <Wrench size={24} className="text-gray-600/60" />
            </div>
          </div>
          
          <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/30 flex items-center justify-center transform rotate-45 hover:rotate-12 transition-transform duration-300">
              <Droplets size={28} className="text-gray-600/60" />
            </div>
          </div>
          
          <div className="absolute top-1/2 right-12 transform -translate-y-1/2">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/30 flex items-center justify-center transform -rotate-6 hover:rotate-6 transition-transform duration-300">
              <Truck size={32} className="text-gray-600/60" />
            </div>
          </div>
          
          <div className="absolute bottom-32 left-24">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.3)] border border-white/30 flex items-center justify-center transform rotate-20 hover:rotate-0 transition-transform duration-300">
              <SprayCan size={24} className="text-gray-600/60" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <Badge className="bg-primary/10 text-primary border-primary/20 text-sm font-medium px-4 py-2">
              🚀 Únete a más de 500+ profesionales
            </Badge>
            
            <div className="space-y-6">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 leading-tight">
                Sé tu Propio Jefe.
                <span className="block text-primary">
                  Trabaja Cuando Quieras.
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-gray-600 leading-relaxed max-w-3xl mx-auto">
                Únete a Chamby y gana más con comisiones bajas, pagos garantizados y un flujo constante de clientes.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ModernButton 
                size="xl" 
                className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-4 text-lg"
                onClick={handleGetStarted}
              >
                Comenzar Ahora
                <ArrowRight className="ml-2 h-5 w-5" />
              </ModernButton>
              
              <ModernButton 
                variant="outline" 
                size="xl" 
                className="border-gray-300 text-gray-700 hover:bg-gray-50 px-8 py-4 text-lg"
              >
                Ver Testimonios
              </ModernButton>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-600 mt-8">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Sin costos ocultos</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Registro gratuito</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition Grid */}
      <section className="py-20 bg-white">
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
              <Card key={index} className="bg-white hover:shadow-lg transition-all duration-300 hover:transform hover:-translate-y-2 border-gray-200">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <prop.icon className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{prop.title}</h3>
                  <p className="text-gray-600 mb-4">{prop.description}</p>
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
      <section className="py-20 bg-gray-50">
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
                  <Card className="bg-white hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-8">
                      <div className="text-6xl font-bold text-primary/20 mb-4">{step.number}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-4">{step.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </CardContent>
                  </Card>
                  
                  {index < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                      <ArrowRight className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Placeholder */}
      <section className="py-20 bg-white">
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
              <Card key={item} className="bg-gray-50 border-gray-200">
                <CardContent className="p-8">
                  <Quote className="h-8 w-8 text-primary mb-4" />
                  <p className="text-gray-600 mb-6 italic">
                    "Testimonial placeholder - Historia de éxito de un profesional que trabaja con Chamby."
                  </p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-gray-300 rounded-full mr-4"></div>
                    <div>
                      <div className="font-semibold text-gray-900">Nombre del Profesional</div>
                      <div className="text-sm text-gray-600">Especialidad</div>
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
      <section className="py-20 bg-gray-50">
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
              <Card key={index} className="bg-white border-gray-200">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{faq.question}</h3>
                  <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
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

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 md:hidden z-50">
        <ModernButton 
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
          onClick={handleGetStarted}
        >
          Comenzar Ahora
          <ArrowRight className="ml-2 h-4 w-4" />
        </ModernButton>
      </div>
    </div>
  );
};

export default ProviderLanding;