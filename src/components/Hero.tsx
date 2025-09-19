import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Search, Shield, Star, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-services.jpg";

const Hero = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`);
    } else {
      navigate('/search');
    }
  };

  return (
    <section className="relative min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground leading-tight">
              Servicios del hogar
              <span className="text-primary block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                confiables y seguros
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto">
              Conectamos profesionales verificados con personas que necesitan servicios del hogar. 
              Seguridad garantizada, calidad asegurada.
            </p>
          </div>

          {/* Search Bar */}
          <div className="bg-gradient-glass backdrop-blur-glass border border-white/30 rounded-3xl p-8 shadow-floating max-w-2xl mx-auto">
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  placeholder="¿Qué servicio necesitas? Ej: Limpieza, Reparaciones..."
                  className="pl-14 pr-4 py-4 text-lg bg-background/50 border-white/20 rounded-2xl focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground" />
                <Input
                  placeholder="¿Dónde? Ciudad, colonia..."
                  className="pl-14 pr-4 py-4 text-lg bg-background/50 border-white/20 rounded-2xl focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <ModernButton 
              variant="glow"
              size="xl" 
              className="w-full sm:w-auto min-w-[240px]"
              onClick={handleSearch}
            >
              <Search className="mr-3 h-6 w-6" />
              Contratar Servicios
            </ModernButton>
            <ModernButton 
              variant="glass" 
              size="xl"
              className="w-full sm:w-auto min-w-[240px]"
            >
              Ofrecer Servicios
            </ModernButton>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2 bg-gradient-glass rounded-full px-6 py-3 shadow-soft backdrop-blur-glass">
              <Shield className="h-5 w-5 text-primary" />
              <span>Profesionales verificados</span>
            </div>
            <div className="flex items-center space-x-2 bg-gradient-glass rounded-full px-6 py-3 shadow-soft backdrop-blur-glass">
              <Star className="h-5 w-5 text-primary" />
              <span>Calificaciones reales</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="bg-gradient-card rounded-2xl p-6 shadow-raised backdrop-blur-glass border border-white/20">
              <div className="text-3xl md:text-4xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground">Profesionales</div>
            </div>
            <div className="bg-gradient-card rounded-2xl p-6 shadow-raised backdrop-blur-glass border border-white/20">
              <div className="text-3xl md:text-4xl font-bold text-primary">10k+</div>
              <div className="text-sm text-muted-foreground">Servicios completados</div>
            </div>
            <div className="bg-gradient-card rounded-2xl p-6 shadow-raised backdrop-blur-glass border border-white/20">
              <div className="text-3xl md:text-4xl font-bold text-primary">4.9★</div>
              <div className="text-sm text-muted-foreground">Calificación promedio</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;