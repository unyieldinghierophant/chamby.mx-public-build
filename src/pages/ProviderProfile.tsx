import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ModernButton } from "@/components/ui/modern-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  Heart, 
  Star, 
  MapPin, 
  Clock, 
  Shield, 
  Calendar,
  MessageSquare,
  Phone,
  Award,
  CheckCircle
} from "lucide-react";

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);

  // Mock provider data
  const provider = {
    id: 1,
    name: "María González",
    service: "Limpieza del hogar",
    photo: "/placeholder.svg",
    rating: 4.9,
    reviews: 156,
    distance: "2.3 km",
    price: 350,
    hourlyRate: "$350/hora",
    available: true,
    verified: true,
    bio: "Profesional de la limpieza con más de 8 años de experiencia. Especialista en limpieza profunda y mantenimiento de hogares. Trabajo con productos ecológicos y técnicas profesionales.",
    badges: ["Top Rated", "Background Check", "Insurance", "Eco Friendly"],
    completedJobs: 847,
    responseTime: "15 min",
    languages: ["Español", "Inglés"],
    services: [
      "Limpieza general del hogar",
      "Limpieza profunda",
      "Limpieza de oficinas", 
      "Limpieza post-construcción"
    ],
    gallery: [
      "/placeholder.svg",
      "/placeholder.svg", 
      "/placeholder.svg",
      "/placeholder.svg"
    ],
    reviewsList: [
      {
        id: 1,
        user: "Ana R.",
        rating: 5,
        comment: "Excelente trabajo, muy profesional y puntual. Mi casa quedó impecable.",
        date: "Hace 2 días"
      },
      {
        id: 2,
        user: "Carlos M.", 
        rating: 5,
        comment: "María es increíble, siempre deja todo perfecto. Altamente recomendada.",
        date: "Hace 1 semana"
      }
    ]
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
  };

  return (
    <div className="min-h-screen bg-gradient-main mobile-pb-nav">
      {/* Header */}
      <div className="bg-gradient-glass backdrop-blur-glass border-b border-white/20 sticky top-0 z-40">
        <div className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate(-1)}
                className="p-2"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-lg font-semibold text-foreground">Perfil del Proveedor</h1>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFavorite}
              className="p-2"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? 'fill-current text-red-500' : 'text-muted-foreground'}`} />
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Provider Header */}
        <Card className="bg-gradient-card shadow-raised border-0">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="relative">
                <Avatar className="h-20 w-20 border-4 border-white/50">
                  <AvatarImage src={provider.photo} />
                  <AvatarFallback className="text-xl font-bold">
                    {provider.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {provider.verified && (
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-gradient-button rounded-full flex items-center justify-center shadow-glow">
                    <Shield className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h2 className="text-xl font-bold text-foreground mb-1">
                  {provider.name}
                </h2>
                <p className="text-muted-foreground mb-2">{provider.service}</p>
                
                <div className="flex items-center space-x-4 mb-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="font-semibold">{provider.rating}</span>
                    <span className="text-sm text-muted-foreground">({provider.reviews} reseñas)</span>
                  </div>
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{provider.distance}</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">{provider.hourlyRate}</span>
                  {provider.available && (
                    <Badge className="bg-green-100 text-green-700 border-green-200">
                      <Clock className="mr-1 h-3 w-3" />
                      Disponible hoy
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="bg-gradient-card shadow-raised border-0">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-primary">{provider.completedJobs}</div>
              <div className="text-xs text-muted-foreground">Trabajos</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-raised border-0">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-primary">{provider.responseTime}</div>
              <div className="text-xs text-muted-foreground">Respuesta</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-card shadow-raised border-0">
            <CardContent className="p-4 text-center">
              <div className="text-xl font-bold text-primary">{provider.rating}★</div>
              <div className="text-xs text-muted-foreground">Calificación</div>
            </CardContent>
          </Card>
        </div>

        {/* About */}
        <Card className="bg-gradient-card shadow-raised border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Acerca de</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {provider.bio}
            </p>
            
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {provider.badges.map((badge, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="bg-gradient-glass border-primary/20 text-primary text-xs"
                >
                  <CheckCircle className="mr-1 h-3 w-3" />
                  {badge}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Services */}
        <Card className="bg-gradient-card shadow-raised border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Servicios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {provider.services.map((service, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span>{service}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Reviews */}
        <Card className="bg-gradient-card shadow-raised border-0">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Reseñas Recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {provider.reviewsList.map((review) => (
              <div key={review.id} className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-sm">{review.user}</span>
                    <div className="flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-3 w-3 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{review.date}</span>
                </div>
                <p className="text-sm text-muted-foreground">{review.comment}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Mobile Action Bar */}
      <div className="md:hidden fixed bottom-20 left-0 right-0 z-40 bg-gradient-card backdrop-blur-glass border-t border-white/20 p-4">
        <div className="flex space-x-3">
          <ModernButton 
            variant="outline" 
            className="flex-shrink-0"
            onClick={toggleFavorite}
          >
            <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-current text-red-500' : ''}`} />
            {isFavorite ? 'Guardado' : 'Guardar'}
          </ModernButton>
          <ModernButton variant="glass" className="flex-shrink-0">
            <MessageSquare className="h-4 w-4 mr-2" />
            Mensaje
          </ModernButton>
          <ModernButton 
            variant="primary" 
            className="flex-1"
            onClick={() => setShowBookingModal(true)}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Contratar Ahora
          </ModernButton>
        </div>
      </div>

      {/* Booking Modal */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <Card className="w-full bg-gradient-card rounded-t-2xl border-0 max-h-[80vh] overflow-y-auto">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Agendar Servicio</CardTitle>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowBookingModal(false)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Próximamente</h3>
                <p className="text-muted-foreground mb-4">
                  El sistema de reservas estará disponible pronto
                </p>
                <ModernButton variant="outline" onClick={() => setShowBookingModal(false)}>
                  Entendido
                </ModernButton>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="mobile-only">
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default ProviderProfile;