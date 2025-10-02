import { Card, CardContent } from "@/components/ui/card";
import { ModernButton } from "@/components/ui/modern-button";
import { Search, UserCheck, Calendar, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const HowItWorks = () => {
  const navigate = useNavigate();
  const steps = [
    {
      icon: Search,
      step: "1",
      title: "Busca el servicio",
      description: "Describe lo que necesitas y encuentra profesionales cercanos a ti",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: UserCheck,
      step: "2", 
      title: "Elige tu profesional",
      description: "Revisa perfiles, calificaciones y precios. Todos están verificados",
      color: "bg-primary-light text-primary"
    },
    {
      icon: Calendar,
      step: "3",
      title: "Agenda la cita",
      description: "Coordina fecha y hora que te convengan con el profesional",
      color: "bg-orange-50 text-orange-600"
    },
    {
      icon: CheckCircle,
      step: "4",
      title: "Recibe tu servicio",
      description: "El profesional llega puntual y realiza el trabajo con calidad",
      color: "bg-green-50 text-green-600"
    }
  ];

  return (
    <section id="como-funciona" className="py-20 bg-gradient-main bg-gradient-mesh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            ¿Cómo funciona Chamby.mx?
          </h2>
          <p className="text-lg text-muted-foreground">
            Contratar servicios nunca fue tan fácil y seguro. Sigue estos simples pasos 
            y resuelve tus necesidades del hogar.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index}
              className="relative bg-gradient-card border-0 shadow-raised hover:shadow-floating transition-all duration-300 group backdrop-blur-glass"
            >
              <CardContent className="p-6 text-center">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-10 h-10 bg-gradient-button text-primary-foreground rounded-full flex items-center justify-center font-bold shadow-glow">
                    {step.step}
                  </div>
                </div>

                {/* Icon */}
                <div className="mt-6 mb-6">
                  <div className={`w-20 h-20 mx-auto rounded-2xl flex items-center justify-center ${step.color} group-hover:scale-110 transition-transform duration-300 shadow-soft backdrop-blur-glass`}>
                    <step.icon className="h-10 w-10" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>

              {/* Connection Line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-gradient-button transform -translate-y-1/2 z-10 opacity-40">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-gradient-button rounded-full opacity-60"></div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-gradient-card rounded-3xl p-8 md:p-12 border border-white/20 shadow-floating max-w-4xl mx-auto backdrop-blur-glass">
            <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-6">
              ¿Listo para empezar?
            </h3>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
              Miles de profesionales están esperando para ayudarte con tus proyectos del hogar.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <ModernButton 
                variant="accent" 
                size="xl"
                onClick={() => navigate('/search')}
              >
                Comenzar ahora
              </ModernButton>
              <ModernButton 
                variant="outline" 
                size="xl"
                onClick={() => navigate('/tasker-landing')}
              >
                Ser profesional
              </ModernButton>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;