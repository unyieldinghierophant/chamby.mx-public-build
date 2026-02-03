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
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 40 });
  
  // Use Intersection Observer to detect when categories come into view
  const isInView = useInView(containerRef, { 
    once: true, // Only trigger once
    amount: 0.2 // Trigger when 20% of the element is visible
  });

  // Update indicator position when selected category changes
  useEffect(() => {
    const updateIndicator = () => {
      if (tabsListRef.current) {
        const activeTab = tabsListRef.current.querySelector(`[data-state="active"]`) as HTMLElement;
        if (activeTab) {
          // Use offsetLeft and subtract scrollLeft to keep indicator aligned during scroll
          const scrollLeft = tabsListRef.current.scrollLeft;
          const activeCenter = activeTab.offsetLeft + (activeTab.offsetWidth / 2) - scrollLeft;
          setIndicatorStyle({
            left: activeCenter - 20,
            width: 40
          });
        }
      }
    };
    
    // Small delay to ensure DOM is updated
    const timer = setTimeout(updateIndicator, 50);
    window.addEventListener('resize', updateIndicator);
    
    // Update on scroll of the tabs container
    const tabsList = tabsListRef.current;
    if (tabsList) {
      tabsList.addEventListener('scroll', updateIndicator);
    }
    
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updateIndicator);
      if (tabsList) {
        tabsList.removeEventListener('scroll', updateIndicator);
      }
    };
  }, [selectedCategory]);

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

  // Limit services to 5 per category
  const limitedServices = services.slice(0, 5);

  return (
    <div ref={containerRef} className="w-full mx-auto">
      <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
        {/* Category Tabs - Horizontal scroll layout */}
        <div className="w-full">
          <TabsList ref={tabsListRef} className="w-full h-auto bg-transparent p-0 py-6 flex justify-start md:justify-center gap-6 md:gap-10 overflow-x-auto overflow-y-visible scrollbar-hide pl-4 relative z-20">
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
                className="flex-shrink-0 overflow-visible relative z-10"
              >
                  <TabsTrigger
                    value={category.id}
                    className={cn(
                      "flex flex-col items-center gap-2 md:gap-3 p-2 md:p-3",
                      "data-[state=active]:bg-transparent data-[state=active]:text-primary",
                      "text-muted-foreground bg-transparent",
                      "rounded-none h-auto min-w-[70px] md:min-w-[90px]",
                      "hover:text-primary transition-all duration-300",
                      "border-b-0 shadow-none overflow-visible cursor-pointer relative z-10"
                    )}
                  >
                  <motion.div 
                    className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-visible"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <img 
                      src={category.icon} 
                      alt={category.name} 
                      className="w-16 h-16 md:w-20 md:h-20 object-contain transform scale-[2]"
                      style={{ imageRendering: 'auto' }}
                    />
                  </motion.div>
                  <span className="text-xs md:text-sm font-semibold text-center leading-tight whitespace-nowrap">
                    {category.name}
                  </span>
                </TabsTrigger>
              </motion.div>
            ))}
          </TabsList>
          
          {/* Underline with active indicator */}
          <div className="relative mt-2">
            {/* Base line */}
            <div className="w-full h-[1px] bg-border" />
            {/* Active indicator */}
            <motion.div 
              className="absolute top-0 h-[3px] bg-primary rounded-full"
              initial={false}
              animate={{
                left: indicatorStyle.left,
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ width: indicatorStyle.width }}
            />
          </div>
        </div>

        {/* Service Pills for Each Category */}
        {categories.map((category) => (
          <TabsContent 
            key={category.id} 
            value={category.id}
            className="mt-8"
          >
            {/* Service pills - aesthetic grid layout like reference */}
            <motion.div 
              className="flex flex-wrap gap-2 md:gap-3 mb-6 max-w-xl"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.05 }
                }
              }}
            >
              {limitedServices.map((service, i) => (
                <motion.div
                  key={service.name}
                  variants={{
                    hidden: { opacity: 0, y: 10, scale: 0.95 },
                    visible: { 
                      opacity: 1, 
                      y: 0, 
                      scale: 1,
                      transition: { duration: 0.3, ease: "easeOut" }
                    }
                  }}
                >
                  <Button
                    onClick={() => handleServiceClick(service.name, service.description)}
                    variant="outline"
                    className="rounded-full px-4 py-1.5 md:px-5 md:py-2 h-auto text-xs md:text-sm bg-background border-border hover:bg-primary/5 hover:text-primary hover:border-primary transition-all duration-200"
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
