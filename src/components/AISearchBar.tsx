import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const PLACEHOLDER_EXAMPLES = [
  "Lavar mi carro",
  "Cortar el pasto",
  "Destapar mi baño",
  "Arreglar mi lavadora",
];

const SEARCH_SUGGESTIONS = [
  "Lavar mi carro",
  "Cortar el pasto",
  "Destapar mi baño",
  "Arreglar mi lavadora",
  "Quitar un árbol",
  "Instalar un ventilador",
  "Colgar una TV",
  "Armar muebles",
];

interface FilteredSuggestion {
  serviceType: string;
  problem: string;
}

export const AISearchBar = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<FilteredSuggestion[]>([]);
  const [showPopular, setShowPopular] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % PLACEHOLDER_EXAMPLES.length);
        setFade(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Filter suggestions based on query
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowPopular(true);
      return;
    }

    setShowPopular(false);
    const normalizedQuery = query.toLowerCase().trim();
    const matches = SEARCH_SUGGESTIONS
      .filter((s) => s.toLowerCase().includes(normalizedQuery))
      .map((s) => ({ serviceType: "", problem: s }));

    setSuggestions(matches.slice(0, 5));
  }, [query]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (e?: React.FormEvent, directQuery?: string) => {
    if (e) e.preventDefault();

    const searchQuery = directQuery || query;
    if (!searchQuery.trim()) {
      toast.error("Por favor escribe tu búsqueda");
      return;
    }

    setIsOpen(false);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-search-service", {
        body: { query: searchQuery.trim() },
      });

      if (error) throw error;

      console.log('AI Search Response:', data);

      if (data.confidence < 50) {
        toast.info("Búsqueda imprecisa - revisa los detalles", {
          description: `Detectamos: ${data.keywords_detected?.join(', ') || 'consulta general'}`
        });
      } else if (data.confidence < 70) {
        toast.success("Búsqueda encontrada", {
          description: `${data.service} en ${data.category}`
        });
      } else {
        toast.success("¡Servicio encontrado!", {
          description: `${data.service} - ${data.category}`
        });
      }

      navigate("/book-job", {
        state: {
          category: data.category,
          service: data.service,
          description: data.description,
          confidence: data.confidence,
          keywords: data.keywords_detected,
        },
      });
    } catch (error) {
      console.error("Error searching:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido";
      
      if (errorMessage.includes("clasificar")) {
        toast.error("No pudimos entender tu búsqueda", {
          description: "Intenta ser más específico o usa las categorías"
        });
      } else {
        toast.error("Error al buscar el servicio", {
          description: "Por favor intenta de nuevo"
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionClick = (text: string) => {
    setQuery(text);
    handleSearch(undefined, text);
  };

  return (
    <div ref={searchRef} className={className || "w-full max-w-none mx-auto"}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          {/* Pill-shaped search bar — soft glow, high radius */}
          <div className="relative flex items-center h-14 sm:h-16 bg-white dark:bg-card rounded-full shadow-[0_4px_24px_-4px_hsl(214_80%_41%/0.18)] ring-1 ring-black/[0.04] dark:ring-white/10 transition-shadow focus-within:shadow-[0_6px_32px_-4px_hsl(214_80%_41%/0.28)] focus-within:ring-primary/30">
            {/* Search icon */}
            <div className="absolute left-4 sm:left-5 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-muted-foreground" />
            </div>

            {/* Input */}
            <Input
              type="text"
              placeholder="Buscar servicio…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setIsOpen(true)}
              disabled={isLoading}
              className="h-full w-full pl-12 sm:pl-14 pr-16 sm:pr-20 text-base sm:text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full placeholder:text-muted-foreground/60"
              style={{ fontSize: '16px', lineHeight: 'normal', WebkitAppearance: 'none', transform: 'none' }}
            />

            {/* Action button — circle inside the pill */}
            <Button
              type="submit"
              disabled={isLoading}
              className="absolute right-2 h-10 w-10 sm:h-11 sm:w-11 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground p-0 shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </Button>
          </div>

          {/* Dropdown — search suggestions */}
          {isOpen && !isLoading && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-2xl shadow-floating border border-border max-h-80 overflow-y-auto z-[100] animate-fade-in">
              <div className="p-3 sm:p-4">
                {showPopular ? (
                  <>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Sugerencias
                    </h3>
                    <div className="space-y-0.5">
                      {SEARCH_SUGGESTIONS.map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent text-foreground transition-colors text-sm sm:text-base flex items-center gap-3"
                        >
                          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </>
                ) : suggestions.length > 0 ? (
                  <div className="space-y-0.5">
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.problem}-${i}`}
                        onClick={() => handleSuggestionClick(s.problem)}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent text-foreground transition-colors text-sm sm:text-base flex items-center gap-3"
                      >
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        {s.problem}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="py-3 text-center text-muted-foreground">
                    <div className="mb-2 text-sm">No se encontraron coincidencias</div>
                    <button
                      onClick={() => handleSearch()}
                      className="text-primary hover:text-primary/80 font-medium text-sm"
                    >
                      Buscar "{query}" con IA →
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
