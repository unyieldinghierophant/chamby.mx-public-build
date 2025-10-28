import { ModernButton } from "@/components/ui/modern-button";
import { Search, Shield, Star, MapPin, Home, Wrench, Droplets, Truck, SprayCan, Hammer, Zap, Car } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-services.jpg";
import { AISearchBar } from "@/components/AISearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryCard } from "@/components/CategoryCard";
const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  return <section className="relative min-h-screen bg-background flex items-center justify-center pt-16 overflow-hidden">
      {/* 3D Glass Morphic Background Icons */}
      <div className="absolute inset-0 pointer-events-none">
        {/* House Icon - Top Left */}
        <div className="absolute top-20 left-2 sm:top-32 sm:left-16 transform">
          <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-xl rounded-2xl shadow-raised border border-white/30 flex items-center justify-center transform rotate-12 hover:rotate-6 transition-transform duration-300">
            <Home size={24} className="sm:w-8 sm:h-8 text-muted-foreground/60" />
          </div>
        </div>
        
        {/* Wrench Icon - Top Right */}
        <div className="absolute top-20 right-2 sm:top-40 sm:right-20 transform">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-xl rounded-xl shadow-raised border border-white/30 flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-300">
            <Wrench size={20} className="sm:w-6 sm:h-6 text-muted-foreground/60" />
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

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 md:py-16 relative z-10 py-[50px]">
        <div className="max-w-4xl mx-auto text-center space-y-12">
          {/* Main Heading */}
          <div className="space-y-4 -mt-12">
            <h1 className="font-dillan text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight pb-2">
              Servicios del hogar
              <span className="block bg-gradient-button bg-clip-text text-transparent py-2 pb-4">
                confiables y seguros
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed max-w-3xl mx-auto px-4 pt-2 font-normal text-zinc-600">Soluciona en minutos no en dias</p>
          </div>

          {/* AI Search Bar */}
          <div className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-0">
            <AISearchBar className="w-full" />
            
            {/* Mobile-only Tasker CTA */}
            <div className="md:hidden mt-4">
              <Link to="/tasker-landing">
                <ModernButton variant="outline" className="w-full">
                  Ofrecer servicios
                </ModernButton>
              </Link>
            </div>
          </div>

          {/* Categories Section */}
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <CategoryCard
                icon={Hammer}
                category="Handyman"
                description="Reparaciones generales"
                gradient="from-emerald-400 via-teal-500 to-green-600"
                services={["Reparaciones menores", "Instalaciones", "Mantenimiento"]}
              />
              <CategoryCard
                icon={Zap}
                category="Electricidad"
                description="Servicios eléctricos"
                gradient="from-yellow-400 via-orange-500 to-amber-600"
                services={["Instalaciones eléctricas", "Reparaciones", "Mantenimiento"]}
              />
              <CategoryCard
                icon={Droplets}
                category="Plomería"
                description="Servicios de plomería"
                gradient="from-blue-400 via-cyan-500 to-blue-600"
                services={["Reparaciones", "Instalaciones", "Destapes"]}
              />
              <CategoryCard
                icon={Car}
                category="Auto y lavado"
                description="Servicios automotrices"
                gradient="from-purple-400 via-purple-500 to-purple-600"
                services={["Lavado de autos", "Detallado", "Mantenimiento básico"]}
              />
            </div>
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
    </section>;
};
export default Hero;