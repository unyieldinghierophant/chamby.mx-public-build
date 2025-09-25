import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MapPin, Star, Clock, Shield, Filter, Heart, Calendar } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MobileBottomNav from "@/components/MobileBottomNav";
import EnhancedSearchBar from "@/components/EnhancedSearchBar";

const SearchPage = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [favorites, setFavorites] = useState<number[]>([]);
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    if (query.trim()) {
      navigate(`/jobs?q=${encodeURIComponent(query)}`);
    }
  };

  const handleResultClick = (result: any) => {
    navigate(`/search?category=${encodeURIComponent(result.category)}&service=${encodeURIComponent(result.name)}`);
  };

  const toggleFavorite = (id: number) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    );
  };

  const categories = [
    { id: "all", name: "Todos", count: 245 },
    { id: "cleaning", name: "Limpieza", count: 89 },
    { id: "repairs", name: "Reparaciones", count: 67 },
    { id: "garden", name: "Jardinería", count: 43 },
    { id: "painting", name: "Pintura", count: 28 },
    { id: "installation", name: "Instalación", count: 18 }
  ];

  const professionals = [
    {
      id: 1,
      name: "María González",
      service: "Limpieza del hogar",
      rating: 4.9,
      reviews: 156,
      price: "$350/hora",
      distance: "2.3 km",
      image: "/placeholder.svg",
      verified: true,
      available: true,
      badges: ["Top Rated", "Background Check"]
    },
    {
      id: 2,
      name: "Carlos Hernández",
      service: "Reparaciones eléctricas",
      rating: 4.8,
      reviews: 203,
      price: "$450/hora",
      distance: "1.8 km",
      image: "/placeholder.svg",
      verified: true,
      available: true,
      badges: ["Certified", "Insurance"]
    },
    {
      id: 3,
      name: "Ana Martínez",
      service: "Jardinería y paisajismo",
      rating: 4.7,
      reviews: 89,
      price: "$320/hora",
      distance: "3.1 km",
      image: "/placeholder.svg",
      verified: true,
      available: false,
      badges: ["Eco Friendly", "Licensed"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-main mobile-pb-nav">
      {/* Header */}
      <div className="bg-gradient-glass backdrop-blur-glass border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Link to="/user-landing">
                <ModernButton variant="glass" size="icon">
                  <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
                </ModernButton>
              </Link>
              <h1 className="text-lg sm:text-2xl font-bold text-foreground">Buscar Servicios</h1>
            </div>
            
            <ModernButton variant="glass" className="text-xs sm:text-sm">
              <Filter className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Filtros</span>
            </ModernButton>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-4 sm:gap-8">
          {/* Sidebar - Categories & Filters - Hidden on mobile, show as modal/drawer */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card className="bg-gradient-card shadow-raised border-0 backdrop-blur-glass">
              <CardHeader className="pb-3 sm:pb-6">
                <h3 className="text-base sm:text-lg font-semibold text-foreground">Categorías</h3>
              </CardHeader>
              <CardContent className="space-y-1 sm:space-y-2 pt-0">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-2 sm:p-3 rounded-lg transition-all text-sm sm:text-base ${
                      selectedCategory === category.id
                        ? 'bg-gradient-button text-primary-foreground shadow-soft'
                        : 'hover:bg-gradient-glass text-foreground hover:shadow-soft'
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary" className="bg-white/20 text-xs">
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            {/* Enhanced Search Bar */}
            <Card className="bg-gradient-glass backdrop-blur-glass shadow-floating border-0 mb-4 sm:mb-8">
              <CardContent className="p-3 sm:p-6">
                <EnhancedSearchBar
                  placeholder="¿Qué servicio necesitas?"
                  onSearch={handleSearch}
                  onResultClick={handleResultClick}
                  size="md"
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Results Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-2">
              <div>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground">
                  {professionals.length} profesionales disponibles
                </h2>
                <p className="text-sm text-muted-foreground">En tu área - Ciudad de México</p>
              </div>
              
              <select className="bg-gradient-card border border-white/20 rounded-lg px-3 py-2 text-sm sm:text-base text-foreground shadow-soft w-full sm:w-auto">
                <option>Más relevantes</option>
                <option>Mejor calificados</option>
                <option>Precio: menor a mayor</option>
                <option>Más cercanos</option>
              </select>
            </div>

            {/* Professional Cards */}
            <div className="space-y-4 sm:space-y-6">
              {professionals.map((pro) => (
                <Card key={pro.id} className="bg-gradient-card shadow-raised border-0 hover:shadow-floating transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-3 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-start space-y-4 sm:space-y-0 sm:space-x-6">
                      {/* Profile Image & Basic Info */}
                      <div className="flex items-center space-x-4 sm:flex-col sm:items-center sm:space-x-0 sm:space-y-2">
                        <div className="relative">
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-glass rounded-xl shadow-soft overflow-hidden">
                            <img 
                              src={pro.image} 
                              alt={pro.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {pro.verified && (
                            <div className="absolute -bottom-1 -right-1 sm:-bottom-2 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-gradient-button rounded-full flex items-center justify-center shadow-glow">
                              <Shield className="h-3 w-3 sm:h-4 sm:w-4 text-primary-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 sm:text-center">
                          <h3 className="text-lg sm:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                            {pro.name}
                          </h3>
                          <p className="text-sm text-muted-foreground">{pro.service}</p>
                        </div>
                      </div>

                      {/* Professional Info */}
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                          <div className="order-2 sm:order-1">
                            {/* Rating & Distance */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-2">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="font-semibold text-sm sm:text-base">{pro.rating}</span>
                                <span className="text-xs sm:text-sm text-muted-foreground">({pro.reviews} reseñas)</span>
                              </div>
                              
                              <div className="flex items-center space-x-1 text-muted-foreground text-xs sm:text-sm">
                                <MapPin className="h-3 w-3 sm:h-4 sm:w-4" />
                                <span>{pro.distance}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right order-1 sm:order-2">
                            <div className="text-xl sm:text-2xl font-bold text-primary">{pro.price}</div>
                            {pro.available ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200 text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                Disponible hoy
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">No disponible</Badge>
                            )}
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-1 sm:gap-2 mb-3 sm:mb-4">
                          {pro.badges.map((badge, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="bg-gradient-glass border-primary/20 text-primary text-xs"
                            >
                              {badge}
                            </Badge>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          <ModernButton variant="primary" size="default" className="flex-1 text-sm sm:text-base">
                            Ver Perfil & Contratar
                          </ModernButton>
                          <div className="flex gap-2 sm:gap-3">
                            <ModernButton variant="glass" size="default" className="sm:w-auto text-sm sm:text-base">
                              Mensaje
                            </ModernButton>
                            {/* Mobile-specific buttons */}
                            <div className="md:hidden flex gap-2">
                              <ModernButton 
                                variant={favorites.includes(pro.id) ? "primary" : "glass"}
                                size="sm"
                                onClick={() => toggleFavorite(pro.id)}
                                className="px-2"
                              >
                                <Heart className={`h-4 w-4 ${favorites.includes(pro.id) ? 'fill-current' : ''}`} />
                              </ModernButton>
                              <ModernButton variant="outline" size="sm" className="px-2">
                                <Calendar className="h-4 w-4" />
                              </ModernButton>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
      {/* Mobile bottom navigation */}
      <div className="mobile-only">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default SearchPage;