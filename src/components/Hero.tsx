import { ModernButton } from "@/components/ui/modern-button";
import { Search, Shield, Star, MapPin, Home, Wrench, Droplets, Truck, SprayCan } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-services.jpg";
import EnhancedSearchBar from "@/components/EnhancedSearchBar";
import { useAuth } from "@/contexts/AuthContext";

const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(query)}&location=${encodeURIComponent(location)}`);
    } else {
      navigate('/jobs');
    }
  };

  const handleResultClick = (result: any) => {
    navigate(`/search?category=${encodeURIComponent(result.category)}&service=${encodeURIComponent(result.name)}`);
  };
  
  return (
    <section className="relative min-h-screen bg-background flex items-center justify-center pt-20 overflow-hidden">
      {/* 3D Glass Morphic Background Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* House Icon - Top Left */}
        <div className="absolute top-32 left-16 transform">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl shadow-raised border border-white/30 flex items-center justify-center transform rotate-12 hover:rotate-6 transition-transform duration-300">
            <Home size={32} className="text-muted-foreground/60" />
          </div>
        </div>
        
        {/* Wrench Icon - Top Right */}
        <div className="absolute top-40 right-20 transform">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-xl shadow-raised border border-white/30 flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-300">
            <Wrench size={24} className="text-muted-foreground/60" />
          </div>
        </div>
        
        {/* Droplets Icon - Left Side */}
        <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl shadow-raised border border-white/30 flex items-center justify-center transform rotate-45 hover:rotate-12 transition-transform duration-300">
            <Droplets size={28} className="text-muted-foreground/60" />
          </div>
        </div>
        
        {/* Truck Icon - Right Side */}
        <div className="absolute top-1/2 right-12 transform -translate-y-1/2">
          <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-2xl shadow-raised border border-white/30 flex items-center justify-center transform -rotate-6 hover:rotate-6 transition-transform duration-300">
            <Truck size={32} className="text-muted-foreground/60" />
          </div>
        </div>
        
        {/* SprayCan Icon - Bottom Left */}
        <div className="absolute bottom-32 left-24 transform">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-xl shadow-raised border border-white/30 flex items-center justify-center transform rotate-20 hover:rotate-0 transition-transform duration-300">
            <SprayCan size={24} className="text-muted-foreground/60" />
          </div>
        </div>
        
        {/* Additional Icon - Bottom Right */}
        <div className="absolute bottom-28 right-16 transform">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl shadow-raised border border-white/30 flex items-center justify-center transform -rotate-15 hover:rotate-3 transition-transform duration-300">
            <Shield size={28} className="text-muted-foreground/60" />
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20 relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Main Heading */}
          <div className="space-y-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight pb-2" style={{
              textShadow: '0 1px 0 hsl(0 0% 100% / 0.8), 0 2px 3px hsl(0 0% 0% / 0.15), 0 4px 8px hsl(0 0% 0% / 0.1)',
            }}>
              Servicios del hogar
              <span className="block bg-gradient-button bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(55,113,200,0.3)]" style={{
                textShadow: '0 1px 0 hsl(214 61% 49% / 0.3), 0 2px 3px hsl(0 0% 0% / 0.15), 0 4px 8px hsl(0 0% 0% / 0.1)',
              }}>
                confiables y seguros
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4 pt-2">
              Conectamos a la gente que sabe solucionar con gente que necesita soluciones
            </p>
          </div>

          {/* Enhanced Search Bar */}
          <div className="max-w-xl mx-auto">
            <EnhancedSearchBar
              placeholder="¿Qué servicio necesitas hoy?"
              onSearch={handleSearch}
              onResultClick={handleResultClick}
              size="lg"
              className="w-full"
            />
          </div>

          {/* Action Buttons - Only show for non-logged in users */}
          {!user && (
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
              <ModernButton 
                variant="primary" 
                size="xl" 
                className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] bg-gradient-animated bg-[length:400%_400%] animate-gradient-shift hover:animate-none text-foreground" 
                onClick={() => handleSearch('')}
              >
                <Search className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
                <span className="text-sm sm:text-base">Explorar Servicios</span>
              </ModernButton>
              <ModernButton 
                variant="accent" 
                size="xl" 
                className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px]"
                onClick={() => navigate('/auth/tasker')}
              >
                <span className="text-sm sm:text-base">Ofrecer Servicios</span>
              </ModernButton>
            </div>
          )}

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