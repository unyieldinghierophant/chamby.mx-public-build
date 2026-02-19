import { ModernButton } from "@/components/ui/modern-button";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { motion } from "framer-motion";
import { AISearchBar } from "@/components/AISearchBar";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowRight } from "lucide-react";
import { LocationChip } from "@/components/LocationChip";
import { CategoryTabs } from "@/components/CategoryTabs";
import { SavedJobBanner } from "@/components/SavedJobBanner";
import moneyBagIcon from "@/assets/money-bag-icon.png";
import heroBgVideo from "@/assets/hero-bg-video.mp4";

// Preload icon image immediately
const preloadMoneyBag = new window.Image();
preloadMoneyBag.src = moneyBagIcon;

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
            className="relative rounded-[1.5rem] md:rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] border border-primary-foreground/20 bg-primary"
          >
            {/* Subtle grid pattern background */}
            <div className="absolute inset-0 overflow-hidden rounded-[1.5rem] md:rounded-[2.5rem]">
              <div 
                className="absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                  backgroundSize: '60px 60px',
                }}
              />
            </div>
            
            {/* Main Content */}
            <div className="relative z-40 p-6 md:p-8 lg:p-10 xl:p-12 max-w-4xl mx-auto">
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
                  className="font-jakarta font-medium text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl text-white leading-[1.15] tracking-tight text-center"
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
              
              {/* Location Chip + Search Bar */}
              <motion.div 
                className="max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-2 sm:px-4 mt-6 md:mt-8 space-y-3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.5 }}
              >
                <div className="flex justify-center">
                  <LocationChip variant="dark" />
                </div>
                <AISearchBar className="w-full" />
              </motion.div>
            </div>
          </motion.div>

          {/* Gana dinero CTA - Between hero card and categories */}
          <motion.div 
            className="mt-6 max-w-sm sm:max-w-md md:max-w-xl lg:max-w-2xl mx-auto px-2 sm:px-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.4 }}
          >
            <Link to="/provider-landing">
              <div className="group relative w-full rounded-2xl border-2 border-foreground/80 bg-gradient-to-br from-background via-muted/30 to-background p-4 md:p-5 shadow-md hover:shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center gap-4 cursor-pointer">
                <img src={moneyBagIcon} alt="Money bag" className="w-[115px] h-[115px] md:w-36 md:h-36 flex-shrink-0" loading="eager" />
                <div className="flex-1 text-left min-w-0">
                  <h3 className="text-lg md:text-xl font-bold text-foreground leading-tight">
                    Gana dinero como Chambynauta
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mt-0.5">
                    Regístrate gratis y empieza a recibir trabajos hoy
                  </p>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-foreground flex items-center justify-center group-hover:bg-primary transition-colors">
                  <ArrowRight className="w-5 h-5 text-background" />
                </div>
              </div>
            </Link>
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
