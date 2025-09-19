import { Card, CardContent } from "@/components/ui/card";
import { Shield, FileCheck, Star, MessageSquare, CreditCard, Clock } from "lucide-react";

const Trust = () => {
  const trustFeatures = [
    {
      icon: Shield,
      title: "Verificación completa",
      description: "Verificamos identidad, antecedentes penales y referencias laborales",
      stats: "100% verificados"
    },
    {
      icon: FileCheck,
      title: "Seguros incluidos",
      description: "Todos los servicios están cubiertos por seguros de responsabilidad civil",
      stats: "Cobertura total"
    },
    {
      icon: Star,
      title: "Sistema de calificaciones",
      description: "Calificaciones reales de clientes para ayudarte a elegir el mejor",
      stats: "4.9★ promedio"
    },
    {
      icon: MessageSquare,
      title: "Soporte 24/7",
      description: "Nuestro equipo está disponible para resolver cualquier problema",
      stats: "Respuesta inmediata"
    },
    {
      icon: CreditCard,
      title: "Pagos seguros",
      description: "Procesamos pagos de forma segura. El profesional cobra hasta que termines",
      stats: "Pago protegido"
    },
    {
      icon: Clock,
      title: "Garantía de servicio",
      description: "Si no quedas satisfecho, regresamos a corregir el trabajo sin costo",
      stats: "30 días garantía"
    }
  ];

  return (
    <section id="seguridad" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Tu seguridad es nuestra prioridad
          </h2>
          <p className="text-lg text-muted-foreground">
            Hemos implementado múltiples medidas de seguridad para que tengas tranquilidad 
            completa al contratar servicios a través de Chamby.mx.
          </p>
        </div>

        {/* Trust Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {trustFeatures.map((feature, index) => (
            <Card 
              key={index}
              className="group bg-gradient-card border-border hover:shadow-elevated transition-all duration-300 hover:border-primary/20"
            >
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <feature.icon className="h-6 w-6 text-primary" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground mb-3 leading-relaxed">
                      {feature.description}
                    </p>
                    <div className="inline-flex items-center px-3 py-1 bg-accent rounded-full">
                      <span className="text-sm font-medium text-accent-foreground">
                        {feature.stats}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-gradient-hero rounded-2xl p-8 md:p-12 text-center shadow-elevated">
          <h3 className="text-2xl md:text-3xl font-bold text-primary-foreground mb-8">
            Números que nos respaldan
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                99.8%
              </div>
              <div className="text-primary-foreground/80">
                Satisfacción del cliente
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                0
              </div>
              <div className="text-primary-foreground/80">
                Incidentes de seguridad
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                24hrs
              </div>
              <div className="text-primary-foreground/80">
                Tiempo respuesta máximo
              </div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-primary-foreground mb-2">
                500+
              </div>
              <div className="text-primary-foreground/80">
                Profesionales activos
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Trust;