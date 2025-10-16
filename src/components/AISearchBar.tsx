import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AISearchBar = () => {
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

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
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <Search className="w-5 h-5 text-muted-foreground" />
        </div>
        <Input
          type="text"
          placeholder="Ej: mi lavabo está goteando, necesito cambiar una batería..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={isLoading}
          className="pl-20 pr-32 h-14 text-base bg-card/95 backdrop-blur-sm border-white/20 shadow-soft hover:shadow-raised transition-all focus:shadow-glow"
        />
        <Button
          type="submit"
          disabled={isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Buscando...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Buscar con IA
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
