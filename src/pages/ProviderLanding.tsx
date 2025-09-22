import { useNavigate } from "react-router-dom";
import { CheckCircle, DollarSign, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const ProviderLanding = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/auth?role=provider');
  };

  const valueProps = [
    {
      icon: DollarSign,
      title: "Comisiones bajas",
      description: "Mantén más de tus ganancias con nuestras tarifas competitivas"
    },
    {
      icon: Shield,
      title: "Pagos garantizados",
      description: "Recibe tus pagos de forma segura y puntual"
    },
    {
      icon: Users,
      title: "Clientes seguros",
      description: "Trabajamos solo con clientes verificados y confiables"
    }
  ];

  const steps = [
    {
      number: "1",
      title: "Regístrate",
      description: "Crea tu cuenta de proveedor en minutos"
    },
    {
      number: "2", 
      title: "Verifica",
      description: "Completa tu perfil y verifica tu identidad"
    },
    {
      number: "3",
      title: "Comienza a trabajar",
      description: "Recibe solicitudes y empieza a ganar dinero"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-95"></div>
          <div className="absolute inset-0 bg-gradient-mesh"></div>
          
          <div className="relative container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
              Gana dinero con tu
              <br />
              <span className="text-primary-light">propio horario</span>
            </h1>
            
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
              Únete a miles de profesionales que ya están generando ingresos 
              ofreciendo sus servicios en nuestra plataforma
            </p>
            
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-lg px-8 py-6 h-auto font-semibold shadow-floating"
            >
              Comenzar ahora
            </Button>
          </div>
        </section>

        {/* Value Props Section */}
        <section className="py-16 lg:py-24 bg-card">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
              ¿Por qué elegir nuestra plataforma?
            </h2>
            
            <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
              {valueProps.map((prop, index) => (
                <div key={index} className="text-center group">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-button rounded-full mb-6 shadow-soft group-hover:shadow-glow transition-all duration-300">
                    <prop.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-4 text-foreground">
                    {prop.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {prop.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Steps Section */}
        <section className="py-16 lg:py-24 bg-background">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
              Comienza en 3 simples pasos
            </h2>
            
            <div className="max-w-4xl mx-auto">
              <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
                {steps.map((step, index) => (
                  <div key={index} className="text-center relative">
                    {/* Step connector line */}
                    {index < steps.length - 1 && (
                      <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-primary-light transform translate-x-1/2 z-0"></div>
                    )}
                    
                    <div className="relative z-10">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-button rounded-full mb-6 shadow-soft">
                        <span className="text-2xl font-bold text-primary-foreground">
                          {step.number}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold mb-4 text-foreground">
                        {step.title}
                      </h3>
                      <p className="text-muted-foreground leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 lg:py-24 bg-gradient-card">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              ¿Listo para comenzar a ganar?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete a nuestra comunidad de proveedores verificados y comienza 
              a generar ingresos extras hoy mismo
            </p>
            
            <Button 
              onClick={handleGetStarted}
              size="lg"
              className="bg-gradient-button hover:opacity-90 text-lg px-8 py-6 h-auto font-semibold shadow-floating hover:shadow-glow transition-all duration-300"
            >
              Comenzar ahora
            </Button>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ProviderLanding;