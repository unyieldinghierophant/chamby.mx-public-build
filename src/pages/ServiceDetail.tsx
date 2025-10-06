import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Shield, Clock, MapPin, Heart, Share2, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ModernButton } from '@/components/ui/modern-button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import MobileBottomNav from '@/components/MobileBottomNav';

const ServiceDetail = () => {
  const { serviceType } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock data - replace with real data from API
  const serviceDetails = {
    'limpieza-del-hogar': {
      title: 'Limpieza del Hogar',
      category: 'Limpieza',
      description: 'Servicio completo de limpieza del hogar con productos eco-friendly y profesionales verificados.',
      basePrice: 300,
      duration: '2-4 horas',
      rating: 4.8,
      reviews: 156,
      image: '/placeholder.svg'
    },
    'reparaciones': {
      title: 'Reparaciones Generales',
      category: 'Reparaciones',
      description: 'Plomería, electricidad, carpintería y reparaciones menores con garantía de servicio.',
      basePrice: 400,
      duration: '1-3 horas',
      rating: 4.9,
      reviews: 203,
      image: '/placeholder.svg'
    },
    'jardineria': {
      title: 'Jardinería',
      category: 'Jardinería',
      description: 'Mantenimiento de jardín, poda, diseño paisajístico y cuidado de plantas.',
      basePrice: 350,
      duration: '2-5 horas',
      rating: 4.7,
      reviews: 89,
      image: '/placeholder.svg'
    }
  };

  const professionals = [
    {
      id: 1,
      name: "María González",
      avatar: "/placeholder.svg",
      rating: 4.9,
      reviews: 85,
      price: 320,
      distance: "1.2 km",
      verified: true,
      available: true,
      specialties: ["Limpieza profunda", "Productos eco-friendly"],
      responseTime: "~15 min"
    },
    {
      id: 2,
      name: "Carlos Hernández",
      avatar: "/placeholder.svg",
      rating: 4.8,
      reviews: 72,
      price: 350,
      distance: "2.1 km",
      verified: true,
      available: true,
      specialties: ["Reparaciones eléctricas", "Plomería"],
      responseTime: "~30 min"
    },
    {
      id: 3,
      name: "Ana López",
      avatar: "/placeholder.svg",
      rating: 4.7,
      reviews: 94,
      price: 280,
      distance: "3.5 km",
      verified: true,
      available: false,
      specialties: ["Mantenimiento jardines", "Diseño paisajístico"],
      responseTime: "~1 hora"
    }
  ];

  const service = serviceDetails[serviceType as keyof typeof serviceDetails];

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-4">Servicio no encontrado</h2>
          <ModernButton onClick={() => navigate('/user-landing')}>
            Volver
          </ModernButton>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mobile-pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-full transition-colors ${
                  isFavorite ? 'text-red-500' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Heart className="w-5 h-5" fill={isFavorite ? 'currentColor' : 'none'} />
              </button>
              <button className="p-2 rounded-full text-muted-foreground hover:text-foreground transition-colors">
                <Share2 className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Service Overview */}
        <div className="mb-8">
          <div className="flex items-center space-x-2 mb-3">
            <Badge variant="secondary">{service.category}</Badge>
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{service.rating}</span>
              <span>({service.reviews} reseñas)</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-foreground mb-4">{service.title}</h1>
          <p className="text-lg text-muted-foreground mb-6">{service.description}</p>
          
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span>Duración: {service.duration}</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span>Desde ${service.basePrice}/hora</span>
            </div>
          </div>
        </div>

        {/* Available Professionals */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-6">Profesionales disponibles</h2>
          
          <div className="space-y-4">
            {professionals.map((professional) => (
              <Card key={professional.id} className="hover:shadow-lg transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="w-16 h-16">
                        <AvatarImage src={professional.avatar} />
                        <AvatarFallback>{professional.name[0]}</AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{professional.name}</h3>
                          {professional.verified && (
                            <Shield className="w-4 h-4 text-blue-500" />
                          )}
                          <div className={`w-3 h-3 rounded-full ${
                            professional.available ? 'bg-green-500' : 'bg-gray-400'
                          }`} />
                        </div>
                        
                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-2">
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span>{professional.rating}</span>
                            <span>({professional.reviews} reseñas)</span>
                          </div>
                          <span>A {professional.distance}</span>
                          <span>Responde en {professional.responseTime}</span>
                        </div>
                        
                        <div className="flex flex-wrap gap-2 mb-3">
                          {professional.specialties.map((specialty, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {specialty}
                            </Badge>
                          ))}
                        </div>
                        
                        <div className="text-xl font-bold text-primary">
                          ${professional.price}/hora
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col space-y-2 ml-4">
                      <ModernButton 
                        disabled
                        className="min-w-[120px]"
                      >
                        Próximamente
                      </ModernButton>
                      <ModernButton
                        variant="outline" 
                        size="sm"
                        className="min-w-[120px]"
                      >
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mensaje
                      </ModernButton>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Service Features */}
        <Card className="mb-8">
          <CardHeader>
            <h3 className="text-xl font-semibold">¿Qué incluye este servicio?</h3>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-green-500" />
                <span>Profesionales verificados</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-blue-500" />
                <span>Garantía de 30 días</span>
              </div>
              <div className="flex items-center space-x-3">
                <Heart className="w-5 h-5 text-red-500" />
                <span>Seguro incluido</span>
              </div>
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-yellow-500" />
                <span>Calidad garantizada</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Emergency Button */}
        <div className="text-center">
          <ModernButton 
            variant="outline" 
            size="lg"
            onClick={() => navigate('/user-landing')}
          >
            ¿No encuentras lo que buscas? Explorar más servicios
          </ModernButton>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default ServiceDetail;