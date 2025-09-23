import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModernButton } from "@/components/ui/modern-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Heart, 
  Star, 
  MapPin, 
  Calendar,
  Trash2 
} from "lucide-react";

const MobileFavorites = () => {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState([
    {
      id: 1,
      name: "María González",
      service: "Limpieza del hogar",
      photo: "/placeholder.svg",
      rating: 4.9,
      reviews: 156,
      distance: "2.3 km",
      price: "$350/hora",
      available: true,
      verified: true,
      badges: ["Top Rated", "Background Check"]
    },
    {
      id: 2,
      name: "Carlos Hernández", 
      service: "Reparaciones eléctricas",
      photo: "/placeholder.svg",
      rating: 4.8,
      reviews: 203,
      distance: "1.8 km",
      price: "$450/hora",
      available: true,
      verified: true,
      badges: ["Certified", "Insurance"]
    },
    {
      id: 3,
      name: "Ana Martínez",
      service: "Jardinería y paisajismo",
      photo: "/placeholder.svg",
      rating: 4.7,
      reviews: 89,
      distance: "3.1 km",
      price: "$320/hora",
      available: false,
      verified: true,
      badges: ["Eco Friendly", "Licensed"]
    }
  ]);

  const handleRemoveFavorite = (id: number) => {
    setFavorites(prev => prev.filter(fav => fav.id !== id));
  };

  const FavoriteCard = ({ provider }: { provider: any }) => (
    <Card className="bg-gradient-card shadow-raised border-0 mb-4">
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="relative">
            <Avatar className="h-16 w-16 border-2 border-white/50">
              <AvatarImage src={provider.photo} />
              <AvatarFallback>{provider.name.charAt(0)}</AvatarFallback>
            </Avatar>
            {provider.verified && (
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-gradient-button rounded-full flex items-center justify-center">
                <Heart className="h-3 w-3 text-primary-foreground fill-current" />
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {provider.name}
                </h3>
                <p className="text-muted-foreground text-sm truncate">
                  {provider.service}
                </p>
              </div>
              <button
                onClick={() => handleRemoveFavorite(provider.id)}
                className="p-1 text-muted-foreground hover:text-destructive transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center space-x-4 mb-3 text-xs text-muted-foreground">
              <div className="flex items-center space-x-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span>{provider.rating}</span>
                <span>({provider.reviews})</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-3 w-3" />
                <span>{provider.distance}</span>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1 mb-3">
              {provider.badges.slice(0, 2).map((badge: string, index: number) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-gradient-glass border-primary/20 text-primary text-xs px-2 py-0"
                >
                  {badge}
                </Badge>
              ))}
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <span className="font-bold text-primary text-sm">{provider.price}</span>
                {provider.available ? (
                  <Badge className="bg-green-100 text-green-700 text-xs ml-2">
                    Disponible
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs ml-2">
                    No disponible
                  </Badge>
                )}
              </div>
              <ModernButton variant="primary" size="sm" className="h-8 px-3 text-xs">
                <Calendar className="mr-1 h-3 w-3" />
                Contratar
              </ModernButton>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center pb-20">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-4">Inicia sesión para ver tus favoritos</h2>
          <ModernButton variant="primary" onClick={() => window.location.href = "/auth"}>
            Iniciar Sesión
          </ModernButton>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main pb-20">
      {/* Header */}
      <div className="bg-gradient-glass backdrop-blur-glass border-b border-white/20 sticky top-0 z-40">
        <div className="p-4">
          <h1 className="text-xl font-bold text-foreground">Mis Favoritos</h1>
          <p className="text-sm text-muted-foreground">
            {favorites.length} proveedor{favorites.length !== 1 ? "es" : ""} guardado{favorites.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {favorites.length > 0 ? (
          <div className="space-y-4">
            {favorites.map((provider) => (
              <FavoriteCard key={provider.id} provider={provider} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No tienes favoritos aún
            </h3>
            <p className="text-muted-foreground mb-6 px-8">
              Explora proveedores y guarda tus preferidos para contratarlos rápidamente
            </p>
            <ModernButton 
              variant="primary" 
              onClick={() => window.location.href = "/user-landing"}
            >
              Explorar Servicios
            </ModernButton>
          </div>
        )}
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default MobileFavorites;