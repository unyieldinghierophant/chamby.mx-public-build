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
import ufoChamby from "@/assets/ufo-chamby-final.png";
import moneyBagIcon from "@/assets/money-bag-icon.png";
const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  return <section className="relative min-h-screen bg-background flex items-start justify-center pt-4 md:pt-6 overflow-hidden">
      <div className="w-[96%] md:w-[98%] mx-auto relative z-10 mt-0">
        <div className="text-center space-y-6">
          {/* Floating Blue Card Container */}
          <div className="relative bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 lg:p-10 xl:p-12 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] border border-white/10">
            {/* UFO Absolute Positioned */}
            <div className="hidden md:block absolute top-[15%] right-[5%] lg:right-[8%] w-32 md:w-40 lg:w-48 xl:w-56 z-30 pointer-events-none">
              <img 
                src={ufoChamby} 
                alt="Chamby UFO" 
                className="w-full h-auto animate-[float_3s_ease-in-out_infinite]"
                style={{
                  filter: 'drop-shadow(0 10px 30px rgba(30, 58, 138, 0.4))'
                }}
              />
            </div>
            {/* Shiny Stars Background - SVG Stars */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Large stars */}
              <svg className="absolute top-[8%] left-[12%] w-6 h-6 text-white animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: '0s', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute top-[15%] right-[18%] w-5 h-5 text-white animate-[pulse_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute bottom-[12%] left-[8%] w-4 h-4 text-white animate-[pulse_3s_ease-in-out_infinite]" style={{ animationDelay: '1s', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.7))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute top-[55%] right-[12%] w-6 h-6 text-white animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: '1.5s', filter: 'drop-shadow(0 0 7px rgba(255,255,255,0.85))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute bottom-[22%] right-[22%] w-5 h-5 text-white animate-[pulse_2.5s_ease-in-out_infinite]" style={{ animationDelay: '2s', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute top-[38%] left-[16%] w-4 h-4 text-white animate-[pulse_3s_ease-in-out_infinite]" style={{ animationDelay: '2.5s', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.75))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {/* Small sparkle stars */}
              <svg className="absolute top-[25%] left-[25%] w-3 h-3 text-white/80 animate-[pulse_2.2s_ease-in-out_infinite]" style={{ animationDelay: '0.3s', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.6))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute bottom-[35%] right-[8%] w-3 h-3 text-white/80 animate-[pulse_2.8s_ease-in-out_infinite]" style={{ animationDelay: '1.2s', filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.6))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            {/* Main Content - Single Column Layout */}
            <div className="relative z-10">
              {/* Text Content */}
              <div className="space-y-4 md:space-y-6">
                <h1 className="font-hero text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black text-white leading-[0.9] uppercase tracking-tight px-2"
                  style={{
                    transform: 'perspective(800px) rotateX(-8deg) rotateZ(5deg)',
                    transformStyle: 'preserve-3d',
                    wordSpacing: '0.3em',
                  }}>
                <span className="inline-block" style={{ transform: 'scale(0.82) translateY(12px) rotateZ(-8deg)' }}>S</span>
                <span className="inline-block" style={{ transform: 'scale(0.88) translateY(8px) rotateZ(-5deg)' }}>E</span>
                <span className="inline-block" style={{ transform: 'scale(0.93) translateY(5px) rotateZ(-3deg)' }}>R</span>
                <span className="inline-block" style={{ transform: 'scale(0.98) translateY(2px) rotateZ(-1deg)' }}>V</span>
                <span className="inline-block" style={{ transform: 'scale(1.03) translateY(-1px) rotateZ(1deg)' }}>I</span>
                <span className="inline-block" style={{ transform: 'scale(1.06) translateY(-3px) rotateZ(2deg)' }}>C</span>
                <span className="inline-block" style={{ transform: 'scale(1.03) translateY(-1px) rotateZ(1deg)' }}>I</span>
                <span className="inline-block" style={{ transform: 'scale(0.98) translateY(2px) rotateZ(-1deg)' }}>O</span>
                <span className="inline-block" style={{ transform: 'scale(0.93) translateY(5px) rotateZ(-3deg)' }}>S</span>
                {' '}
                <span className="inline-block" style={{ transform: 'scale(0.88) translateY(8px) rotateZ(-5deg)' }}>D</span>
                <span className="inline-block" style={{ transform: 'scale(0.82) translateY(12px) rotateZ(-8deg)' }}>E</span>
                <span className="inline-block" style={{ transform: 'scale(0.88) translateY(8px) rotateZ(-5deg)' }}>L</span>
                <span className="block mt-1 sm:mt-2 text-white">
                  <span className="inline-block" style={{ transform: 'scale(0.82) translateY(12px) rotateZ(-8deg)' }}>H</span>
                  <span className="inline-block" style={{ transform: 'scale(0.88) translateY(8px) rotateZ(-5deg)' }}>O</span>
                  <span className="inline-block" style={{ transform: 'scale(0.93) translateY(5px) rotateZ(-3deg)' }}>G</span>
                  <span className="inline-block" style={{ transform: 'scale(0.98) translateY(2px) rotateZ(-1deg)' }}>A</span>
                  <span className="inline-block" style={{ transform: 'scale(1.03) translateY(-1px) rotateZ(1deg)' }}>R</span>
                  {' '}
                  <span className="inline-block" style={{ transform: 'scale(1.06) translateY(-3px) rotateZ(2deg)' }}>F</span>
                  <span className="inline-block" style={{ transform: 'scale(1.03) translateY(-1px) rotateZ(1deg)' }}>U</span>
                  <span className="inline-block" style={{ transform: 'scale(0.98) translateY(2px) rotateZ(-1deg)' }}>E</span>
                  <span className="inline-block" style={{ transform: 'scale(0.93) translateY(5px) rotateZ(-3deg)' }}>R</span>
                  <span className="inline-block" style={{ transform: 'scale(0.9) translateY(6px) rotateZ(-4deg)' }}>A</span>
                </span>
                <span className="block text-white mt-1 sm:mt-2">
                  <span className="inline-block" style={{ transform: 'scale(0.87) translateY(9px) rotateZ(-6deg)' }}>D</span>
                  <span className="inline-block" style={{ transform: 'scale(0.84) translateY(11px) rotateZ(-7deg)' }}>E</span>
                  {' '}
                  <span className="inline-block" style={{ transform: 'scale(0.82) translateY(12px) rotateZ(-8deg)' }}>E</span>
                  <span className="inline-block" style={{ transform: 'scale(0.80) translateY(14px) rotateZ(-9deg)' }}>S</span>
                  <span className="inline-block" style={{ transform: 'scale(0.78) translateY(15px) rotateZ(-10deg)' }}>T</span>
                  <span className="inline-block" style={{ transform: 'scale(0.76) translateY(17px) rotateZ(-11deg)' }}>E</span>
                  {' '}
                  <span className="inline-block" style={{ transform: 'scale(0.82) translateY(12px) rotateZ(-8deg)' }}>M</span>
                  <span className="inline-block" style={{ transform: 'scale(0.88) translateY(8px) rotateZ(-5deg)' }}>U</span>
                  <span className="inline-block" style={{ transform: 'scale(0.93) translateY(5px) rotateZ(-3deg)' }}>N</span>
                  <span className="inline-block" style={{ transform: 'scale(0.98) translateY(2px) rotateZ(-1deg)' }}>D</span>
                  <span className="inline-block" style={{ transform: 'scale(1.03) translateY(-1px) rotateZ(1deg)' }}>O</span>
                  <span className="inline-block" style={{ transform: 'scale(1.06) translateY(-3px) rotateZ(2deg)' }}>.</span>
                </span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed max-w-3xl mx-auto px-4 pt-2 font-medium text-white">Soluciona en minutos no en dias</p>
              
                {/* AI Search Bar */}
                <div className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-2 sm:px-4 mt-6 md:mt-8">
                  <AISearchBar className="w-full" />
                  
                  {/* Gana dinero CTA */}
                  <div className="mt-4">
                    <Link to="/tasker-landing">
                      <ModernButton variant="outline" className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center justify-center gap-2">
                        <img src={moneyBagIcon} alt="Money bag" className="w-10 h-10" />
                        Gana dinero como Chambynauta
                      </ModernButton>
                    </Link>
                  </div>
                </div>
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