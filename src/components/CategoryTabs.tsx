import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useServiceCatalog, getSubcategoriesForCategory, ServiceCategory } from '@/hooks/useServiceCatalog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useServiceCatalog, getSubcategoriesForCategory, ServiceCategory } from '@/hooks/useServiceCatalog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

// Icon imports
import categoryHandyman from '@/assets/category-handyman.png';
import categoryElectrician from '@/assets/category-electrician.png';
import categoryPlumbing from '@/assets/category-plumbing.png';
import categoryAuto from '@/assets/category-auto.png';
import categoryCleaning from '@/assets/category-cleaning.png';
import categoryGardening from '@/assets/category-gardening.png';
import categoryAC from '@/assets/category-ac.png';
import categoryAlbanileria from '@/assets/category-albanileria.png';
import categoryPintura from '@/assets/category-pintura.png';
import categoryElectrodomesticos from '@/assets/category-electrodomesticos.png';
import acHero from '@/assets/category-ac-hero.png';
import pinturaHero from '@/assets/category-pintura-hero.png';
import albanileriaHero from '@/assets/category-albanileria-hero.png';

// Hero images
import handymanHero from '@/assets/category-handyman-hero.jpg';
import electricianHero from '@/assets/category-electrician-hero.jpg';
import plumbingHero from '@/assets/category-plumbing-hero.jpg';
import autoHero from '@/assets/category-auto-hero.jpg';
import cleaningHero from '@/assets/category-cleaning-hero.png';
import gardeningHero from '@/assets/category-gardening-hero.png';

// Preload ALL images (icons + heroes) immediately at module load
const allImages = [
  categoryHandyman, categoryElectrician, categoryPlumbing,
  categoryAuto, categoryCleaning, categoryGardening,
  categoryAC, categoryAlbanileria, categoryPintura, categoryElectrodomesticos,
  handymanHero, electricianHero, plumbingHero,
  autoHero, cleaningHero, gardeningHero,
  acHero, pinturaHero, albanileriaHero,
];
const imageCache = new Map<string, boolean>();
allImages.forEach((src) => {
  const img = new window.Image();
  img.onload = () => imageCache.set(src, true);
  img.src = src;
  if (img.complete) imageCache.set(src, true);
});

/** Tiny hook: returns true once the image is decoded & ready to paint */
function useImageReady(src: string) {
  const [ready, setReady] = useState(() => imageCache.get(src) === true);
  useEffect(() => {
    if (ready) return;
    if (imageCache.get(src)) { setReady(true); return; }
    const img = new window.Image();
    img.onload = () => { imageCache.set(src, true); setReady(true); };
    img.src = src;
    if (img.complete) { imageCache.set(src, true); setReady(true); }
  }, [src, ready]);
  return ready;
}

/** Preloaded image with skeleton fallback */
const PreloadedImage = ({ src, alt, className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
  const isReady = useImageReady(src || '');
  return (
    <div className="relative w-full h-full">
      {!isReady && (
        <Skeleton className={cn("absolute inset-0", className)} />
      )}
      <img
        src={src}
        alt={alt}
        className={cn(className, isReady ? 'opacity-100' : 'opacity-0', 'transition-opacity duration-300')}
        {...props}
      />
    </div>
  );
};

const SLUG_ICON_MAP: Record<string, string> = {
  general: categoryHandyman,
  electricidad: categoryElectrician,
  plomeria: categoryPlumbing,
  'aire-acondicionado': categoryAC,
  limpieza: categoryCleaning,
  jardineria: categoryGardening,
  pintura: categoryPintura,
  albanileria: categoryAlbanileria,
  electrodomesticos: categoryElectrodomesticos,
};

const SLUG_HERO_MAP: Record<string, string> = {
  general: handymanHero,
  electricidad: electricianHero,
  plomeria: plumbingHero,
  'aire-acondicionado': acHero,
  limpieza: cleaningHero,
  jardineria: gardeningHero,
  pintura: pinturaHero,
  albanileria: albanileriaHero,
  electrodomesticos: cleaningHero,
};

// The 7 categories to show, in order, with display label overrides
const VISIBLE_SLUGS_ORDERED = [
  { slug: 'plomeria', label: 'Fontanería' },
  { slug: 'electricidad', label: null },
  { slug: 'general', label: 'Arreglos Generales' },
  { slug: 'jardineria', label: 'Jardinería' },
  { slug: 'pintura', label: null },
  { slug: 'aire-acondicionado', label: 'Electrodomésticos' },
  { slug: 'limpieza', label: 'Limpieza' },
];

// Hardcoded fallback if DB fetch fails
const FALLBACK_CATEGORIES: ServiceCategory[] = VISIBLE_SLUGS_ORDERED.map((v, i) => ({
  id: v.slug,
  slug: v.slug,
  name: v.label || v.slug,
  description: null,
  icon: null,
  sort_order: i,
  is_active: true,
}));

export const CategoryTabs = () => {
  const { categories, subcategories, loading, error } = useServiceCatalog();
  const navigate = useNavigate();
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 40 });

  // Filter & order categories to the 7 we want
  const displayCategories = useMemo(() => {
    const source = categories.length > 0 ? categories : error ? FALLBACK_CATEGORIES : [];
    if (source.length === 0) return [];

    return VISIBLE_SLUGS_ORDERED.map((v) => {
      const cat = source.find((c) => c.slug === v.slug);
      if (!cat) return null;
      // Apply label override
      return v.label ? { ...cat, name: v.label } : cat;
    }).filter(Boolean) as ServiceCategory[];
  }, [categories, error]);

  const [selectedSlug, setSelectedSlug] = useState<string>('');

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

  const handleServiceClick = (serviceName: string, categorySlug: string, serviceSlug: string) => {
    localStorage.removeItem('chamby_form_job-booking');
    sessionStorage.removeItem('chamby_form_job-booking');
    navigate(`/book-job?category=${categorySlug}&service=${serviceSlug}&source=category&new=${Date.now()}`);
  };

  if (loading) {
    return (
      <div className="w-full mx-auto">
        <div className="flex gap-6 md:gap-10 justify-start md:justify-center py-6 overflow-x-auto scrollbar-hide pl-4">
          {Array.from({ length: 7 }).map((_, i) => (
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
            className="w-full h-auto bg-transparent p-0 py-6 flex justify-start md:justify-center gap-4 sm:gap-6 md:gap-8 overflow-x-auto overflow-y-visible pl-4 pr-4 relative z-30"
            style={{
              WebkitOverflowScrolling: 'touch',
              scrollSnapType: 'x mandatory',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {displayCategories.map((cat, index) => (
              <motion.div
                key={cat.slug}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex-shrink-0 overflow-visible relative z-10"
                style={{ scrollSnapAlign: 'start' }}
              >
                <TabsTrigger
                  value={cat.slug}
                  className={cn(
                    'flex flex-col items-center gap-2 md:gap-3 p-2 md:p-3',
                    'data-[state=active]:bg-transparent data-[state=active]:text-primary',
                    'text-muted-foreground bg-transparent',
                    'rounded-none h-auto w-[80px] sm:w-[90px] md:w-[110px]',
                    'hover:text-primary transition-all duration-300',
                    'border-b-0 shadow-none overflow-visible cursor-pointer relative z-10'
                  )}
                >
                  <motion.div
                    className="w-16 h-16 md:w-20 md:h-20 flex items-center justify-center overflow-visible"
                    whileHover={{ scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <PreloadedImage
                      src={SLUG_ICON_MAP[cat.slug] || categoryHandyman}
                      alt={cat.name}
                      className="w-16 h-16 md:w-20 md:h-20 object-contain transform scale-[2]"
                      style={{ imageRendering: 'auto' }}
                    />
                  </motion.div>
                  <span className="text-[11px] sm:text-xs md:text-sm font-bold text-center leading-tight whitespace-normal w-full">
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
          // For 'general' (Arreglos Generales), also include albañilería subcategories
          const baseSubs = getSubcategoriesForCategory(cat.slug, subcategories, categories.length > 0 ? categories : displayCategories);
          const subs = cat.slug === 'general'
            ? [...baseSubs, ...getSubcategoriesForCategory('albanileria', subcategories, categories.length > 0 ? categories : displayCategories)]
            : baseSubs;
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
                {subs.length > 0 ? (
                  <>
                    {subs.slice(0, 8).map((sub) => (
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
                          className="rounded-full px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2.5 h-auto text-xs sm:text-sm md:text-base font-medium bg-background border-border hover:bg-primary/5 hover:text-primary hover:border-primary transition-all duration-200 whitespace-nowrap"
                        >
                          {sub.name}
                        </Button>
                      </motion.div>
                    ))}
                    {/* "Otro servicio" pill */}
                    <motion.div
                      variants={{
                        hidden: { opacity: 0, y: 10, scale: 0.95 },
                        visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: 'easeOut' } },
                      }}
                    >
                      <Button
                        onClick={() => handleServiceClick('Otro', cat.slug, 'otro')}
                        variant="outline"
                        className="rounded-full px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-2.5 h-auto text-xs sm:text-sm md:text-base font-bold bg-primary/5 border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-200 whitespace-nowrap gap-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Otros trabajos de {cat.name}
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Selecciona una categoría para ver servicios disponibles</p>
                )}
              </motion.div>

              {/* Hero image */}
              <motion.div
                className="rounded-2xl overflow-hidden bg-blue-50 p-4 md:p-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.5 }}
              >
                <div className="relative">
                  <PreloadedImage
                    src={heroImg}
                    alt={cat.name}
                    className="w-full h-[220px] md:h-[400px] object-cover rounded-xl"
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
