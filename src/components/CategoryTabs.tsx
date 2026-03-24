import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useServiceCatalog, getSubcategoriesForCategory, ServiceCategory } from '@/hooks/useServiceCatalog';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Plus, ArrowRight } from 'lucide-react';

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
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import categoryElectrodomesticos from '@/assets/category-electrodomesticos.png?v=3';
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

// Preload ALL icon images immediately at module load
const iconImages = [
  categoryHandyman, categoryElectrician, categoryPlumbing,
  categoryAuto, categoryCleaning, categoryGardening,
  categoryAC, categoryAlbanileria, categoryPintura, categoryElectrodomesticos,
];
const heroImages = [
  handymanHero, electricianHero, plumbingHero,
  autoHero, cleaningHero, gardeningHero,
  acHero, pinturaHero, albanileriaHero,
];
const allImages = [...iconImages, ...heroImages];
const imageCache = new Map<string, boolean>();

// Returns a promise that resolves when ALL icon images are loaded
export function preloadCategoryIcons(): Promise<void> {
  return Promise.all(
    iconImages.map((src) => {
      if (imageCache.get(src)) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const img = new window.Image();
        img.onload = () => { imageCache.set(src, true); resolve(); };
        img.onerror = () => { imageCache.set(src, true); resolve(); };
        img.src = src;
        if (img.complete) { imageCache.set(src, true); resolve(); }
      });
    })
  ).then(() => {});
}

// Kick off preload immediately
allImages.forEach((src) => {
  if (imageCache.get(src)) return;
  const img = new window.Image();
  img.onload = () => imageCache.set(src, true);
  img.onerror = () => imageCache.set(src, true);
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
  'aire-acondicionado': categoryElectrodomesticos,
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

const CategoryTabsSkeleton = () => (
  <div className="w-full mx-auto">
    <div className="flex gap-6 sm:gap-8 md:gap-10 justify-start md:justify-center py-4 pb-6 overflow-x-auto scrollbar-hide px-4">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex flex-col items-center gap-1.5 md:gap-3 w-[80px] min-w-[80px] sm:w-[90px] sm:min-w-[90px] md:w-[110px]">
          <Skeleton className="w-16 h-16 md:w-20 md:h-20 rounded-full" />
          <Skeleton className="w-14 h-3 mt-1" />
        </div>
      ))}
    </div>
    <div className="relative mt-2 pl-4">
      <div className="w-full h-[1px] bg-border" />
    </div>
    {/* Pill skeleton */}
    <div className="flex flex-wrap gap-2 md:gap-3 mt-8 mb-6 max-w-xl px-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Skeleton key={i} className="h-10 w-28 rounded-full" />
      ))}
      <Skeleton className="h-10 w-44 rounded-full" />
    </div>
  </div>
);

export const CategoryTabs = ({ onIconsReady }: { onIconsReady?: () => void } = {}) => {
  const { categories, subcategories, loading, error } = useServiceCatalog();
  const navigate = useNavigate();
  const tabsListRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 40 });
  const [iconsLoaded, setIconsLoaded] = useState(() => {
    // Check if all icons are already cached from module-level preload
    return iconImages.every((src) => imageCache.get(src) === true);
  });

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

  // Wait for all icon images to be fully loaded before showing content
  const iconsSignaled = useRef(false);
  useEffect(() => {
    if (iconsLoaded) {
      if (!iconsSignaled.current && onIconsReady) {
        iconsSignaled.current = true;
        onIconsReady();
      }
      return;
    }
    preloadCategoryIcons().then(() => {
      setIconsLoaded(true);
      if (!iconsSignaled.current && onIconsReady) {
        iconsSignaled.current = true;
        onIconsReady();
      }
    });
  }, [onIconsReady, iconsLoaded]);

  // Determine if we should show skeleton
  const isReady = !loading && displayCategories.length > 0 && iconsLoaded;

  // Update indicator
  useEffect(() => {
    if (!isReady) return;
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
  }, [selectedSlug, isReady]);

  const handleServiceClick = (serviceName: string, categorySlug: string, serviceSlug: string) => {
    localStorage.removeItem('chamby_form_job-booking');
    sessionStorage.removeItem('chamby_form_job-booking');
    navigate(`/book-job?category=${categorySlug}&service=${serviceSlug}&source=category&new=${Date.now()}`);
  };

  // Show skeleton until data + icons are fully ready
  if (!isReady) {
    return <CategoryTabsSkeleton />;
  }

  if (displayCategories.length === 0) return null;

  return (
    <div className="w-full mx-auto">
      <Tabs value={selectedSlug} onValueChange={setSelectedSlug} className="w-full">
        <div className="w-full relative z-30">
          <TabsList
            ref={tabsListRef}
            className="w-full h-auto bg-transparent p-0 py-4 pb-6 flex justify-start md:justify-center gap-6 sm:gap-8 md:gap-10 overflow-x-auto scrollbar-hide px-4 sm:px-4 relative z-30"
          >
            {displayCategories.map((cat) => (
              <div
                key={cat.slug}
                className="flex items-center justify-center overflow-visible relative z-10"
              >
                <TabsTrigger
                  value={cat.slug}
                  className={cn(
                    'flex flex-col items-center gap-1.5 md:gap-3 p-1 md:p-3',
                    'data-[state=active]:bg-transparent data-[state=active]:text-primary',
                    'text-muted-foreground bg-transparent',
                    'rounded-none h-auto w-[80px] min-w-[80px] sm:w-[90px] sm:min-w-[90px] md:w-[110px]',
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
                    />
                  </motion.div>
                  <span className="font-bold text-center leading-tight whitespace-normal text-xs sm:text-sm md:text-sm w-full h-[2.5em] flex items-center justify-center">
                    {cat.name}
                  </span>
                </TabsTrigger>
              </div>
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
                    {subs.filter((sub) => {
                      const lower = sub.name.toLowerCase();
                      return !lower.startsWith('otro') && !lower.startsWith('otra');
                    }).slice(0, 4).map((sub) => (
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
                          className="rounded-full px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-2.5 h-auto text-sm sm:text-base md:text-lg font-medium bg-background border-border hover:bg-primary/5 hover:text-primary hover:border-primary transition-all duration-200 whitespace-nowrap"
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
                        className="rounded-full px-4 py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-2.5 h-auto text-sm sm:text-base md:text-lg font-bold bg-primary/5 border-primary/30 hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-200 whitespace-nowrap gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        Otros trabajos de {cat.name}
                      </Button>
                    </motion.div>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Selecciona una categoría para ver servicios disponibles</p>
                )}
              </motion.div>

            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};
