import { ModernButton } from "@/components/ui/modern-button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { AISearchBar } from "@/components/AISearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SavedJobBanner } from "@/components/SavedJobBanner";
import moneyBagIcon from "@/assets/money-bag-icon.png";

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
          {/* Floating Blue Card Container with Animated Gradient */}
          <motion.div 
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative rounded-[1.5rem] md:rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] border border-primary-foreground/20 bg-primary"
          >
            {/* Animated gradient overlay - subtle blue aurora effect */}
            <div 
              className="absolute inset-0 opacity-30 pointer-events-none"
              style={{
                background: `
                  radial-gradient(ellipse 80% 50% at 20% 40%, hsl(214 80% 55% / 0.6), transparent 50%),
                  radial-gradient(ellipse 60% 40% at 80% 60%, hsl(214 80% 30% / 0.5), transparent 50%),
                  radial-gradient(ellipse 50% 60% at 50% 85%, hsl(221 83% 45% / 0.4), transparent 45%)
                `,
                backgroundSize: '200% 200%',
                animation: 'gradient-shift 20s ease-in-out infinite',
              }}
            />
            
            {/* Main Content */}
            <div className="relative z-10 p-6 md:p-8 lg:p-10 xl:p-12 max-w-4xl mx-auto">
              {/* Text Content - Clean Layout with Staggered Animation */}
              <motion.div 
                className="space-y-4 md:space-y-6"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: {
                    transition: {
                      staggerChildren: 0.15,
                    },
                  },
                }}
              >
                <motion.h1 
                  className="font-audiowide text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl text-white leading-[1.2] uppercase tracking-wider text-center"
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                  }}
                >
                  <motion.span
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
                    }}
                  >
                    Encuentra a los mejores
                  </motion.span>
                  <motion.span 
                    className="block"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.1 } },
                    }}
                  >
                    profesionales del hogar
                  </motion.span>
                  <motion.span 
                    className="block"
                    variants={{
                      hidden: { opacity: 0, y: 20 },
                      visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.2 } },
                    }}
                  >
                    en Guadalajara.
                  </motion.span>
                </motion.h1>
              </motion.div>
              
              {/* Search Bar Section with Animation */}
              <motion.div 
                className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-2 sm:px-4 mt-6 md:mt-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <AISearchBar className="w-full" />
                
                {/* Gana dinero CTA */}
                <motion.div 
                  className="mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6, duration: 0.4 }}
                >
                  <Link to="/provider-landing">
                    <ModernButton 
                      variant="outline" 
                      className="w-full bg-white/10 text-white border-white/25 hover:bg-white/20 hover:border-white/40 flex items-center justify-center gap-2 transition-all duration-300"
                    >
                      <img src={moneyBagIcon} alt="Money bag" className="w-10 h-10" />
                      Gana dinero como Chambynauta
                    </ModernButton>
                  </Link>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>

          {/* Categories Section with Staggered Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
          >
            <CategoryTabs />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
