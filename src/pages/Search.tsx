import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, MapPin, Star, Clock, Shield, Filter } from "lucide-react";
import { Link } from "react-router-dom";

const SearchPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

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
    <div className="min-h-screen bg-gradient-main">
      {/* Header */}
      <div className="bg-gradient-glass backdrop-blur-glass border-b border-white/20 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <ModernButton variant="glass" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </ModernButton>
              </Link>
              <h1 className="text-2xl font-bold text-foreground">Buscar Servicios</h1>
            </div>
            
            <ModernButton variant="glass">
              <Filter className="mr-2 h-4 w-4" />
              Filtros
            </ModernButton>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar - Categories & Filters */}
          <div className="lg:col-span-1">
            <Card className="bg-gradient-card shadow-raised border-0 backdrop-blur-glass">
              <CardHeader>
                <h3 className="text-lg font-semibold text-foreground">Categorías</h3>
              </CardHeader>
              <CardContent className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all ${
                      selectedCategory === category.id
                        ? 'bg-gradient-button text-primary-foreground shadow-soft'
                        : 'hover:bg-gradient-glass text-foreground hover:shadow-soft'
                    }`}
                  >
                    <span className="font-medium">{category.name}</span>
                    <Badge variant="secondary" className="bg-white/20">
                      {category.count}
                    </Badge>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Search Bar */}
            <Card className="bg-gradient-glass backdrop-blur-glass shadow-floating border-0 mb-8">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="¿Qué servicio necesitas? Ej: limpieza semanal, reparar grifo..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-4 h-14 text-lg bg-gradient-card border-white/20 focus:ring-2 focus:ring-primary/50 focus:border-primary/50 shadow-inner"
                  />
                  <ModernButton 
                    variant="primary" 
                    size="lg"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2"
                  >
                    Buscar
                  </ModernButton>
                </div>
              </CardContent>
            </Card>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-foreground">
                  {professionals.length} profesionales disponibles
                </h2>
                <p className="text-muted-foreground">En tu área - Ciudad de México</p>
              </div>
              
              <select className="bg-gradient-card border border-white/20 rounded-lg px-4 py-2 text-foreground shadow-soft">
                <option>Más relevantes</option>
                <option>Mejor calificados</option>
                <option>Precio: menor a mayor</option>
                <option>Más cercanos</option>
              </select>
            </div>

            {/* Professional Cards */}
            <div className="space-y-6">
              {professionals.map((pro) => (
                <Card key={pro.id} className="bg-gradient-card shadow-raised border-0 hover:shadow-floating transition-all duration-300 group overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-6">
                      {/* Profile Image */}
                      <div className="relative">
                        <div className="w-20 h-20 bg-gradient-glass rounded-xl shadow-soft overflow-hidden">
                          <img 
                            src={pro.image} 
                            alt={pro.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        {pro.verified && (
                          <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-button rounded-full flex items-center justify-center shadow-glow">
                            <Shield className="h-4 w-4 text-primary-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Professional Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                              {pro.name}
                            </h3>
                            <p className="text-muted-foreground">{pro.service}</p>
                          </div>
                          
                          <div className="text-right">
                            <div className="text-2xl font-bold text-primary">{pro.price}</div>
                            {pro.available ? (
                              <Badge className="bg-green-100 text-green-700 border-green-200">
                                <Clock className="mr-1 h-3 w-3" />
                                Disponible hoy
                              </Badge>
                            ) : (
                              <Badge variant="secondary">No disponible</Badge>
                            )}
                          </div>
                        </div>

                        {/* Rating & Distance */}
                        <div className="flex items-center space-x-4 mb-4">
                          <div className="flex items-center space-x-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                            <span className="font-semibold">{pro.rating}</span>
                            <span className="text-muted-foreground">({pro.reviews} reseñas)</span>
                          </div>
                          
                          <div className="flex items-center space-x-1 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>{pro.distance}</span>
                          </div>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2 mb-4">
                          {pro.badges.map((badge, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="bg-gradient-glass border-primary/20 text-primary"
                            >
                              {badge}
                            </Badge>
                          ))}
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-3">
                          <ModernButton variant="primary" size="lg" className="flex-1">
                            Ver Perfil & Contratar
                          </ModernButton>
                          <ModernButton variant="glass" size="lg">
                            Mensaje
                          </ModernButton>
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
    </div>
  );
};

export default SearchPage;