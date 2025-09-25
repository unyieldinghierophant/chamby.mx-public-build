import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, Shield, Clock, MapPin, Heart, Share2, MessageCircle, Calendar, Award, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ModernButton } from '@/components/ui/modern-button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import MobileBottomNav from '@/components/MobileBottomNav';

const ProviderProfileNew = () => {
  const { providerId } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  // Mock data - replace with real API call
  const provider = {
    id: providerId || '1',
    name: "María González",
    avatar: "/placeholder.svg",
    rating: 4.9,
    totalReviews: 156,
    responseTime: "~15 min",
    completedJobs: 342,
    memberSince: "2022",
    location: "Ciudad de México",
    distance: "2.3 km",
    verified: true,
    backgroundCheck: true,
    bio: "Soy una profesional de la limpieza con más de 8 años de experiencia. Me especializo en limpieza profunda, mantenimiento regular y uso productos eco-friendly. Mi objetivo es dejar tu hogar impecable y saludable.",
    services: ["Limpieza del Hogar", "Limpieza Profunda", "Limpieza de Oficinas"],
    specialties: [
      "Limpieza profunda",
      "Productos eco-friendly", 
      "Limpieza post-construcción",
      "Organización de espacios"
    ],
    hourlyRate: 300,
    availability: {
      today: true,
      thisWeek: true,
      nextWeek: true
    },
    gallery: [
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg",
      "/placeholder.svg"
    ]
  };

  const reviews = [
    {
      id: 1,
      name: "Ana Rodríguez",
      rating: 5,
      date: "Hace 2 días",
      comment: "Excelente trabajo! María dejó mi casa impecable. Muy profesional y puntual. Definitivamente la contrataré nuevamente.",
      avatar: "/placeholder.svg"
    },
    {
      id: 2,
      name: "Carlos Méndez", 
      rating: 5,
      date: "Hace 1 semana",
      comment: "Increíble atención al detalle. Llegó con todos sus productos y herramientas. Mi esposa y yo quedamos muy satisfechos.",
      avatar: "/placeholder.svg"
    },
    {
      id: 3,
      name: "Lucía Herrera",
      rating: 4,
      date: "Hace 2 semanas", 
      comment: "Muy buen servicio, aunque llegó 10 minutos tarde. El trabajo fue excelente y muy minuciosa con la limpieza.",
      avatar: "/placeholder.svg"
    }
  ];

  const handleBookService = () => {
    navigate(`/booking/datetime/${provider.id}?service=limpieza-del-hogar`);
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
      />
    ));
  };

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

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Provider Header */}
        <Card className="overflow-hidden">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-start md:space-x-6">
              <div className="flex items-center space-x-4 mb-4 md:mb-0">
                <Avatar className="w-20 h-20 md:w-24 md:h-24">
                  <AvatarImage src={provider.avatar} />
                  <AvatarFallback className="text-2xl">{provider.name[0]}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h1 className="text-2xl font-bold text-foreground">{provider.name}</h1>
                    {provider.verified && (
                      <Shield className="w-5 h-5 text-blue-500" />
                    )}
                    {provider.backgroundCheck && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1">
                      {renderStars(provider.rating)}
                      <span className="ml-1 font-medium">{provider.rating}</span>
                      <span>({provider.totalReviews} reseñas)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4" />
                      <span>{provider.distance} • {provider.location}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>Responde en {provider.responseTime}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Award className="w-4 h-4" />
                      <span>{provider.completedJobs} trabajos completados</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="text-center md:text-right">
                <div className="text-3xl font-bold text-primary mb-2">
                  ${provider.hourlyRate}/hora
                </div>
                <div className="flex flex-col space-y-2">
                  <ModernButton 
                    onClick={handleBookService}
                    size="lg"
                    className="min-w-[150px]"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    Contratar Ahora
                  </ModernButton>
                  <ModernButton 
                    variant="outline" 
                    size="sm"
                    className="min-w-[150px]"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Enviar Mensaje
                  </ModernButton>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* About Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-semibold">Acerca de {provider.name}</h2>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              {provider.bio}
            </p>
            
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <h3 className="font-medium text-foreground mb-2">Especialidades</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.specialties.map((specialty, index) => (
                    <Badge key={index} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="font-medium text-foreground mb-2">Servicios Ofrecidos</h3>
                <div className="flex flex-wrap gap-2">
                  {provider.services.map((service, index) => (
                    <Badge key={index} variant="outline">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-2xl font-bold text-primary">{provider.totalReviews}</div>
                <div className="text-sm text-muted-foreground">Reseñas</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-2xl font-bold text-primary">{provider.completedJobs}</div>
                <div className="text-sm text-muted-foreground">Trabajos</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-2xl font-bold text-primary">{provider.responseTime}</div>
                <div className="text-sm text-muted-foreground">Respuesta</div>
              </div>
              <div className="p-3 rounded-lg bg-secondary">
                <div className="text-2xl font-bold text-primary">{provider.memberSince}</div>
                <div className="text-sm text-muted-foreground">Miembro desde</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reviews */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Reseñas ({provider.totalReviews})</h2>
              <div className="flex items-center space-x-2">
                <div className="flex items-center space-x-1">
                  {renderStars(provider.rating)}
                </div>
                <span className="font-medium">{provider.rating}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {reviews.map((review, index) => (
                <div key={review.id}>
                  <div className="flex items-start space-x-4">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.avatar} />
                      <AvatarFallback>{review.name[0]}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="font-medium text-foreground">{review.name}</span>
                        <div className="flex items-center space-x-1">
                          {renderStars(review.rating)}
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">
                        {review.comment}
                      </p>
                    </div>
                  </div>
                  {index < reviews.length - 1 && <Separator className="mt-6" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Fixed Bottom CTA on Mobile */}
        <div className="fixed bottom-20 left-0 right-0 p-4 bg-white border-t shadow-lg md:hidden z-40">
          <ModernButton 
            onClick={handleBookService}
            className="w-full"
            size="lg"
          >
            Contratar por ${provider.hourlyRate}/hora
          </ModernButton>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default ProviderProfileNew;