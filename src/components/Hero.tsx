import { Button } from "@/components/ui/button";
import { Search, Shield, Star } from "lucide-react";
import heroImage from "@/assets/hero-services.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-subtle">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-120px)]">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Servicios del hogar
                <span className="text-primary block">confiables y seguros</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl">
                Conectamos profesionales verificados con personas que necesitan servicios del hogar. 
                Seguridad garantizada, calidad asegurada.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-primary" />
                <span>Profesionales verificados</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-primary" />
                <span>Calificaciones reales</span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="bg-gradient-hero text-primary-foreground hover:opacity-90 shadow-card text-lg px-8 py-6"
              >
                <Search className="mr-2 h-5 w-5" />
                Contratar Servicios
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground text-lg px-8 py-6"
              >
                Ofrecer Servicios
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Profesionales</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Servicios completados</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-primary">4.9★</div>
                <div className="text-sm text-muted-foreground">Calificación promedio</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="rounded-2xl overflow-hidden shadow-elevated">
              <img 
                src={heroImage} 
                alt="Profesionales de servicios del hogar confiables y verificados"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-card border border-border rounded-xl p-4 shadow-card">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-sm text-foreground">Verificación completa</div>
                  <div className="text-xs text-muted-foreground">Identidad y antecedentes</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;