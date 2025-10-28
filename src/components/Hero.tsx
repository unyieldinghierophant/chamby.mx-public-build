import { ModernButton } from "@/components/ui/modern-button";
import { Search, Shield, Star, MapPin, Home, Wrench, Droplets, Truck, SprayCan, Hammer, Zap, Car } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-services.jpg";
import { AISearchBar } from "@/components/AISearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryCard } from "@/components/CategoryCard";
import categoryHandyman from "@/assets/category-handyman.png";
import categoryElectrician from "@/assets/category-electrician.png";
import categoryPlumbing from "@/assets/category-plumbing.png";
import categoryAuto from "@/assets/category-auto.png";
const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  return <section className="relative min-h-screen bg-background flex items-center justify-center pt-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 md:py-16 relative z-10 py-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Floating Blue Card Container */}
          <div className="relative bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-[2rem] md:rounded-[3rem] p-8 md:p-12 lg:p-16 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] border border-white/10 overflow-hidden">
            {/* Shiny Stars Background */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-[10%] left-[15%] text-2xl animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: '0s' }}>⭐</div>
              <div className="absolute top-[20%] right-[20%] text-xl animate-[pulse_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s' }}>✨</div>
              <div className="absolute bottom-[15%] left-[10%] text-lg animate-[pulse_3s_ease-in-out_infinite]" style={{ animationDelay: '1s' }}>⭐</div>
              <div className="absolute top-[60%] right-[15%] text-2xl animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }}>✨</div>
              <div className="absolute bottom-[25%] right-[25%] text-xl animate-[pulse_2.5s_ease-in-out_infinite]" style={{ animationDelay: '2s' }}>⭐</div>
              <div className="absolute top-[40%] left-[20%] text-lg animate-[pulse_3s_ease-in-out_infinite]" style={{ animationDelay: '2.5s' }}>✨</div>
            </div>
            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="font-dillan text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-tight pb-2">
                Servicios del hogar
                <span className="block text-white py-2 pb-4">
                  confiables y seguros
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed max-w-3xl mx-auto px-4 pt-0 font-normal text-white/90">Soluciona en minutos no en dias</p>
            </div>

            {/* AI Search Bar */}
            <div className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-4 sm:px-0 mt-8">
              <AISearchBar className="w-full" />
              
              {/* Gana dinero CTA */}
              <div className="mt-4">
                <Link to="/tasker-landing">
                  <ModernButton variant="outline" className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20">
                    💰 Gana dinero como Chambynauta
                  </ModernButton>
                </Link>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="max-w-6xl mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <CategoryCard
                image={categoryHandyman}
                category="Handyman"
                description="Reparaciones generales"
                services={["Reparaciones menores", "Instalaciones", "Mantenimiento"]}
              />
              <CategoryCard
                image={categoryElectrician}
                category="Electricidad"
                description="Servicios eléctricos"
                services={["Instalaciones eléctricas", "Reparaciones", "Mantenimiento"]}
              />
              <CategoryCard
                image={categoryPlumbing}
                category="Plomería"
                description="Servicios de plomería"
                services={["Reparaciones", "Instalaciones", "Destapes"]}
              />
              <CategoryCard
                image={categoryAuto}
                category="Auto y lavado"
                description="Servicios automotrices"
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