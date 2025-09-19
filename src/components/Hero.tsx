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
    <section className="relative min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight">
              Servicios del hogar
              <span className="text-primary block bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                confiables y seguros
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4">
              Conectamos a la gente que sabe solucionar con gente que necesita soluciones
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-500" />
            <Input
              placeholder="Arregla cualquier cosa con Chamby!"
              className="pl-8 sm:pl-10 pr-12 sm:pr-14 py-3 sm:py-4 text-base sm:text-lg bg-white/90 border-gray-300 rounded-2xl focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm placeholder:text-gray-500 text-gray-900 text-left"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
            <ModernButton 
              variant="glass"
              size="xl" 
              className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] bg-white/20 backdrop-blur-md border-white/30 hover:bg-white/30 text-gray-900 font-semibold shadow-[0_8px_32px_rgba(31,38,135,0.37)]"
              onClick={handleSearch}
            >
              <Search className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6 text-gray-900" />
              <span className="text-sm sm:text-base">Contratar Servicios</span>
            </ModernButton>
            <ModernButton 
              variant="glass" 
              size="xl"
              className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] bg-white/20 backdrop-blur-md border-white/30 hover:bg-white/30 text-gray-900 font-semibold shadow-[0_8px_32px_rgba(31,38,135,0.37)]"
            >
              <span className="text-sm sm:text-base">Ofrecer Servicios</span>
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