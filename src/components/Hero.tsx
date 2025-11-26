import { ModernButton } from "@/components/ui/modern-button";
import { Search, Shield, Star, MapPin, Home, Wrench, Droplets, Truck, SprayCan, Hammer, Zap, Car } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import heroImage from "@/assets/hero-services.jpg";
import { AISearchBar } from "@/components/AISearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SavedJobBanner } from "@/components/SavedJobBanner";
import chatbotAstronaut from "@/assets/chatbot-astronaut.png";
import moneyBagIcon from "@/assets/money-bag-icon.png";
import medchargeLogo from "@/assets/medcharge-logo.webp";
import medchargeIcon from "@/assets/medcharge-icon.png";
const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  return <section className="relative bg-background pb-8 overflow-hidden">
      {/* Saved Job Banner */}
      <SavedJobBanner />
      
      <div className="w-full mx-auto relative z-10">
        <div className="space-y-4 md:space-y-6">
          {/* Hero Card Container */}
          <div className="relative bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-none md:rounded-[2rem] p-6 md:p-10 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] mx-0 md:mx-4">
            {/* Main Content */}
            <div className="relative z-10 space-y-6 max-w-4xl mx-auto">
              {/* Simple Headline */}
              <div className="space-y-3 text-center">
                <h1 className="font-hero text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight uppercase">
                  Servicios del Hogar Fuera de Este Mundo.
                </h1>
                <p className="text-base sm:text-lg md:text-xl text-white/90 font-medium">
                  Soluciona en minutos no en días
                </p>
              </div>
              
              {/* Search Bar */}
              <div className="max-w-2xl mx-auto">
                <AISearchBar className="w-full" />
              </div>
              
              {/* Provider CTA */}
              <div className="max-w-md mx-auto">
                <Link to="/provider-landing">
                  <ModernButton variant="outline" className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center justify-center gap-2 py-3">
                    <img src={moneyBagIcon} alt="Money bag" className="w-8 h-8" />
                    <span className="text-sm sm:text-base">Gana dinero como Chambynauta</span>
                  </ModernButton>
                </Link>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <div className="px-4">
            <CategoryTabs />
          </div>

          {/* Medcharge Button */}
          <div className="px-4 max-w-6xl mx-auto">
            <a href="https://medcharge.mx/landing/" target="_blank" rel="noopener noreferrer" className="block">
              <ModernButton variant="glass" className="w-full flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 px-4 sm:px-6 py-4 sm:py-5 h-auto shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_40px_rgba(34,197,94,0.6)] transition-shadow duration-300">
                <img src={medchargeIcon} alt="Charging Icon" className="h-10 sm:h-12 w-auto" />
                <img src={medchargeLogo} alt="Medcharge" className="h-10 sm:h-12 w-auto" />
                <span className="text-sm sm:text-base md:text-lg font-semibold text-center">Instalación de Cargadores Eléctricos y Paneles Solares</span>
              </ModernButton>
            </a>
          </div>
          
        </div>
      </div>
    </section>;
};
export default Hero;