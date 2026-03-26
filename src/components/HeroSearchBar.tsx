import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, ArrowRight, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { startBooking } from '@/lib/booking';
import { useServiceCatalog, ServiceCategory, ServiceSubcategory } from '@/hooks/useServiceCatalog';

// 5 default suggestions shown on focus (before typing)
const DEFAULT_SUGGESTION_SLUGS = [
  'plomeria',
  'electricidad',
  'pintura',
  'jardineria',
  'general',
];

const TYPING_EXAMPLES_MOBILE = [
  'Pintar pared',
  'Armar cama',
  'Cortar pasto',
  'Lavar auto',
  'Mover muebles'
];

const TYPING_EXAMPLES_DESKTOP = [
  'Arreglar mi lavadora',
  'Pintar mi pared',
  'Armar mi cama',
  'Ayudarme a mover',
  'Lavar mi auto'
];

interface SuggestionItem {
  subcategory: ServiceSubcategory;
  category: ServiceCategory;
}

export const HeroSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { categories, subcategories } = useServiceCatalog();

  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [showPopular, setShowPopular] = useState(true);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingExamples = isMobile ? TYPING_EXAMPLES_MOBILE : TYPING_EXAMPLES_DESKTOP;

  // Build default suggestions from catalog categories
  const defaultSuggestions: ServiceCategory[] = DEFAULT_SUGGESTION_SLUGS
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean) as ServiceCategory[];


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
          setTimeout(() => { isDeleting = true; setTimeout(type, 50); }, 2000);
          return;
        }
        setTimeout(type, 100);
      } else {
        charIndex--;
        setDynamicPlaceholder(current.substring(0, charIndex));
        if (charIndex === 0) {
          isDeleting = false;
          currentIndex = (currentIndex + 1) % typingExamples.length;
          setTimeout(type, 500);
          return;
        }
        setTimeout(type, 50);
      }
    };

    const timeout = setTimeout(type, 1000);
    return () => clearTimeout(timeout);
  }, [isFocused, query, typingExamples]);

  // Autocomplete from catalog
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowPopular(true);
      return;
    }
    setShowPopular(false);
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

    if (matches.length === 0) {
      for (const cat of categories) {
        if (cat.name.toLowerCase().includes(q) || cat.slug.includes(q)) {
          const subs = subcategories.filter((s) => s.category_id === cat.id).slice(0, 4);
          subs.forEach((sub) => matches.push({ subcategory: sub, category: cat }));
        }
      }
    }

    setSuggestions(matches.slice(0, 8));
  }, [query, categories, subcategories]);

  // Click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCategoryClick = (cat: ServiceCategory) => {
    setQuery(cat.name);
    setIsOpen(false);
    navigate(`/book-job?category=${cat.slug}&source=hero_search&new=${Date.now()}`);
  };

  const handleSuggestionClick = (item: SuggestionItem) => {
    setQuery(item.subcategory.name);
    setIsOpen(false);
    navigate(`/book-job?category=${item.category.slug}&service=${item.subcategory.slug}&source=hero_search&new=${Date.now()}`);
  };

  const handleSearchSubmit = () => {
    if (!query.trim()) {
      startBooking(navigate, { entrySource: 'hero_search' });
      return;
    }
    setIsOpen(false);

    const q = query.toLowerCase().trim();
    const subMatch = subcategories.find(
      (s) => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
    );
    if (subMatch) {
      const cat = categories.find((c) => c.id === subMatch.category_id);
      if (cat) {
        navigate(`/book-job?category=${cat.slug}&service=${subMatch.slug}&source=hero_search&new=${Date.now()}`);
        return;
      }
    }
    navigate(`/book-job?category=general&intent=${encodeURIComponent(query.trim())}&source=hero_search&new=${Date.now()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchSubmit();
    else if (e.key === 'Escape') setIsOpen(false);
  };

  const dropdown = isOpen && (
    <div
      className="absolute top-full left-0 right-0 mt-2 bg-background rounded-xl shadow-lg border border-border max-h-60 overflow-y-auto animate-fade-in z-50"
    >
      {showPopular && defaultSuggestions.length > 0 && (
        <div className="p-3">
          <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" />
            Servicios populares
          </h3>
          <div className="space-y-0.5">
            {defaultSuggestions.map((cat) => (
              <button
                key={cat.id}
                onClick={() => handleCategoryClick(cat)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-foreground text-sm transition-colors flex items-center gap-3"
              >
                {cat.icon && <span className="text-base">{cat.icon}</span>}
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {!showPopular && (
        <div className="p-2">
          {suggestions.length > 0 ? (
            <div className="space-y-0.5">
              {suggestions.map((s) => (
                <button
                  key={`${s.category.id}-${s.subcategory.id}`}
                  onClick={() => handleSuggestionClick(s)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="font-medium text-foreground text-sm">{s.subcategory.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{s.category.name}</div>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-3 text-center text-muted-foreground">
              <div className="text-sm mb-2">No se encontraron coincidencias</div>
              <button
                onClick={handleSearchSubmit}
                className="text-primary hover:text-primary/80 font-medium text-sm"
              >
                Buscar "{query}" →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Rotating gradient border wrapper */}
      <div className="relative p-[3px] rounded-2xl shadow-floating overflow-hidden">
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div
            className="absolute inset-[-200%] animate-rotate-gradient"
            style={{
              background: 'conic-gradient(from 0deg, hsl(214 80% 41%), hsl(210 20% 85%), hsl(214 80% 55%), hsl(214 80% 30%), hsl(210 20% 85%), hsl(214 80% 41%))'
            }}
          />
        </div>

        <div className="relative flex items-center h-14 bg-white rounded-xl">
          <div className="absolute left-4 flex items-center pointer-events-none z-10">
            <Search className="h-5 w-5 text-primary" />
          </div>

          <Input
            ref={inputRef}
            type="search"
            name="hero-search-query"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder={dynamicPlaceholder || "Buscar Servicio..."}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim() && !isOpen) setIsOpen(true);
            }}
            onFocus={() => { setIsFocused(true); setIsOpen(true); setShowPopular(!query.trim()); }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyPress}
            className="h-full w-full pl-12 pr-16 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-foreground rounded-xl placeholder:text-muted-foreground/70 [&::-webkit-search-decoration]:hidden [&::-webkit-search-cancel-button]:hidden"
          />

          <button
            type="button"
            onClick={handleSearchSubmit}
            className="absolute right-2 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all hover:scale-105 shadow-md"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {dropdown}
    </div>
  );
};

export default HeroSearchBar;
