import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';

export const AISearchBar = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Por favor escribe tu búsqueda');
      return;
    }

    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-search-service', {
        body: { query: query.trim() }
      });

      if (error) throw error;

      // Navigate to book-job with the AI-interpreted service details
      navigate('/book-job', {
        state: {
          category: data.category,
          service: data.service,
          description: data.description
        }
      });
    } catch (error) {
      console.error('Error searching:', error);
      toast.error('Error al buscar el servicio. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-[70%] mx-auto">
      <div className="relative">
        <div className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 flex items-center gap-1 md:gap-2">
          <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
          {!isMobile && <Search className="w-5 h-5 text-muted-foreground" />}
        </div>
        <Input
          type="text"
          placeholder={isMobile ? "Ej: mi lavabo gotea..." : "Ej: mi lavabo está goteando, necesito cambiar una batería..."}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="pl-10 md:pl-16 pr-12 md:pr-28 h-12 md:h-14 text-sm md:text-base bg-card/95 backdrop-blur-sm border-white/20 shadow-soft hover:shadow-raised transition-all focus:shadow-glow rounded-full"
        />
        <Button
          type="submit"
          disabled={isLoading}
          size={isMobile ? "sm" : "default"}
          className="absolute right-1 md:right-2 top-1/2 -translate-y-1/2 bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant rounded-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {!isMobile && <span className="ml-2">Buscando...</span>}
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              {!isMobile && <span className="ml-2">Buscar con IA</span>}
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground mt-2 ml-1">
        Describe lo que necesitas y nuestra IA te ayudará a encontrar el servicio correcto
      </p>
    </form>
  );
};
