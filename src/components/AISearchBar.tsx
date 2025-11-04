import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Loader2, Sparkles, Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const EXAMPLE_QUERIES = [
  "mi lavabo está goteando, necesito cambiar una batería...",
  "necesito pintar mi sala y cocina...",
  "tengo un enchufe que no funciona...",
  "quiero instalar un aire acondicionado...",
  "necesito reparar una gotera en el techo...",
  "mi jardín necesita mantenimiento...",
];

const SERVICE_TAXONOMY: Record<string, string[]> = {
  "fontanería": [
    "fuga de agua",
    "arreglar regadera",
    "destapar baño",
    "instalar boiler",
    "cambiar llave",
    "revisar presión de agua"
  ],
  "electricidad": [
    "cambiar enchufe",
    "instalar lámpara",
    "revisar cortocircuito",
    "colocar ventilador",
    "fallas eléctricas"
  ],
  "pintura": [
    "pintar casa",
    "pintar recámara",
    "retocar paredes",
    "pintar exterior"
  ],
  "trabajos generales": [
    "mover muebles",
    "colgar cuadros",
    "limpieza profunda",
    "armar muebles",
    "reparaciones menores"
  ],
  "carpintería": [
    "reparar puerta",
    "fabricar mueble",
    "ajustar clóset",
    "cambiar bisagras"
  ],
  "jardinería": [
    "cortar pasto",
    "podar árbol",
    "limpiar jardín",
    "instalar sistema de riego"
  ],
  "auto y lavado": [
    "lavado completo",
    "aspirado interior",
    "encerado",
    "cambio de batería"
  ]
};

interface TaxonomySuggestion {
  serviceType: string;
  problem: string;
}

export const AISearchBar = ({ className }: { className?: string }) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [fade, setFade] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<TaxonomySuggestion[]>([]);
  const [showPopular, setShowPopular] = useState(true);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      setFade(false);
      setTimeout(() => {
        setPlaceholderIndex((prev) => (prev + 1) % EXAMPLE_QUERIES.length);
        setFade(true);
      }, 300);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  // Search taxonomy for suggestions
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setShowPopular(true);
      return;
    }

    setShowPopular(false);
    const normalizedQuery = query.toLowerCase().trim();
    const matches: TaxonomySuggestion[] = [];

    Object.entries(SERVICE_TAXONOMY).forEach(([serviceType, problems]) => {
      problems.forEach((problem) => {
        if (problem.toLowerCase().includes(normalizedQuery)) {
          matches.push({ serviceType, problem });
        }
      });
    });

    setSuggestions(matches.slice(0, 5)); // Limit to 5 suggestions
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

      // Handle confidence levels
      if (data.confidence < 50) {
        // Low confidence - show warning but still proceed
        toast.info("Búsqueda imprecisa - revisa los detalles", {
          description: `Detectamos: ${data.keywords_detected?.join(', ') || 'consulta general'}`
        });
      } else if (data.confidence < 70) {
        // Medium confidence - subtle feedback
        toast.success("Búsqueda encontrada", {
          description: `${data.service} en ${data.category}`
        });
      } else {
        // High confidence - positive feedback
        toast.success("¡Servicio encontrado!", {
          description: `${data.service} - ${data.category}`
        });
      }

      // Navigate to book-job with the AI-interpreted service details
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
      
      // Better error messages
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

  const handleCategoryClick = (category: string) => {
    setQuery(category);
    handleSearch(undefined, category);
  };

  const handleSuggestionClick = (suggestion: TaxonomySuggestion) => {
    setQuery(suggestion.problem);
    handleSearch(undefined, suggestion.problem);
  };

  return (
    <div ref={searchRef} className={className || "w-full max-w-none mx-auto"}>
      <form onSubmit={handleSearch}>
        <div className="relative">
          {/* Icons container */}
          <div className="absolute left-2.5 sm:left-3 md:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5 text-primary" />
            {!isMobile && <Search className="w-5 h-5 text-muted-foreground" />}
          </div>

          {/* Input field */}
          <Input
            type="text"
            placeholder={
              isMobile 
                ? EXAMPLE_QUERIES[placeholderIndex].substring(0, 30) + "..." 
                : EXAMPLE_QUERIES[placeholderIndex]
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            disabled={isLoading}
            className={`pl-9 sm:pl-10 md:pl-12 pr-20 sm:pr-28 md:pr-36 h-11 sm:h-12 md:h-14 text-base sm:text-base md:text-base bg-card/95 backdrop-blur-sm border-white/20 shadow-soft hover:shadow-raised transition-all focus:shadow-glow rounded-full ${
              fade ? "placeholder:opacity-100" : "placeholder:opacity-0"
            } placeholder:transition-opacity placeholder:duration-300`}
            style={{ fontSize: '16px' }}
          />

          {/* Submit button */}
          <Button
            type="submit"
            disabled={isLoading}
            size={isMobile ? "sm" : "default"}
            className="absolute right-1 sm:right-1.5 md:right-2 top-1/2 -translate-y-1/2 bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant rounded-full px-3 sm:px-4"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
                {!isMobile && <span className="ml-2">Buscando...</span>}
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {!isMobile && <span className="ml-2">Buscar con IA</span>}
              </>
            )}
          </Button>

          {/* Autofill Dropdown - Positioned directly under input */}
          {isOpen && !isLoading && (
            <div className="absolute top-full left-0 right-0 mt-0.5 bg-card/95 backdrop-blur-sm rounded-2xl rounded-t-lg shadow-xl border border-white/20 border-t-white/10 max-h-80 overflow-y-auto z-50 animate-fade-in">
              {showPopular && (
                <div className="p-3 sm:p-4">
                  <h3 className="text-sm sm:text-base font-medium text-foreground mb-3">
                    Categorías Populares
                  </h3>
                  <div className="space-y-1">
                    {Object.keys(SERVICE_TAXONOMY).map((category) => (
                      <button
                        key={category}
                        onClick={() => handleCategoryClick(category)}
                        className={cn(
                          "w-full text-left px-3 py-2 sm:py-2.5 rounded-md hover:bg-accent text-foreground transition-colors capitalize text-sm sm:text-base",
                          "flex items-center gap-2"
                        )}
                      >
                        <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!showPopular && (
                <div className="p-2">
                  {suggestions.length > 0 ? (
                    <div className="space-y-1">
                      {suggestions.map((suggestion, index) => (
                        <button
                          key={`${suggestion.serviceType}-${suggestion.problem}-${index}`}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={cn(
                            "w-full text-left p-2.5 sm:p-3 rounded-md hover:bg-accent transition-colors text-sm sm:text-base"
                          )}
                        >
                          <div className="font-medium text-foreground capitalize">{suggestion.problem}</div>
                          <div className="text-xs sm:text-sm text-muted-foreground mt-1 capitalize">{suggestion.serviceType}</div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <div className="mb-2 text-sm sm:text-base">
                        No se encontraron coincidencias
                      </div>
                      <button 
                        onClick={() => handleSearch()}
                        className="text-primary hover:text-primary/80 font-medium text-sm"
                      >
                        Buscar "{query}" con IA →
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-[10px] sm:text-xs text-white/80 mt-2 ml-1 px-1">
          Describe lo que necesitas y nuestra IA te ayudará a encontrar el servicio correcto
        </p>
      </form>

      {/* Autofill Dropdown - Now removed from here */}
    </div>
  );
};
