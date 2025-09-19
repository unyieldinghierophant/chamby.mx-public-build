import { Card, CardContent } from "@/components/ui/card";
import { Search, UserCheck, Calendar, CheckCircle } from "lucide-react";

const HowItWorks = () => {
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
    <section id="como-funciona" className="py-20 bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
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
              className="relative bg-card border-border shadow-card hover:shadow-elevated transition-all duration-300 group"
            >
              <CardContent className="p-6 text-center">
                {/* Step Number */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-sm shadow-subtle">
                    {step.step}
                  </div>
                </div>

                {/* Icon */}
                <div className="mt-4 mb-6">
                  <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${step.color} group-hover:scale-110 transition-transform duration-300`}>
                    <step.icon className="h-8 w-8" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold text-foreground mb-3">
                  {step.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </CardContent>

              {/* Connection Line (except for last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border transform -translate-y-1/2 z-10">
                  <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-border rotate-45"></div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-16">
          <div className="bg-card rounded-2xl p-8 border border-border shadow-card max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              ¿Listo para empezar?
            </h3>
            <p className="text-muted-foreground mb-6">
              Miles de profesionales están esperando para ayudarte con tus proyectos del hogar.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-gradient-hero text-primary-foreground px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity shadow-subtle">
                Comenzar ahora
              </button>
              <button className="border-2 border-primary text-primary px-8 py-3 rounded-lg font-semibold hover:bg-primary hover:text-primary-foreground transition-colors">
                Ser profesional
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;