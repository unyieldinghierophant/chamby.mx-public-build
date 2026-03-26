import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useServiceCatalog, ServiceCategory, ServiceSubcategory } from '@/hooks/useServiceCatalog';
import { startBooking } from '@/lib/booking';
import { createPortal } from 'react-dom';

interface SuggestionItem {
  subcategory: ServiceSubcategory;
  category: ServiceCategory;
}

const TYPING_EXAMPLES_MOBILE = [
  'Pintar pared',
  'Cortar pasto',
  'Armar cama',
  'Fuga de agua',
  'Instalar lamp',
];

const TYPING_EXAMPLES_DESKTOP = [
  'Arreglar fuga de agua',
  'Pintar mi recámara',
  'Instalar una lámpara',
  'Cortar el pasto',
  'Armar mis muebles',
];

export function CatalogSearchBar({ className }: { className?: string }) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { categories, subcategories, loading: catalogLoading } = useServiceCatalog();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const searchRef = useRef<HTMLDivElement>(null);
  const typingExamples = isMobile ? TYPING_EXAMPLES_MOBILE : TYPING_EXAMPLES_DESKTOP;

  // Position dropdown via portal
  const updateDropdownPosition = useCallback(() => {
    if (!searchRef.current) return;
    const rect = searchRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 8,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    updateDropdownPosition();
    const onScroll = () => updateDropdownPosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [isOpen, updateDropdownPosition]);

  // Typing animation
  useEffect(() => {
    if (isFocused || query) return;

    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const type = () => {
      const current = typingExamples[currentIndex];
      if (!isDeleting) {
        charIndex++;
        setDynamicPlaceholder(current.substring(0, charIndex));
        if (charIndex === current.length) {
          setTimeout(() => { isDeleting = true; setTimeout(type, 45); }, 2000);
          return;
        }
        setTimeout(type, 90);
      } else {
        charIndex--;
        setDynamicPlaceholder(current.substring(0, charIndex));
        if (charIndex === 0) {
          isDeleting = false;
          currentIndex = (currentIndex + 1) % typingExamples.length;
          setTimeout(type, 400);
          return;
        }
        setTimeout(type, 45);
      }
    };

    const timeout = setTimeout(type, 800);
    return () => clearTimeout(timeout);
  }, [isFocused, query, typingExamples]);

  // Build popular suggestions (shown on focus with no query)
  const popularSuggestions: SuggestionItem[] = (() => {
    if (catalogLoading || categories.length === 0) return [];
    const popular: SuggestionItem[] = [];
    for (const cat of categories) {
      const catSubs = subcategories.filter((s) => s.category_id === cat.id);
      // Take first 2 subcategories per category for variety
      catSubs.slice(0, 2).forEach((sub) => popular.push({ subcategory: sub, category: cat }));
    }
    return popular.slice(0, 8);
  })();

  // Autocomplete from catalog
  useEffect(() => {
    if (catalogLoading) return;

    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      return;
    }

    const q = query.toLowerCase().trim();
    const matches: SuggestionItem[] = [];

    for (const sub of subcategories) {
      if (
        sub.name.toLowerCase().includes(q) ||
        sub.slug.includes(q) ||
        (sub.description && sub.description.toLowerCase().includes(q))
      ) {
        const cat = categories.find((c) => c.id === sub.category_id);
        if (cat) matches.push({ subcategory: sub, category: cat });
      }
    }

    // Also match category names and show their first subcategories
    if (matches.length === 0) {
      for (const cat of categories) {
        if (cat.name.toLowerCase().includes(q) || cat.slug.includes(q)) {
          const catSubs = subcategories.filter((s) => s.category_id === cat.id).slice(0, 4);
          catSubs.forEach((sub) => matches.push({ subcategory: sub, category: cat }));
        }
      }
    }

    setSuggestions(matches.slice(0, 8));
  }, [query, categories, subcategories, catalogLoading]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSuggestionClick = (item: SuggestionItem) => {
    setQuery(item.subcategory.name);
    setIsOpen(false);
    navigate(`/book-job?category=${item.category.slug}&service=${item.subcategory.slug}&source=catalog_search&new=${Date.now()}`);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsOpen(false);

    // Try to find an exact match
    const q = query.toLowerCase().trim();
    const subMatch = subcategories.find(
      (s) => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
    );
    if (subMatch) {
      const cat = categories.find((c) => c.id === subMatch.category_id);
      if (cat) {
        navigate(`/book-job?category=${cat.slug}&service=${subMatch.slug}&source=catalog_search&new=${Date.now()}`);
        return;
      }
    }

    // No match — send to general with intent text
    startBooking(navigate, { intentText: query.trim(), serviceCategory: 'general', entrySource: 'catalog_search' });
  };

  return (
    <div ref={searchRef} className={className || 'w-full'}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          {/* Pill search bar */}
          <div className="relative flex items-center h-14 sm:h-16 bg-white dark:bg-card rounded-full shadow-[0_4px_24px_-4px_hsl(214_80%_41%/0.18)] ring-1 ring-black/[0.04] dark:ring-white/10 transition-shadow focus-within:shadow-[0_6px_32px_-4px_hsl(214_80%_41%/0.28)] focus-within:ring-primary/30">
            <Input
              type="text"
              placeholder={dynamicPlaceholder || '¿Qué necesitas?'}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setIsOpen(true);
              }}
              onFocus={() => {
                setIsFocused(true);
                setIsOpen(true);
              }}
              onBlur={() => setIsFocused(false)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') setIsOpen(false);
              }}
              className="h-full w-full pl-5 sm:pl-6 pr-16 sm:pr-20 text-base sm:text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full placeholder:text-muted-foreground/60"
              style={{ fontSize: '16px', lineHeight: 'normal', WebkitAppearance: 'none', transform: 'none' }}
            />
            <Button
              type="submit"
              className="absolute right-2 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground p-0 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Search className="w-5 h-5" />
            </Button>
          </div>

        </div>
      </form>

      {/* Portal-based dropdown to escape overflow-hidden */}
      {isOpen && createPortal(
        <div
          id="catalog-search-dropdown"
          style={dropdownStyle}
          className="rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border max-h-80 overflow-y-auto animate-fade-in bg-background"
        >
          <div className="p-2 sm:p-3">
            {/* Show popular services on focus with no query */}
            {(!query.trim() || query.length < 2) && popularSuggestions.length > 0 && (
              <>
                <p className="px-3 pt-1 pb-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Servicios populares
                </p>
                <div className="space-y-0.5">
                  {popularSuggestions.map((s) => (
                    <button
                      key={`pop-${s.category.id}-${s.subcategory.id}`}
                      onClick={() => handleSuggestionClick(s)}
                      className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent text-foreground transition-colors text-sm sm:text-base flex items-center gap-3"
                    >
                      <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="text-foreground">{s.subcategory.name}</span>
                        <span className="text-muted-foreground ml-2 text-xs">({s.category.name})</span>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* Show search results when typing */}
            {query.trim().length >= 2 && (
              <>
                {suggestions.length > 0 ? (
                  <div className="space-y-0.5">
                    {suggestions.map((s) => (
                      <button
                        key={`${s.category.id}-${s.subcategory.id}`}
                        onClick={() => handleSuggestionClick(s)}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent text-foreground transition-colors text-sm sm:text-base flex items-center gap-3"
                      >
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0">
                          <span className="text-foreground">{s.subcategory.name}</span>
                          <span className="text-muted-foreground ml-2 text-xs">({s.category.name})</span>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No se encontraron servicios
                  </div>
                )}
                <button
                  onClick={() => handleSubmit()}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl text-primary hover:bg-accent transition-colors text-sm font-medium flex items-center gap-3"
                >
                  <Search className="w-4 h-4 flex-shrink-0" />
                  Buscar "{query}" →
                </button>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
