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
const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const {
    user
  } = useAuth();
  return <section className="relative min-h-screen bg-background flex items-start justify-center pt-4 md:pt-6 overflow-hidden">
      {/* Saved Job Banner */}
      <SavedJobBanner />
      
      <div className="w-[96%] md:w-[98%] mx-auto relative z-10 mt-0">
        <div className="text-center space-y-6">
          {/* Floating Blue Card Container */}
          <div className="relative bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 lg:p-10 xl:p-12 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] border border-white/10">
            {/* Clean background - stars removed for readability */}
            {/* Main Content - Single Column Layout */}
            <div className="relative z-10 space-y-6 md:space-y-8">
              {/* Text Content - Clean Layout with Animation */}
              <div className="space-y-4 md:space-y-6 animate-fade-in">
                <h1 className="font-dillan text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.1] uppercase tracking-wide px-2 text-center"
                    style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)' }}>
                  SERVICIOS DEL
                  <span className="block">HOGAR FUERA</span>
                  <span className="block">DE ESTE MUNDO.</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed max-w-3xl mx-auto px-4 pt-2 font-medium text-white text-center"
                   style={{ textShadow: '0 2px 10px rgba(0,0,0,0.4)' }}>
                  Soluciona en minutos no en días
                </p>
              </div>
              
              {/* Search Bar Section - Isolated from transforms */}
              <div className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-2 sm:px-4" style={{
              transform: 'none'
            }}>
                <AISearchBar className="w-full" />
                
                {/* Gana dinero CTA */}
                <div className="mt-4">
                  <Link to="/provider-landing">
                    <ModernButton variant="outline" className="w-full bg-white/10 text-white border-white/20 hover:bg-white/20 flex items-center justify-center gap-2">
                      <img src={moneyBagIcon} alt="Money bag" className="w-10 h-10" />
                      Gana dinero como Chambynauta
                    </ModernButton>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Categories Section */}
          <CategoryTabs />

          {/* Trust Indicators */}
          

          {/* Stats */}
          
        </div>
      </div>
    </section>;
};
export default Hero;