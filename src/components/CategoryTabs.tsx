import { useState, useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { startBooking } from '@/lib/booking';
import { useServiceCatalog, getSubcategoriesForCategory, ServiceCategory } from '@/hooks/useServiceCatalog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Icon imports — map slugs to existing images
import categoryHandyman from '@/assets/category-handyman.png';
import categoryElectrician from '@/assets/category-electrician.png';
import categoryPlumbing from '@/assets/category-plumbing.png';
import categoryAuto from '@/assets/category-auto.png';
import categoryCleaning from '@/assets/category-cleaning.png';
import categoryGardening from '@/assets/category-gardening.png';

// Hero images
import handymanHero from '@/assets/category-handyman-hero.jpg';
import electricianHero from '@/assets/category-electrician-hero.jpg';
import plumbingHero from '@/assets/category-plumbing-hero.jpg';
import autoHero from '@/assets/category-auto-hero.jpg';
import cleaningHero from '@/assets/category-cleaning-hero.png';
import gardeningHero from '@/assets/category-gardening-hero.png';

// Preload images
const allImages = [
  categoryHandyman, categoryElectrician, categoryPlumbing,
  categoryAuto, categoryCleaning, categoryGardening,
  handymanHero, electricianHero, plumbingHero,
  autoHero, cleaningHero, gardeningHero,
];
allImages.forEach((src) => { const img = new window.Image(); img.src = src; });

const SLUG_ICON_MAP: Record<string, string> = {
  general: categoryHandyman,
  electricidad: categoryElectrician,
  plomeria: categoryPlumbing,
  'aire-acondicionado': categoryAuto,
  electrodomesticos: categoryCleaning,
  jardineria: categoryGardening,
  pintura: categoryHandyman,
  albanileria: categoryHandyman,
};

const SLUG_HERO_MAP: Record<string, string> = {
  general: handymanHero,
  electricidad: electricianHero,
  plomeria: plumbingHero,
  'aire-acondicionado': autoHero,
  electrodomesticos: cleaningHero,
  jardineria: gardeningHero,
  pintura: handymanHero,
  albanileria: plumbingHero,
};

// Hardcoded fallback if DB fetch fails
const FALLBACK_CATEGORIES = [
  { slug: 'plomeria', name: 'Plomería' },
  { slug: 'electricidad', name: 'Electricidad' },
  { slug: 'pintura', name: 'Pintura' },
  { slug: 'albanileria', name: 'Albañilería' },
  { slug: 'aire-acondicionado', name: 'Aire Acondicionado' },
  { slug: 'electrodomesticos', name: 'Electrodomésticos' },
  { slug: 'jardineria', name: 'Jardinería' },
  { slug: 'general', name: 'General / Handyman' },
];

export const CategoryTabs = () => {
  const { categories, subcategories, loading, error } = useServiceCatalog();
  const navigate = useNavigate();
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 40 });

  // Use DB categories or fallback
  const displayCategories = useMemo(() => {
    if (categories.length > 0) return categories;
    if (error) {
      return FALLBACK_CATEGORIES.map((f, i) => ({
        id: f.slug,
        slug: f.slug,
        name: f.name,
        description: null,
        icon: null,
        sort_order: i,
        is_active: true,
      })) as ServiceCategory[];
    }
    return [];
  }, [categories, error]);

  const [selectedSlug, setSelectedSlug] = useState<string>('');

  // Set initial selection when categories load
  useEffect(() => {
    if (displayCategories.length > 0 && !selectedSlug) {
      setSelectedSlug(displayCategories[0].slug);
    }
  }, [displayCategories, selectedSlug]);

  // Update indicator
  useEffect(() => {
    const update = () => {
      if (tabsListRef.current) {
        const active = tabsListRef.current.querySelector(`[data-state="active"]`) as HTMLElement;
        if (active) {
          const listRect = tabsListRef.current.getBoundingClientRect();
          const activeRect = active.getBoundingClientRect();
          const center = activeRect.left - listRect.left + activeRect.width / 2;
          setIndicatorStyle({ left: center - 20, width: 40 });
        }
      }
    };
    const t = setTimeout(update, 50);
    window.addEventListener('resize', update);
    const el = tabsListRef.current;
    if (el) el.addEventListener('scroll', update);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', update);
      if (el) el.removeEventListener('scroll', update);
    };
  }, [selectedSlug]);

  const currentCat = displayCategories.find((c) => c.slug === selectedSlug);
  const currentSubs = currentCat
    ? getSubcategoriesForCategory(currentCat.slug, subcategories, displayCategories)
    : [];

  const handleServiceClick = (serviceName: string, categorySlug: string, serviceSlug: string) => {
    localStorage.removeItem('chamby_form_job-booking');
    sessionStorage.removeItem('chamby_form_job-booking');
    navigate(`/book-job?category=${categorySlug}&service=${serviceSlug}&source=category&new=${Date.now()}`);
  };

  if (loading) {
    return (
      <div className="w-full mx-auto">
        <div className="flex gap-6 md:gap-10 justify-start md:justify-center py-6 overflow-x-auto scrollbar-hide pl-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 min-w-[70px]">
              <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
              <Skeleton className="w-14 h-3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (displayCategories.length === 0) return null;

  return (
    <div className="w-full mx-auto">
      <Tabs value={selectedSlug} onValueChange={setSelectedSlug} className="w-full">
        <div className="w-full relative z-30">
          <TabsList
            ref={tabsListRef}
            className="w-full h-auto bg-transparent p-0 py-6 flex justify-start md:justify-center gap-6 md:gap-10 overflow-x-auto overflow-y-visible scrollbar-hide pl-4 relative z-30"
          >
            {displayCategories.map((cat, index) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-shrink-0 overflow-visible relative z-10"
              >
                <TabsTrigger
                  value={cat.slug}
                  className={cn(
                    'flex flex-col items-center gap-2 md:gap-3 p-2 md:p-3',
                    'data-[state=active]:bg-transparent data-[state=active]:text-primary',
                    'text-muted-foreground bg-transparent',
                    'rounded-none h-auto min-w-[70px] md:min-w-[90px]',
                    'hover:text-primary transition-all duration-300',
                    'border-b-0 shadow-none overflow-visible cursor-pointer relative z-10'
                  )}
                >
                  <motion.div
                    className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-visible"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <img
                      src={SLUG_ICON_MAP[cat.slug] || categoryHandyman}
                      alt={cat.name}
                      className="w-16 h-16 md:w-20 md:h-20 object-contain transform scale-[2]"
                      style={{ imageRendering: 'auto' }}
                      loading="eager"
                    />
                  </motion.div>
                  <span className="text-xs md:text-sm font-bold text-center leading-tight whitespace-nowrap">
                    {cat.name}
                  </span>
                </TabsTrigger>
              </motion.div>
            ))}
          </TabsList>

          {/* Underline */}
          <div className="relative mt-2 pl-4">
            <div className="w-full h-[1px] bg-border" />
            <motion.div
              className="absolute top-0 h-[3px] bg-primary rounded-full"
              initial={false}
              animate={{ left: indicatorStyle.left }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ width: indicatorStyle.width }}
            />
          </div>
        </div>

        {/* Subcategory pills + hero */}
        {displayCategories.map((cat) => {
          const subs = getSubcategoriesForCategory(cat.slug, subcategories, displayCategories);
          const heroImg = SLUG_HERO_MAP[cat.slug] || handymanHero;

          return (
            <TabsContent key={cat.slug} value={cat.slug} className="mt-8 relative z-10">
              <motion.div
                className="flex flex-wrap gap-2 md:gap-3 mb-6 max-w-xl"
                initial="hidden"
                animate="visible"
                variants={{
                  hidden: {},
                  visible: { transition: { staggerChildren: 0.05 } },
                }}
              >
                {subs.slice(0, 6).map((sub) => (
                  <motion.div
                    key={sub.id}
                    variants={{
                      hidden: { opacity: 0, y: 10, scale: 0.95 },
                      visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
                    }}
                  >
                    <Button
                      onClick={() => handleServiceClick(sub.name, cat.slug, sub.slug)}
                      variant="outline"
                      className="rounded-full px-4 py-2 md:px-6 md:py-2.5 h-auto text-sm md:text-base font-medium bg-background border-border hover:bg-primary/5 hover:text-primary hover:border-primary transition-all duration-200"
                    >
                      {sub.name}
                    </Button>
                  </motion.div>
                ))}
              </motion.div>

              {/* Hero image */}
              <motion.div
                className="rounded-2xl overflow-hidden bg-blue-50 p-4 md:p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="relative">
                  <img
                    src={heroImg}
                    alt={cat.name}
                    className="w-full h-[220px] md:h-[400px] object-cover rounded-xl"
                    loading="eager"
                  />
                  {/* Desktop overlay */}
                  <div className="hidden md:block absolute top-8 left-8 bg-white rounded-xl p-6 shadow-lg max-w-[350px]">
                    <h3 className="text-2xl font-jakarta font-semibold text-foreground mb-4">
                      {cat.name}
                    </h3>
                    {cat.description && (
                      <p className="text-base flex items-start gap-2">
                        <span className="text-primary text-lg">✓</span>
                        <span>{cat.description}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Mobile: text above image */}
                <div className="md:hidden mt-4 text-left">
                  <h3 className="text-xl font-jakarta font-semibold text-foreground mb-2">
                    {cat.name}
                  </h3>
                  {cat.description && (
                    <p className="text-sm flex items-start gap-2 text-muted-foreground">
                      <span className="text-primary text-lg">✓</span>
                      <span>{cat.description}</span>
                    </p>
                  )}
                </div>
              </motion.div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
