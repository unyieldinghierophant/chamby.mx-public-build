import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';
import { useServiceCatalog, ServiceCategory, ServiceSubcategory } from '@/hooks/useServiceCatalog';

interface SuggestionItem {
  subcategory: ServiceSubcategory;
  category: ServiceCategory;
}

const TYPING_EXAMPLES_MOBILE = [
  'Pintar pared',
  'Cortar pasto',
  'Armar cama',
  'Fuga de agua',
  'Mover muebles',
];

const TYPING_EXAMPLES_DESKTOP = [
  'Arreglar fuga de agua',
  'Pintar mi recámara',
  'Armar mi cama',
  'Instalar una lámpara',
  'Cortar el pasto',
];

export const HeaderSearchBar: React.FC = () => {
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

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleCategoryClick = (cat: ServiceCategory) => {
    setQuery(cat.name);
    setIsOpen(false);
    navigate(`/book-job?category=${cat.slug}&source=header_search&new=${Date.now()}`);
  };

  const handleSuggestionClick = (item: SuggestionItem) => {
    setQuery(item.subcategory.name);
    setIsOpen(false);
    navigate(`/book-job?category=${item.category.slug}&service=${item.subcategory.slug}&source=header_search&new=${Date.now()}`);
  };

  const handleSearchSubmit = () => {
    if (!query.trim()) return;
    setIsOpen(false);

    const q = query.toLowerCase().trim();
    const subMatch = subcategories.find(
      (s) => s.name.toLowerCase().includes(q) || (s.description && s.description.toLowerCase().includes(q))
    );
    if (subMatch) {
      const cat = categories.find((c) => c.id === subMatch.category_id);
      if (cat) {
        navigate(`/book-job?category=${cat.slug}&service=${subMatch.slug}&source=header_search&new=${Date.now()}`);
        return;
      }
    }
    navigate(`/book-job?category=general&intent=${encodeURIComponent(query.trim())}&source=header_search&new=${Date.now()}`);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearchSubmit();
    else if (e.key === 'Escape') setIsOpen(false);
  };

  return (
    <div ref={searchRef} className="relative w-64 xl:w-80">
      <div className="relative p-[2px] rounded-full bg-gradient-button">
        <div className="flex items-center h-10 bg-background rounded-full">
          <div className="absolute left-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-muted-foreground" />
          </div>
          <Input
            ref={inputRef}
            type="text"
            placeholder={dynamicPlaceholder || 'Buscar servicio...'}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              if (e.target.value.trim() && !isOpen) setIsOpen(true);
            }}
            onFocus={() => { setIsFocused(true); setIsOpen(true); setShowPopular(!query.trim()); }}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyPress}
            className="h-full w-full pl-9 pr-10 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm rounded-full"
          />
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="absolute right-1 h-8 w-8 rounded-full bg-gradient-button hover:opacity-90 text-primary-foreground flex items-center justify-center transition-opacity"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background rounded-lg shadow-lg border border-border max-h-80 overflow-y-auto z-50">
          {showPopular && categories.length > 0 && (
            <div className="p-3">
              <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2">
                Categorías
              </h3>
              <div className="space-y-0.5">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategoryClick(cat)}
                    className="w-full text-left px-2 py-1.5 rounded-md hover:bg-accent text-foreground text-sm transition-colors flex items-center gap-2"
                  >
                    <Clock className="w-3.5 h-3.5 text-muted-foreground" />
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
                      className="w-full text-left p-2 rounded-md hover:bg-accent transition-colors"
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
      )}
    </div>
  );
};

export default HeaderSearchBar;
