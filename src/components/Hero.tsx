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
            {/* Shiny Stars Background - SVG Stars */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Large stars */}
              <svg className="absolute top-[8%] left-[12%] w-6 h-6 text-white animate-[pulse_2s_ease-in-out_infinite]" style={{
              animationDelay: '0s',
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))'
            }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute top-[15%] right-[18%] w-5 h-5 text-white animate-[pulse_2.5s_ease-in-out_infinite]" style={{
              animationDelay: '0.5s',
              filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9))'
            }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute bottom-[12%] left-[8%] w-4 h-4 text-white animate-[pulse_3s_ease-in-out_infinite]" style={{
              animationDelay: '1s',
              filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.7))'
            }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute top-[55%] right-[12%] w-6 h-6 text-white animate-[pulse_2s_ease-in-out_infinite]" style={{
              animationDelay: '1.5s',
              filter: 'drop-shadow(0 0 7px rgba(255,255,255,0.85))'
            }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute bottom-[22%] right-[22%] w-5 h-5 text-white animate-[pulse_2.5s_ease-in-out_infinite]" style={{
              animationDelay: '2s',
              filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))'
            }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute top-[38%] left-[16%] w-4 h-4 text-white animate-[pulse_3s_ease-in-out_infinite]" style={{
              animationDelay: '2.5s',
              filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.75))'
            }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              {/* Small sparkle stars */}
              <svg className="absolute top-[25%] left-[25%] w-3 h-3 text-white/80 animate-[pulse_2.2s_ease-in-out_infinite]" style={{
              animationDelay: '0.3s',
              filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.6))'
            }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute bottom-[35%] right-[8%] w-3 h-3 text-white/80 animate-[pulse_2.8s_ease-in-out_infinite]" style={{
              animationDelay: '1.2s',
              filter: 'drop-shadow(0 0 3px rgba(255,255,255,0.6))'
            }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            {/* Main Content - Single Column Layout */}
            <div className="relative z-10 space-y-6 md:space-y-8">
              {/* Text Content with transforms */}
              <div className="space-y-4 md:space-y-6">
                <h1 className="font-dillan text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-white leading-[1.1] uppercase tracking-wide px-2">
                  SERVICIOS DEL
                  <span className="block">HOGAR FUERA</span>
                  <span className="block">DE ESTE MUNDO.</span>
                </h1>
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl leading-relaxed max-w-3xl mx-auto px-4 pt-2 font-medium text-white">
                  Soluciona en minutos no en días
                </p>
              </div>
              
              {/* Search Bar Section - Isolated from transforms */}
              <div className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-2 sm:px-4" style={{ transform: 'none' }}>
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