import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { categoryServicesMap } from '@/data/categoryServices';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import categoryHandyman from '@/assets/category-handyman.png';
import categoryElectrician from '@/assets/category-electrician.png';
import categoryPlumbing from '@/assets/category-plumbing.png';
import categoryAuto from '@/assets/category-auto.png';
import handymanHero from '@/assets/category-handyman-hero.jpg';
import electricianHero from '@/assets/category-electrician-hero.jpg';
import plumbingHero from '@/assets/category-plumbing-hero.jpg';
import autoHero from '@/assets/category-auto-hero.jpg';
import { cn } from '@/lib/utils';

interface Category {
  id: string;
  name: string;
  icon: string;
  dataKey: string;
  heroImage: string;
}

const categories: Category[] = [
  { id: 'handyman', name: 'Handyman', icon: categoryHandyman, dataKey: 'Handyman', heroImage: handymanHero },
  { id: 'electrician', name: 'Electricidad', icon: categoryElectrician, dataKey: 'Electricidad', heroImage: electricianHero },
  { id: 'plumbing', name: 'Fontanería', icon: categoryPlumbing, dataKey: 'Fontanería', heroImage: plumbingHero },
  { id: 'auto', name: 'Auto y Lavado', icon: categoryAuto, dataKey: 'Auto y Lavado', heroImage: autoHero },
];

export const CategoryTabs = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0].id);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use Intersection Observer to detect when categories come into view
  const isInView = useInView(containerRef, { 
    once: true, // Only trigger once
    amount: 0.2 // Trigger when 20% of the element is visible
  });

  const currentCategory = categories.find(cat => cat.id === selectedCategory);
  const services = currentCategory ? categoryServicesMap[currentCategory.dataKey] || [] : [];

  const handleServiceClick = (serviceName: string, description: string) => {
    // Clear any saved form data to start fresh
    localStorage.removeItem('chamby_form_job-booking');
    sessionStorage.removeItem('chamby_form_job-booking');
    
    // Navigate to booking with force-new flag to ensure fresh form
    navigate(`/book-job?new=${Date.now()}`, {
      state: {
        category: currentCategory?.dataKey || 'General',
        service: serviceName,
        description: description,
        forceNew: true // Flag to force fresh form
      }
    });
  };

  return (
    <div ref={containerRef} className="w-full mx-auto">
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        {/* Category Tabs - Horizontal scroll layout */}
        <div className="w-full">
          <TabsList className="w-full h-auto bg-background p-3 md:p-4 rounded-2xl flex gap-4 md:gap-6 overflow-x-auto scrollbar-thin scrollbar-thumb-muted-foreground/30 scrollbar-track-transparent pb-2">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { 
                  opacity: 1, 
                  y: 0,
                } : { opacity: 0, y: 30 }}
                transition={{
                  delay: index * 0.1,
                  duration: 0.4,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="flex-shrink-0"
              >
                <TabsTrigger
                  value={category.id}
                  className={cn(
                    "flex flex-col items-center gap-1.5 md:gap-2 p-2 md:p-3",
                    "data-[state=active]:bg-transparent data-[state=active]:text-primary",
                    "text-muted-foreground",
                    "rounded-lg h-auto min-w-[70px] md:min-w-[90px]",
                    "hover:text-primary transition-all duration-300",
                    "border-b-2 border-transparent data-[state=active]:border-primary"
                  )}
                >
                  <motion.div 
                    className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img 
                      src={category.icon} 
                      alt={category.name} 
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'auto' }}
                    />
                  </motion.div>
                  <span className="text-xs md:text-sm font-medium text-center leading-tight whitespace-nowrap">
                    {category.name}
                  </span>
                </TabsTrigger>
              </motion.div>
            ))}
          </TabsList>
          
          {/* Scroll indicator */}
          <div className="flex justify-center mt-2">
            <div className="flex gap-1">
              <div className="w-8 h-1 bg-primary/40 rounded-full"></div>
              <div className="w-2 h-1 bg-muted-foreground/20 rounded-full"></div>
              <div className="w-2 h-1 bg-muted-foreground/20 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Service Pills for Each Category */}
        {categories.map((category) => (
          <TabsContent 
            key={category.id} 
            value={category.id}
            className="mt-8"
          >
            {/* Service pills - wrapping layout with staggered animation */}
            <motion.div 
              className="flex flex-wrap gap-2 md:gap-3 mb-6"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.05 }
                }
              }}
            >
              {services.map((service, i) => (
                <motion.div
                  key={service.name}
                  variants={{
                    hidden: { opacity: 0, x: -40, scale: 0.85 },
                    visible: { 
                      opacity: 1, 
                      x: 0, 
                      scale: 1,
                      transition: { duration: 0.4, ease: "easeOut" }
                    }
                  }}
                >
                  <Button
                    onClick={() => handleServiceClick(service.name, service.description)}
                    variant="outline"
                    className="rounded-full px-4 py-2 md:px-5 md:py-2.5 h-auto text-sm md:text-base bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-300 hover:scale-105"
                  >
                    {service.name}
                  </Button>
                </motion.div>
              ))}
            </motion.div>
            
            {/* Hero Image Container with Responsive Text */}
            <motion.div 
              className="rounded-2xl overflow-hidden bg-blue-50 p-4 md:p-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              
              {/* Mobile: Text ABOVE image (hidden on desktop) */}
              <div className="md:hidden mb-4 text-left">
                <h3 className="text-xl font-bold text-foreground mb-3">
                  {category.name}
                </h3>
                <div className="space-y-2">
                  {category.id === 'handyman' && (
                    <>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span>Monta de forma segura tu TV, estantes, arte, espejos, y más.</span>
                      </p>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span><strong className="text-foreground">Ahora en tendencia:</strong> Paredes galería, TVs artísticos, y estanterías envolventes.</span>
                      </p>
                    </>
                  )}
                  {category.id === 'electrician' && (
                    <>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span>Instalaciones eléctricas seguras y certificadas por profesionales.</span>
                      </p>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span><strong className="text-foreground">Ahora en tendencia:</strong> Iluminación LED inteligente y paneles solares.</span>
                      </p>
                    </>
                  )}
                  {category.id === 'plumbing' && (
                    <>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span>Reparaciones rápidas de fugas, tuberías, y sistemas de agua.</span>
                      </p>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span><strong className="text-foreground">Ahora en tendencia:</strong> Grifería moderna y sistemas de ahorro de agua.</span>
                      </p>
                    </>
                  )}
                  {category.id === 'auto' && (
                    <>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span>Lavado profesional de auto a domicilio, sin complicaciones.</span>
                      </p>
                      <p className="text-sm flex items-start gap-2 text-muted-foreground">
                        <span className="text-primary text-lg">✓</span>
                        <span><strong className="text-foreground">Ahora en tendencia:</strong> Detallado ecológico y protección cerámica.</span>
                      </p>
                    </>
                  )}
                </div>
              </div>

              {/* Image Container */}
              <div className="relative">
                {/* Hero Image */}
                <img 
                  src={category.heroImage} 
                  alt={category.name}
                  className="w-full h-[220px] md:h-[400px] object-cover rounded-xl"
                />
                
                {/* Desktop: Overlay Card (hidden on mobile) */}
                <div className="hidden md:block absolute top-8 left-8 bg-white rounded-xl p-6 shadow-lg max-w-[350px]">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">
                    {category.name}
                  </h3>
                  <div className="space-y-3">
                    {category.id === 'handyman' && (
                      <>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Monta de forma segura tu TV, estantes, arte, espejos, y más.</span>
                        </p>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Paredes galería, TVs artísticos, y estanterías envolventes.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'electrician' && (
                      <>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Instalaciones eléctricas seguras y certificadas por profesionales.</span>
                        </p>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Iluminación LED inteligente y paneles solares.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'plumbing' && (
                      <>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Reparaciones rápidas de fugas, tuberías, y sistemas de agua.</span>
                        </p>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Grifería moderna y sistemas de ahorro de agua.</span>
                        </p>
                      </>
                    )}
                    {category.id === 'auto' && (
                      <>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span>Lavado profesional de auto a domicilio, sin complicaciones.</span>
                        </p>
                        <p className="text-base flex items-start gap-2">
                          <span className="text-primary text-lg">✓</span>
                          <span><strong>Ahora en tendencia:</strong> Detallado ecológico y protección cerámica.</span>
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};
