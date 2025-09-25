import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Clock, MapPin, Star, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ModernButton } from '@/components/ui/modern-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import MobileBottomNav from '@/components/MobileBottomNav';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    // In a real app, you would verify the payment session with Stripe
    // For now, we'll simulate booking details
    const mockBookingDetails = {
      id: 'BOOK-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
      service: 'Limpieza del Hogar',
      provider: {
        name: 'María González',
        rating: 4.9,
        avatar: '/placeholder.svg'
      },
      date: '2024-01-20',
      time: '10:00',
      duration: 2,
      amount: 600,
      status: 'confirmed',
      sessionId
    };
    
    setBookingDetails(mockBookingDetails);
  }, [sessionId]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!bookingDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Confirmando tu reserva...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background mobile-pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/user-landing')}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Inicio</span>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">¡Pago Exitoso!</h1>
              <p className="text-sm text-muted-foreground">Tu servicio ha sido reservado</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Success Message */}
        <Card className="text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              ¡Reserva Confirmada!
            </h2>
            <p className="text-muted-foreground mb-4">
              Tu pago se ha procesado exitosamente y tu servicio está reservado.
            </p>
            <Badge variant="secondary" className="text-sm">
              ID de Reserva: {bookingDetails.id}
            </Badge>
          </CardContent>
        </Card>

        {/* Booking Details */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Detalles de tu Reserva</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Service Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className="font-medium text-foreground">{bookingDetails.service}</h4>
                <p className="text-sm text-muted-foreground">
                  {bookingDetails.duration} horas de servicio
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary">
                  ${bookingDetails.amount.toLocaleString('es-MX')}
                </div>
                <div className="text-sm text-muted-foreground">
                  MXN
                </div>
              </div>
            </div>

            <Separator />

            {/* Provider Info */}
            <div className="flex items-center space-x-4">
              <img
                src={bookingDetails.provider.avatar}
                alt={bookingDetails.provider.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="flex-1">
                <h4 className="font-medium text-foreground">
                  {bookingDetails.provider.name}
                </h4>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm text-muted-foreground">
                    {bookingDetails.provider.rating}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className="text-green-600 border-green-200">
                Verificado
              </Badge>
            </div>

            <Separator />

            {/* Date & Time */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <Calendar className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">
                    {formatDate(bookingDetails.date)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Fecha del servicio
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-medium text-foreground">
                    {bookingDetails.time} - {
                      new Date(`2024-01-01T${bookingDetails.time}:00`).getHours() + bookingDetails.duration < 24
                        ? `${String(new Date(`2024-01-01T${bookingDetails.time}:00`).getHours() + bookingDetails.duration).padStart(2, '0')}:00`
                        : 'Siguiente día'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Horario del servicio
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Próximos Pasos</h3>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  1
                </div>
                <div>
                  <div className="font-medium text-foreground">Confirmación del Profesional</div>
                  <div className="text-sm text-muted-foreground">
                    {bookingDetails.provider.name} recibirá tu solicitud y la confirmará pronto.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  2
                </div>
                <div>
                  <div className="font-medium text-foreground">Recordatorio</div>
                  <div className="text-sm text-muted-foreground">
                    Te enviaremos un recordatorio 24 horas antes del servicio.
                  </div>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-medium mt-0.5">
                  3
                </div>
                <div>
                  <div className="font-medium text-foreground">Día del Servicio</div>
                  <div className="text-sm text-muted-foreground">
                    El profesional llegará puntual a la hora acordada.
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <ModernButton 
            onClick={() => navigate('/messages')}
            className="w-full"
            size="lg"
          >
            Contactar al Profesional
          </ModernButton>
          
          <ModernButton 
            variant="outline"
            onClick={() => navigate('/user-landing')}
            className="w-full"
            size="lg"
          >
            Volver al Inicio
          </ModernButton>
        </div>

        {/* Contact Support */}
        <Card className="bg-secondary">
          <CardContent className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-2">
              ¿Necesitas ayuda con tu reserva?
            </p>
            <ModernButton variant="outline" size="sm">
              Contactar Soporte
            </ModernButton>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default PaymentSuccess;