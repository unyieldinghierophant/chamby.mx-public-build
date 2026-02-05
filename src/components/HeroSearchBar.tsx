import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock, ArrowRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

interface TaxonomySuggestion {
  serviceType: string;
  problem: string;
}

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
  ]
};

// Shorter examples for mobile to prevent text cutoff
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

export const HeroSearchBar: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<TaxonomySuggestion[]>([]);
  const [showPopular, setShowPopular] = useState(true);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Select appropriate examples based on screen size
  const typingExamples = isMobile ? TYPING_EXAMPLES_MOBILE : TYPING_EXAMPLES_DESKTOP;

  // Typing animation effect
  useEffect(() => {
    if (isFocused || query) return;

    let currentIndex = 0;
    let currentText = '';
    let isDeleting = false;
    let charIndex = 0;
    
    const typeSpeed = 100;
    const deleteSpeed = 50;
    const pauseDuration = 2000;

    const type = () => {
      const currentExample = typingExamples[currentIndex];
      
      if (!isDeleting) {
        currentText = currentExample.substring(0, charIndex + 1);
        charIndex++;
        
        setDynamicPlaceholder(currentText);
        
        if (charIndex === currentExample.length) {
          setTimeout(() => {
            isDeleting = true;
            setTimeout(type, deleteSpeed);
          }, pauseDuration);
          return;
        }
        
        setTimeout(type, typeSpeed);
      } else {
        currentText = currentExample.substring(0, charIndex - 1);
        charIndex--;
        
        setDynamicPlaceholder(currentText);
        
        if (charIndex === 0) {
          isDeleting = false;
          currentIndex = (currentIndex + 1) % typingExamples.length;
          setTimeout(type, 500);
          return;
        }
        
        setTimeout(type, deleteSpeed);
      }
    };

    const timeout = setTimeout(type, 1000);
    
    return () => clearTimeout(timeout);
  }, [isFocused, query, typingExamples]);

  // Search function with taxonomy matching
  const searchTaxonomy = (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowPopular(true);
      return;
    }

    setShowPopular(false);
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const matches: TaxonomySuggestion[] = [];

    Object.entries(SERVICE_TAXONOMY).forEach(([serviceType, problems]) => {
      problems.forEach((problem) => {
        if (problem.toLowerCase().includes(normalizedQuery)) {
          matches.push({ serviceType, problem });
        }
      });
    });

    setSuggestions(matches);
  };

  useEffect(() => {
    searchTaxonomy(query);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    if (value.trim() && !isOpen) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsFocused(true);
    setIsOpen(true);
    setShowPopular(!query.trim());
  };

  const handleInputBlur = () => {
    setIsFocused(false);
  };

  const handleCategoryClick = (serviceType: string) => {
    setQuery(serviceType);
    setIsOpen(false);
    navigate('/book-job');
  };

  const handleSuggestionClick = (suggestion: TaxonomySuggestion) => {
    setQuery(suggestion.problem);
    setIsOpen(false);
    navigate('/book-job');
  };

  const handleSearchSubmit = () => {
    setIsOpen(false);
    navigate('/book-job');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      {/* Rotating gradient border wrapper */}
      <div className="relative p-[3px] rounded-2xl shadow-floating overflow-hidden">
        {/* Rotating gradient border */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <div 
            className="absolute inset-[-200%] animate-rotate-gradient" 
            style={{
              background: 'conic-gradient(from 0deg, hsl(214 80% 41%), hsl(210 20% 85%), hsl(214 80% 55%), hsl(214 80% 30%), hsl(210 20% 85%), hsl(214 80% 41%))'
            }}
          />
        </div>
        
        {/* Search bar container - white background */}
        <div className="relative flex items-center h-14 bg-white rounded-xl">
          {/* Search icon */}
          <div className="absolute left-4 flex items-center pointer-events-none z-10">
            <Search className="h-5 w-5 text-primary" />
          </div>

          {/* Input field */}
          <Input
            ref={inputRef}
            type="text"
            placeholder={dynamicPlaceholder || "Buscar Servicio..."}
            value={query}
            onChange={handleInputChange}
            onFocus={handleInputFocus}
            onBlur={handleInputBlur}
            onKeyDown={handleKeyPress}
            className="h-full w-full pl-12 pr-16 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-base text-foreground rounded-xl placeholder:text-muted-foreground/70"
          />

          {/* Search/Arrow button */}
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="absolute right-2 h-10 w-10 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center transition-all hover:scale-105 shadow-md"
          >
            <ArrowRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-border max-h-80 overflow-y-auto z-50">
          {showPopular && (
            <div className="p-4">
              <h3 className="font-medium text-muted-foreground text-xs uppercase tracking-wide mb-3">
                Categorías Populares
              </h3>
              <div className="space-y-1">
                {Object.keys(SERVICE_TAXONOMY).map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent text-foreground text-sm transition-colors capitalize flex items-center gap-3"
                  >
                    <Clock className="w-4 h-4 text-muted-foreground" />
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
                      className="w-full text-left p-3 rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="font-medium text-foreground text-sm capitalize">{suggestion.problem}</div>
                      <div className="text-xs text-muted-foreground mt-1 capitalize">{suggestion.serviceType}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  <div className="text-sm mb-2">
                    No se encontraron coincidencias
                  </div>
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

export default HeroSearchBar;
