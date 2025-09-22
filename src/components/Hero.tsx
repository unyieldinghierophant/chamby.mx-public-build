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
      navigate(`/jobs?q=${encodeURIComponent(searchQuery)}&location=${encodeURIComponent(location)}`);
    } else {
      navigate('/jobs');
    }
  };
  return <section className="relative min-h-screen bg-background flex items-center justify-center pt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Main Heading */}
          <div className="space-y-6">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-foreground leading-tight">
              Servicios del hogar
              <span className="block text-primary mx-0 px-px py-[3px]">
                confiables y seguros
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4 font-medium">
              Conectamos a la gente que sabe solucionar con gente que necesita soluciones
            </p>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-xl mx-auto">
            <Input 
              placeholder="Arregla cualquier cosa con Chamby!" 
              className="pl-6 pr-12 py-4 text-lg bg-surface-1 border-border rounded-2xl focus:ring-primary/50 focus:border-primary/50 placeholder:text-muted-foreground text-foreground text-left w-full font-medium shadow-card hover-lift" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              onKeyPress={e => e.key === 'Enter' && handleSearch()} 
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 h-6 w-6 text-muted-foreground cursor-pointer hover:text-primary smooth-transition" onClick={handleSearch} />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 justify-center px-4">
            <ModernButton 
              variant="primary" 
              size="xl" 
              className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] bg-primary hover:bg-primary-dark text-primary-foreground font-bold shadow-card hover-lift smooth-transition" 
              onClick={handleSearch}
            >
              <Search className="mr-2 sm:mr-3 h-5 w-5 sm:h-6 sm:w-6" />
              <span className="text-sm sm:text-base">Contratar Servicios</span>
            </ModernButton>
            <ModernButton 
              variant="outline" 
              size="xl" 
              className="w-full sm:w-auto min-w-[200px] sm:min-w-[240px] bg-surface-1 hover:bg-surface-2 text-foreground font-bold border-2 border-border hover:border-primary/50 shadow-card hover-lift smooth-transition"
              onClick={() => navigate('/auth')}
            >
              <span className="text-sm sm:text-base">Ofrecer Servicios</span>
            </ModernButton>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2 bg-surface-1 border border-border rounded-full px-6 py-3 shadow-card hover-lift smooth-transition">
              <Shield className="h-5 w-5 text-primary" />
              <span className="font-semibold">Profesionales verificados</span>
            </div>
            <div className="flex items-center space-x-2 bg-surface-1 border border-border rounded-full px-6 py-3 shadow-card hover-lift smooth-transition">
              <Star className="h-5 w-5 text-primary" />
              <span className="font-semibold">Calificaciones reales</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-card hover-lift smooth-transition">
              <div className="text-3xl md:text-4xl font-extrabold text-primary">500+</div>
              <div className="text-sm text-muted-foreground font-medium">Profesionales</div>
            </div>
            <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-card hover-lift smooth-transition">
              <div className="text-3xl md:text-4xl font-extrabold text-primary">10k+</div>
              <div className="text-sm text-muted-foreground font-medium">Servicios completados</div>
            </div>
            <div className="bg-surface-1 border border-border rounded-2xl p-6 shadow-card hover-lift smooth-transition">
              <div className="text-3xl md:text-4xl font-extrabold text-primary">4.9★</div>
              <div className="text-sm text-muted-foreground font-medium">Calificación promedio</div>
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;