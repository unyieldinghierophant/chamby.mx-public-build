import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSearchSuggestions } from "@/utils/searchSuggestions";

const TYPING_EXAMPLES = [
  "Lavar mi carro",
  "Cortar el pasto",
  "Destapar mi baño",
  "Arreglar mi lavadora",
  "Colgar una TV",
  "Armar muebles",
];

export const AISearchBar = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ text: string; category: string }[]>([]);
  const navigate = useNavigate();
  const searchRef = useRef<HTMLDivElement>(null);

  // Typing animation for placeholder
  useEffect(() => {
    if (isFocused || query) return;

    let currentIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    const typeSpeed = 90;
    const deleteSpeed = 45;
    const pauseDuration = 2000;

    const type = () => {
      const current = TYPING_EXAMPLES[currentIndex];
      if (!isDeleting) {
        charIndex++;
        setDynamicPlaceholder(current.substring(0, charIndex));
        if (charIndex === current.length) {
          setTimeout(() => { isDeleting = true; setTimeout(type, deleteSpeed); }, pauseDuration);
          return;
        }
        setTimeout(type, typeSpeed);
      } else {
        charIndex--;
        setDynamicPlaceholder(current.substring(0, charIndex));
        if (charIndex === 0) {
          isDeleting = false;
          currentIndex = (currentIndex + 1) % TYPING_EXAMPLES.length;
          setTimeout(type, 400);
          return;
        }
        setTimeout(type, deleteSpeed);
      }
    };

    const timeout = setTimeout(type, 800);
    return () => clearTimeout(timeout);
  }, [isFocused, query]);

  // Smart suggestion matching
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const matches = getSearchSuggestions(query, 8);
    setSuggestions(matches);
    setIsOpen(matches.length > 0);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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

      console.log("AI Search Response:", data);

      if (data.confidence < 50) {
        toast.info("Búsqueda imprecisa - revisa los detalles", {
          description: `Detectamos: ${data.keywords_detected?.join(", ") || "consulta general"}`,
        });
      } else if (data.confidence < 70) {
        toast.success("Búsqueda encontrada", {
          description: `${data.service} en ${data.category}`,
        });
      } else {
        toast.success("¡Servicio encontrado!", {
          description: `${data.service} - ${data.category}`,
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
          description: "Intenta ser más específico o usa las categorías",
        });
      } else {
        toast.error("Error al buscar el servicio", {
          description: "Por favor intenta de nuevo",
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
          {/* Pill-shaped search bar */}
          <div className="relative flex items-center h-14 sm:h-16 bg-white dark:bg-card rounded-full shadow-[0_4px_24px_-4px_hsl(214_80%_41%/0.18)] ring-1 ring-black/[0.04] dark:ring-white/10 transition-shadow focus-within:shadow-[0_6px_32px_-4px_hsl(214_80%_41%/0.28)] focus-within:ring-primary/30">
            {/* Input — no left icon */}
            <Input
              type="text"
              placeholder={dynamicPlaceholder || "¿Qué necesitas?"}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (!e.target.value.trim()) setIsOpen(false);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              disabled={isLoading}
              className="h-full w-full pl-5 sm:pl-6 pr-16 sm:pr-20 text-base sm:text-lg border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full placeholder:text-muted-foreground/60"
              style={{ fontSize: "16px", lineHeight: "normal", WebkitAppearance: "none", transform: "none" }}
            />

            {/* Right-side search button */}
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

          {/* Autosuggest dropdown — solid white, no transparency */}
          {isOpen && !isLoading && (
            <div className="absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-border max-h-80 overflow-y-auto z-[9999] animate-fade-in" style={{ backgroundColor: 'white' }}>
              <div className="p-2 sm:p-3">
                {suggestions.length > 0 && (
                  <div className="space-y-0.5">
                    {suggestions.map((s, i) => (
                      <button
                        key={`${s.text}-${i}`}
                        onClick={() => handleSuggestionClick(s.text)}
                        className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-accent text-foreground transition-colors text-sm sm:text-base flex items-center gap-3"
                      >
                        <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-foreground">{s.text}</span>
                      </button>
                    ))}
                  </div>
                )}
                <button
                  onClick={() => handleSearch()}
                  className="w-full mt-1 px-3 py-2.5 rounded-xl text-primary hover:bg-accent transition-colors text-sm font-medium flex items-center gap-3"
                >
                  <Search className="w-4 h-4 flex-shrink-0" />
                  Buscar "{query}" con IA →
                </button>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
};
