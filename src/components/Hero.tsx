import { ModernButton } from "@/components/ui/modern-button";
import { Link, useNavigate } from "react-router-dom";
import { useState, useCallback } from "react";
import { AISearchBar } from "@/components/AISearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SavedJobBanner } from "@/components/SavedJobBanner";
import moneyBagIcon from "@/assets/money-bag-icon.png";
import ParallaxJaliscoBackground from "@/components/ParallaxJaliscoBackground";

const Hero = () => {
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <section className="relative min-h-screen bg-background flex items-start justify-center pt-4 md:pt-6 overflow-hidden">
      {/* Saved Job Banner */}
      <SavedJobBanner />
      
      <div className="w-[96%] md:w-[98%] mx-auto relative z-10 mt-0">
        <div className="text-center space-y-6">
          {/* Floating Blue Card Container with Parallax Jalisco Background */}
          <div className="relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] border border-white/10">
            {/* Parallax Jalisco background */}
            <ParallaxJaliscoBackground />
            
            {/* Dark overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-black/15 to-black/25 pointer-events-none z-[1]" />
            
            {/* Main Content */}
            <div className="relative z-10 p-6 md:p-8 lg:p-10 xl:p-12 max-w-4xl mx-auto">
              {/* Text Content - Clean Layout with Animation */}
              <div className="space-y-4 md:space-y-6 animate-fade-in">
                <h1 
                  className="font-dillan text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl text-white leading-[1.15] uppercase tracking-wide text-center"
                  style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)' }}
                >
                  Encuentra a los mejores
                  <span className="block">profesionales del hogar</span>
                  <span className="block">en Guadalajara.</span>
                </h1>
              </div>
              
              {/* Search Bar Section */}
              <div className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-2 sm:px-4 mt-6 md:mt-8">
                <AISearchBar className="w-full" />
                
                {/* Gana dinero CTA */}
                <div className="mt-4">
                  <Link to="/provider-landing">
                    <ModernButton 
                      variant="outline" 
                      className="w-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:border-white/40 flex items-center justify-center gap-2 transition-all duration-300"
                    >
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
        </div>
      </div>
    </section>
  );
};

export default Hero;
