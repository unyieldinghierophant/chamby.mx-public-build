import React, { useState, useEffect, useRef } from 'react';
import { Search, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface SearchResult {
  id: string;
  name: string;
  category: string;
  tags: string[];
  description?: string;
  price_from?: number;
  price_to?: number;
}

interface EnhancedSearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  onResultClick?: (result: SearchResult) => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

const POPULAR_CATEGORIES = [
  'Fontanería',
  'Electricista', 
  'Pintura',
  'Impermeabilización',
  'Albañilería',
  'Carpintería',
  'Otros'
];

const EnhancedSearchBar: React.FC<EnhancedSearchBarProps> = ({
  placeholder = "¿Qué servicio necesitas?",
  onSearch,
  onResultClick,
  className,
  size = 'md'
}) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showPopular, setShowPopular] = useState(true);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  // Search function with debouncing
  const searchServices = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      setShowPopular(true);
      return;
    }

    setIsLoading(true);
    setShowPopular(false);

    try {
      const response = await fetch(`https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/search-services?query=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpeWptamlic2hua2h3ZXd0a296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTg2NDQsImV4cCI6MjA3Mzg3NDY0NH0.V28ZMZ5SkjHNI6oJNyd3Nv7MlT0kKIvyqhsDWucWV7A`,
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVpeWptamlic2hua2h3ZXd0a296Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyOTg2NDQsImV4cCI6MjA3Mzg3NDY0NH0.V28ZMZ5SkjHNI6oJNyd3Nv7MlT0kKIvyqhsDWucWV7A',
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) throw new Error('Search request failed');
      
      const data = await response.json();
      setResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search effect
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchServices(query);
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
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
    setIsOpen(true);
    setShowPopular(!query.trim());
  };

  const handleCategoryClick = (category: string) => {
    setQuery(category);
    setIsOpen(false);
    onSearch?.(category);
  };

  const handleResultClick = (result: SearchResult) => {
    setQuery(result.name);
    setIsOpen(false);
    onResultClick?.(result);
  };

  const handleSearchSubmit = () => {
    if (query.trim()) {
      setIsOpen(false);
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
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyPress}
          className={cn(
            "pl-12 pr-4 bg-white/90 border-gray-300 rounded-2xl focus:ring-primary/50 focus:border-primary/50 backdrop-blur-sm placeholder:text-gray-500 text-gray-900",
            sizeClasses[size]
          )}
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
                {POPULAR_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleCategoryClick(category)}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md hover:bg-gray-100 text-gray-700 transition-colors",
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
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((result) => (
                    <button
                      key={result.id}
                      onClick={() => handleResultClick(result)}
                      className={cn(
                        "w-full text-left p-3 rounded-md hover:bg-gray-100 transition-colors",
                        dropdownSizeClasses[size]
                      )}
                    >
                      <div className="font-medium text-gray-900">{result.name}</div>
                      <div className="text-sm text-gray-600 mt-1">{result.category}</div>
                      {result.price_from && result.price_to && (
                        <div className="text-sm text-primary mt-1">
                          ${result.price_from} - ${result.price_to}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-gray-500">
                  <div className={cn("mb-2", dropdownSizeClasses[size])}>
                    No se encontraron coincidencias exactas
                  </div>
                  <button 
                    onClick={handleSearchSubmit}
                    className="text-primary hover:text-primary/80 font-medium"
                  >
                    Publicar solicitud de trabajo →
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