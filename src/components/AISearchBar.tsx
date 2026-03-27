import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useServiceCatalog, ServiceCategory, ServiceSubcategory } from "@/hooks/useServiceCatalog";

const TYPING_EXAMPLES = [
  "Lavar mi carro",
  "Cortar el pasto",
  "Destapar mi baño",
  "Arreglar mi lavadora",
  "Colgar una TV",
  "Armar muebles",
];

const DEFAULT_CATEGORY_SLUGS = ['plomeria', 'electricidad', 'pintura', 'jardineria', 'general'];

interface GroupedResult {
  category: ServiceCategory;
  subcategories: ServiceSubcategory[];
}

function normalize(str: string): string {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

export const AISearchBar = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState("");
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showDefaults, setShowDefaults] = useState(false);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);
  const { categories, subcategories } = useServiceCatalog();

  const defaultCategories = DEFAULT_CATEGORY_SLUGS
    .map((slug) => categories.find((c) => c.slug === slug))
    .filter(Boolean);

  // Typing animation
  useEffect(() => {
    if (isFocused || query) return;
    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;

    const type = () => {
      const current = TYPING_EXAMPLES[currentIndex];
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
          currentIndex = (currentIndex + 1) % TYPING_EXAMPLES.length;
          setTimeout(type, 400);
          return;
        }
        setTimeout(type, 45);
      }
    };

    const timeout = setTimeout(type, 800);
    return () => clearTimeout(timeout);
  }, [isFocused, query]);

  // Local catalog search
  const grouped = useMemo<GroupedResult[]>(() => {
    if (!query.trim() || query.length < 2) return [];
    const q = normalize(query);

    const matchingSubs = subcategories.filter((sub) => {
      const n = normalize(sub.name);
      const d = sub.description ? normalize(sub.description) : "";
      const s = normalize(sub.slug);
      return n.includes(q) || d.includes(q) || s.includes(q);
    });

    // Also match by category name and pull its subs
    if (matchingSubs.length === 0) {
      const matchingCats = categories.filter((cat) => {
        const n = normalize(cat.name);
        const d = cat.description ? normalize(cat.description) : "";
        return n.includes(q) || d.includes(q);
      });
      for (const cat of matchingCats) {
        const subs = subcategories.filter((s) => s.category_id === cat.id).slice(0, 4);
        if (subs.length > 0) matchingSubs.push(...subs);
      }
    }

    // Group by category
    const map = new Map<string, { category: ServiceCategory; subcategories: ServiceSubcategory[] }>();
    for (const sub of matchingSubs) {
      const cat = categories.find((c) => c.id === sub.category_id);
      if (!cat) continue;
      if (!map.has(cat.id)) map.set(cat.id, { category: cat, subcategories: [] });
      const group = map.get(cat.id)!;
      if (group.subcategories.length < 4) group.subcategories.push(sub);
    }

    return Array.from(map.values());
  }, [query, categories, subcategories]);

  const hasResults = grouped.length > 0;

  // Update dropdown state when query changes
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setIsOpen(false);
      if (isFocused) setShowDefaults(true);
      return;
    }
    setShowDefaults(false);
    setIsOpen(true);
  }, [query, isFocused]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setShowDefaults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubcategoryClick = (cat: ServiceCategory, sub: ServiceSubcategory) => {
    setQuery(sub.name);
    setIsOpen(false);
    navigate(`/book-job?category=${cat.slug}&service=${sub.slug}&source=search&new=${Date.now()}`);
  };

  const handleFallback = () => {
    setIsOpen(false);
    navigate(`/book-job?category=general&service=otro&intent=${encodeURIComponent(query.trim())}&source=search&new=${Date.now()}`);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    // If there are results, navigate to the first one
    if (grouped.length > 0) {
      const first = grouped[0];
      const sub = first.subcategories[0];
      handleSubcategoryClick(first.category, sub);
      return;
    }

    // No results — fallback
    handleFallback();
  };

  return (
    <div ref={searchRef} className={`relative ${className || "w-full max-w-none mx-auto"}`}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <div className="relative flex items-center h-14 sm:h-16 bg-white dark:bg-card rounded-full shadow-[0_4px_24px_-4px_hsl(214_80%_41%/0.18)] ring-1 ring-black/[0.04] dark:ring-white/10 transition-shadow focus-within:shadow-[0_6px_32px_-4px_hsl(214_80%_41%/0.28)] focus-within:ring-primary/30">
            <Input
              type="search"
              autoComplete="off"
              placeholder={dynamicPlaceholder || "¿Qué necesitas?"}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value.trim()) setIsOpen(false);
              }}
              onFocus={() => {
                setIsFocused(true);
                if (!query.trim()) setShowDefaults(true);
                window.dispatchEvent(new CustomEvent('search-focus', { detail: true }));
              }}
              onBlur={() => {
                setIsFocused(false);
                window.dispatchEvent(new CustomEvent('search-focus', { detail: false }));
              }}
              className="h-full w-full pl-5 sm:pl-6 pr-16 sm:pr-20 text-base sm:text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full placeholder:text-muted-foreground/60"
              style={{ fontSize: "16px", lineHeight: "normal", WebkitAppearance: "none" }}
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

      {/* Dropdown */}
      {(showDefaults || isOpen) && (
        <div
          className="absolute left-0 right-0 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border max-h-80 overflow-y-auto animate-fade-in bg-background"
          style={{ top: 'calc(100% + 8px)', zIndex: 9999, overscrollBehavior: 'contain', WebkitOverflowScrolling: 'touch' }}
        >
          {/* Default categories when focused with empty query */}
          {showDefaults && !isOpen && defaultCategories.length > 0 && (
            <div className="p-2 sm:p-3">
              <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-2 px-3">
                Servicios populares
              </h3>
              <div className="space-y-0.5">
                {defaultCategories.map((cat) => cat && (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setShowDefaults(false);
                      setIsOpen(false);
                      navigate(`/book-job?category=${cat.slug}&source=hero_search&new=${Date.now()}`);
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent text-foreground transition-colors text-sm sm:text-base flex items-center gap-3"
                  >
                    {cat.icon && <span className="text-base">{cat.icon}</span>}
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search results grouped by category */}
          {isOpen && (
            <div className="p-2 sm:p-3">
              {hasResults ? (
                <div className="space-y-3">
                  {grouped.map((group) => (
                    <div key={group.category.id}>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-3 mb-1">
                        {group.category.name}
                      </h4>
                      <div className="space-y-0.5">
                        {group.subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => handleSubcategoryClick(group.category, sub)}
                            className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent text-foreground transition-colors text-sm sm:text-base flex items-center gap-3"
                          >
                            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            <span>{sub.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={handleFallback}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent text-foreground transition-colors text-sm sm:text-base flex items-center gap-3"
                >
                  <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span>Otro servicio — continuar</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
