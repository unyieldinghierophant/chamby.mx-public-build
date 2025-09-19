import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Wrench, Sparkles, TreePine, Palette, Zap, Car } from "lucide-react";
import cleaningImage from "@/assets/service-cleaning.jpg";
import repairImage from "@/assets/service-repair.jpg";
import gardenImage from "@/assets/service-garden.jpg";

const Services = () => {
  const popularServices = [
    {
      icon: Sparkles,
      title: "Limpieza del Hogar",
      description: "Limpieza profunda, mantenimiento regular y servicios especializados",
      image: cleaningImage,
      price: "Desde $300/hora",
      rating: 4.8,
      providers: 120
    },
    {
      icon: Wrench,
      title: "Reparaciones",
      description: "Plomería, electricidad, carpintería y reparaciones menores",
      image: repairImage,
      price: "Desde $400/hora", 
      rating: 4.9,
      providers: 85
    },
    {
      icon: TreePine,
      title: "Jardinería",
      description: "Mantenimiento de jardín, poda, diseño paisajístico",
      image: gardenImage,
      price: "Desde $350/hora",
      rating: 4.7,
      providers: 65
    }
  ];

  const allServices = [
    { icon: Palette, title: "Pintura", count: "45 profesionales" },
    { icon: Zap, title: "Instalaciones", count: "38 profesionales" },
    { icon: Car, title: "Limpieza de autos", count: "29 profesionales" },
  ];

  return (
    <section id="servicios" className="py-20 bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Servicios más populares
          </h2>
          <p className="text-lg text-muted-foreground">
            Encuentra profesionales verificados para cualquier tarea del hogar. 
            Calidad garantizada y precios transparentes.
          </p>
        </div>

        {/* Popular Services Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {popularServices.map((service, index) => (
            <Card 
              key={index} 
              className="group hover:shadow-elevated transition-all duration-300 border-border bg-gradient-card overflow-hidden"
            >
              <div className="relative h-48 overflow-hidden">
                <img 
                  src={service.image} 
                  alt={service.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 text-white">
                  <div className="flex items-center space-x-2 text-sm">
                    <span>⭐ {service.rating}</span>
                    <span>•</span>
                    <span>{service.providers} profesionales</span>
                  </div>
                </div>
              </div>
              
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                      <service.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground">{service.title}</h3>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-primary">{service.price}</div>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <p className="text-muted-foreground mb-4">{service.description}</p>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group">
                  Ver profesionales
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Other Services */}
        <div className="text-center">
          <h3 className="text-2xl font-bold text-foreground mb-8">Otros servicios disponibles</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
            {allServices.map((service, index) => (
              <div 
                key={index}
                className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <service.icon className="h-5 w-5 text-primary" />
                <div className="text-left">
                  <div className="font-medium text-foreground">{service.title}</div>
                  <div className="text-sm text-muted-foreground">{service.count}</div>
                </div>
              </div>
            ))}
          </div>
          
          <Button 
            variant="outline" 
            size="lg"
            className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            Ver todos los servicios
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Services;
