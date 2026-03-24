import { Card, CardContent } from "@/components/ui/card";
import { ModernButton } from "@/components/ui/modern-button";
import { MagnifyingGlass, CalendarCheck, Receipt, Wrench, CheckCircle } from "@phosphor-icons/react";
import { ForwardRefExoticComponent, RefAttributes } from "react";
import { IconProps } from "@phosphor-icons/react";
import { useNavigate } from "react-router-dom";

type PhosphorIcon = ForwardRefExoticComponent<IconProps & RefAttributes<SVGSVGElement>>;

const HowItWorks = () => {
  const navigate = useNavigate();
  const steps = [
    {
      icon: MagnifyingGlass,
      step: "1",
      title: "Busca tu servicio",
      description: "Explora nuestro catálogo de servicios y elige el que necesitas para tu hogar",
      color: "bg-blue-50/30 text-blue-600"
    },
    {
      icon: CalendarCheck,
      step: "2",
      title: "Agenda tu visita",
      description: "Elige fecha, sube fotos y agenda una visita de diagnóstico con un profesional",
      color: "bg-purple-50 text-purple-600"
    },
    {
      icon: Receipt,
      step: "3",
      title: "Recibe tu cotización",
      description: "El profesional evalúa el trabajo y te envía una cotización detallada",
      color: "bg-orange-50 text-orange-600"
    },
    {
      icon: Wrench,
      step: "4",
      title: "Se realiza el trabajo",
      description: "Una vez aprobada la cotización, el profesional completa el servicio",
      color: "bg-amber-50 text-amber-600"
    },
    {
      icon: CheckCircle,
      step: "5",
      title: "Paga y listo",
      description: "Paga de forma segura por la plataforma y califica al profesional",
      color: "bg-green-50 text-green-600"
    }
  ];

  return (
    <section id="how-it-works-section" className="py-20 bg-gradient-main bg-gradient-mesh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
            ¿Cómo funciona Chamby.mx?
          </h2>
          <p className="text-lg text-muted-foreground">
            Busca, agenda, recibe cotización, y paga — todo desde la plataforma.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
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
                    <step.icon size={40} weight="duotone" />
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
                onClick={() => navigate('/user-landing')}
              >
                Comenzar ahora
              </ModernButton>
              <ModernButton 
                variant="outline" 
                size="xl"
                onClick={() => navigate('/provider-landing')}
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