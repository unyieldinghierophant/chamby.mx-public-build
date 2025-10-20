import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ModernButton } from '@/components/ui/modern-button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  Clock, 
  MapPin, 
  Calendar, 
  User, 
  CreditCard,
  ArrowLeft,
  MessageSquare,
  Phone,
  Star,
  Shield
} from 'lucide-react';
import { format, parse } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/Header';
import MobileBottomNav from '@/components/MobileBottomNav';

interface BookingSummaryData {
  providerId: string;
  service: string;
  date: string;
  time: string;
  providerName: string;
  providerRate: string;
}

const BookingSummary = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Extract booking data from URL parameters
  const bookingData: BookingSummaryData = {
    providerId: searchParams.get('providerId') || '',
    service: searchParams.get('service') || '',
    date: searchParams.get('date') || '',
    time: searchParams.get('time') || '',
    providerName: searchParams.get('providerName') || 'Profesional',
    providerRate: searchParams.get('providerRate') || '300',
  };

  if (!bookingData.service || !bookingData.date || !bookingData.time) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Información de reserva incompleta</h2>
          <ModernButton onClick={() => navigate('/user-landing')}>
            Buscar Servicios
          </ModernButton>
        </div>
      </div>
    );
  }

  const handlePayment = async () => {
    if (!user) {
      navigate('/auth/user');
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          serviceType: bookingData.service,
          providerId: bookingData.providerId,
          date: bookingData.date,
          time: bookingData.time,
          duration: 2 // Default duration
        }
      });

      if (error) throw error;

      if (data.url) {
        // Redirect to Stripe Checkout
        window.open(data.url, '_blank');
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Error al procesar el pago');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Service details mapping
  const serviceDetails = {
    'limpieza-del-hogar': {
      title: 'Limpieza del Hogar',
      description: 'Servicio completo de limpieza con productos eco-friendly',
      category: 'Limpieza',
      duration: 2,
      icon: '🧹'
    },
    'reparaciones': {
      title: 'Reparaciones',
      description: 'Plomería, electricidad y reparaciones generales',
      category: 'Reparaciones', 
      duration: 2,
      icon: '🔧'
    },
    'jardineria': {
      title: 'Jardinería',
      description: 'Mantenimiento de jardín y diseño paisajístico',
      category: 'Jardinería',
      duration: 3,
      icon: '🌱'
    }
  };

  const currentService = serviceDetails[bookingData.service as keyof typeof serviceDetails] || serviceDetails['limpieza-del-hogar'];
  const hourlyRate = parseInt(bookingData.providerRate);
  // Only charge visit fee initially (300 pesos)
  const visitFee = 300;
  const totalAmount = visitFee;
  const bookingDate = parse(`${bookingData.date} ${bookingData.time}`, 'yyyy-MM-dd HH:mm', new Date());

  return (
    <div className="min-h-screen bg-background mobile-pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver</span>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Resumen de Reserva</h1>
              <p className="text-sm text-muted-foreground">Confirma los detalles y procede al pago</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Service Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{currentService.icon}</span>
                <div>
                  <CardTitle className="text-xl">{currentService.title}</CardTitle>
                  <p className="text-muted-foreground">{currentService.description}</p>
                </div>
              </div>
              <Badge variant="secondary">{currentService.category}</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Provider Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>Profesional Asignado</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{bookingData.providerName}</h3>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>4.9</span>
                  <Shield className="w-4 h-4 text-blue-500" />
                  <span>Verificado</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-primary">
                  ${hourlyRate}/hora
                </div>
                <div className="text-sm text-muted-foreground">
                  {currentService.duration} horas
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Date & Time Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>Fecha y Hora</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <Calendar className="w-8 h-8 text-primary bg-primary/10 rounded-lg p-2" />
                <div>
                  <div className="font-medium text-foreground">
                    {format(bookingDate, 'EEEE d MMMM yyyy', { locale: es })}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Fecha del servicio
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Clock className="w-8 h-8 text-primary bg-primary/10 rounded-lg p-2" />
                <div>
                  <div className="font-medium text-foreground">
                    {bookingData.time} - {
                      new Date(`2024-01-01T${bookingData.time}:00`).getHours() + currentService.duration < 24
                        ? `${String(new Date(`2024-01-01T${bookingData.time}:00`).getHours() + currentService.duration).padStart(2, '0')}:00`
                        : 'Siguiente día'
                    }
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {currentService.duration} horas de servicio
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <CreditCard className="w-5 h-5" />
              <span>Resumen de Pago</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span>Cuota de visita</span>
                <span>${visitFee}</span>
              </div>
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Tarifa por trabajo (se cobrará después)</span>
                <span>${hourlyRate}/hora</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total a Pagar Ahora</span>
                <span className="text-primary">${totalAmount.toLocaleString('es-MX')}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                *El costo final del servicio se calculará según las horas trabajadas reales
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <Card className="bg-secondary">
          <CardContent className="p-4">
            <h3 className="font-medium mb-2">Términos y Condiciones</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Solo pagas $300 de cuota de visita ahora</li>
              <li>• El pago final se calcula por horas trabajadas reales</li>
              <li>• Puedes cancelar hasta 24 horas antes sin costo</li>
              <li>• El profesional contactará para confirmar detalles</li>
              <li>• Garantía de satisfacción del 100%</li>
            </ul>
          </CardContent>
        </Card>

        {/* Payment Button */}
        <div className="sticky bottom-20 md:bottom-4 bg-white border-t md:border-0 p-4 md:p-0 shadow-lg md:shadow-none rounded-t-lg md:rounded-none">
          <ModernButton
            onClick={handlePayment}
            disabled={isProcessingPayment}
            className="w-full"
            size="lg"
          >
            {isProcessingPayment ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Procesando...</span>
              </div>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar Cuota de Visita ${totalAmount.toLocaleString('es-MX')}
              </>
            )}
          </ModernButton>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default BookingSummary;