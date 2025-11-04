import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface TaxonomySuggestion {
  serviceType: string;
  problem: string;
}

interface EnhancedSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
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

const TYPING_EXAMPLES = [
  'Arreglar mi lavadora',
  'Pintar mi pared',
  'Armar mi cama',
  'Ayudarme a mover muebles',
  'Lavar mi auto'
];

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  placeholder = "¿Qué servicio necesitas?",
  onSearch,
  className,
  size = 'md'
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<TaxonomySuggestion[]>([]);
  const [showPopular, setShowPopular] = useState(true);
  const [dynamicPlaceholder, setDynamicPlaceholder] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
      const currentExample = TYPING_EXAMPLES[currentIndex];
      
      if (!isDeleting) {
        // Typing
        currentText = currentExample.substring(0, charIndex + 1);
        charIndex++;
        
        setDynamicPlaceholder(currentText);
        
        if (charIndex === currentExample.length) {
          // Finished typing, pause then start deleting
          setTimeout(() => {
            isDeleting = true;
            setTimeout(type, deleteSpeed);
          }, pauseDuration);
          return;
        }
        
        setTimeout(type, typeSpeed);
      } else {
        // Deleting
        currentText = currentExample.substring(0, charIndex - 1);
        charIndex--;
        
        setDynamicPlaceholder(currentText);
        
        if (charIndex === 0) {
          // Finished deleting, move to next example
          isDeleting = false;
          currentIndex = (currentIndex + 1) % TYPING_EXAMPLES.length;
          setTimeout(type, 500);
          return;
        }
        
        setTimeout(type, deleteSpeed);
      }
    };

    const timeout = setTimeout(type, 1000);
    
    return () => clearTimeout(timeout);
  }, [isFocused, query]);

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

    // Search through taxonomy
    Object.entries(SERVICE_TAXONOMY).forEach(([serviceType, problems]) => {
      problems.forEach((problem) => {
        // Check for partial match
        if (problem.toLowerCase().includes(normalizedQuery)) {
          matches.push({ serviceType, problem });
        }
      });
    });

    setSuggestions(matches);
  };

  // Search effect
  useEffect(() => {
    searchTaxonomy(query);
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
    if (query.trim()) {
      setIsOpen(false);
      navigate('/book-job');
      onSearch?.(query.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const sizeClasses = {
    sm: 'h-10 text-sm',
    md: 'h-12 text-base', 
    lg: 'h-16 text-lg'
  };

  const dropdownSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  return (
    <div ref={searchRef} className={cn("relative w-full", className)}>
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          placeholder={dynamicPlaceholder || placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          onKeyDown={handleKeyPress}
          className={cn(
            "pl-12 pr-4 bg-white/90 border-gray-300 rounded-2xl focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm placeholder:text-[#999] text-gray-900",
            sizeClasses[size]
          )}
          style={{ fontSize: '16px', lineHeight: 'normal' }}
        />
        <Search 
          className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 cursor-pointer" 
          onClick={handleSearchSubmit}
        />
      </div>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto z-50">
          {showPopular && (
            <div className="p-4">
              <h3 className={cn("font-medium text-gray-700 mb-3", dropdownSizeClasses[size])}>
                Categorías Populares
              </h3>
              <div className="space-y-1">
                {Object.keys(SERVICE_TAXONOMY).map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors capitalize",
                      dropdownSizeClasses[size]
                    )}
                  >
                    <Clock className="inline-block w-4 h-4 mr-3 text-gray-400" />
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
                        "w-full text-left p-3 rounded-md hover:bg-gray-100 transition-colors",
                        dropdownSizeClasses[size]
                      )}
                    >
                      <div className="font-medium text-gray-900 capitalize">{suggestion.problem}</div>
                      <div className="text-sm text-gray-600 mt-1 capitalize">{suggestion.serviceType}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <div className={cn("mb-2", dropdownSizeClasses[size])}>
                    No se encontraron coincidencias
                  </div>
                  <button 
                    onClick={handleSearchSubmit}
                    className="text-primary hover:text-primary/80 font-medium"
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

export default EnhancedSearchBar;