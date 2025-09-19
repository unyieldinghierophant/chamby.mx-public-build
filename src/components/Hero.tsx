import { ModernButton } from "@/components/ui/modern-button";
import { Search, Shield, Star } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-services.jpg";

const Hero = () => {
  return (
    <section className="relative min-h-screen bg-gradient-main bg-gradient-mesh">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-120px)]">
          {/* Hero Content */}
          <div className="space-y-8">
            <div className="space-y-4 text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Servicios del hogar
                <span className="text-primary block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                  confiables y seguros
                </span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0">
                Conectamos profesionales verificados con personas que necesitan servicios del hogar. 
                Seguridad garantizada, calidad asegurada.
              </p>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center justify-center lg:justify-start space-x-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 bg-gradient-glass rounded-full px-4 py-2 shadow-soft backdrop-blur-glass">
                <Shield className="h-5 w-5 text-primary" />
                <span>Profesionales verificados</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-glass rounded-full px-4 py-2 shadow-soft backdrop-blur-glass">
                <Star className="h-5 w-5 text-primary" />
                <span>Calificaciones reales</span>
              </div>
            </div>

            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/search">
                <ModernButton 
                  variant="glow"
                  size="xl" 
                  className="w-full sm:w-auto"
                >
                  <Search className="mr-3 h-6 w-6" />
                  Contratar Servicios
                </ModernButton>
              </Link>
              <ModernButton 
                variant="glass" 
                size="xl"
                className="w-full sm:w-auto"
              >
                Ofrecer Servicios
              </ModernButton>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="bg-gradient-card rounded-xl p-4 shadow-raised backdrop-blur-glass">
                <div className="text-2xl md:text-3xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Profesionales</div>
              </div>
              <div className="bg-gradient-card rounded-xl p-4 shadow-raised backdrop-blur-glass">
                <div className="text-2xl md:text-3xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Servicios completados</div>
              </div>
              <div className="bg-gradient-card rounded-xl p-4 shadow-raised backdrop-blur-glass">
                <div className="text-2xl md:text-3xl font-bold text-primary">4.9★</div>
                <div className="text-sm text-muted-foreground">Calificación promedio</div>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="rounded-3xl overflow-hidden shadow-floating border border-white/20 backdrop-blur-glass">
              <img 
                src={heroImage} 
                alt="Profesionales de servicios del hogar confiables y verificados"
                className="w-full h-full object-cover"
              />
            </div>
            
            {/* Floating Cards */}
            <div className="absolute -top-4 -left-4 bg-gradient-glass backdrop-blur-glass border border-white/20 rounded-2xl p-6 shadow-floating">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-button rounded-2xl flex items-center justify-center shadow-glow">
                  <Shield className="h-7 w-7 text-primary-foreground" />
                </div>
                <div>
                  <div className="font-bold text-foreground">Verificación completa</div>
                  <div className="text-sm text-muted-foreground">Identidad y antecedentes</div>
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