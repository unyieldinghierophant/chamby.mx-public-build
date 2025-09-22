import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/Header';

interface Booking {
  id: string;
  scheduled_date: string;
  duration_hours: number;
  total_amount: number;
  address: string;
  status: string;
  payment_status: string;
  customer_id: string;
  tasker_id: string;
  description: string;
  service_id: string;
  title: string;
  service?: {
    title: string;
    description: string;
    category: string;
  } | null;
}

const BookingSummary = () => {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  const fetchBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          service:jobs!bookings_service_id_fkey(title, description, category)
        `)
        .eq('id', bookingId)
        .single();

      if (error) throw error;
      setBooking(data as any);
    } catch (error) {
      console.error('Error fetching booking:', error);
      toast.error('Error al cargar la reserva');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pendiente de confirmación';
      case 'confirmed':
        return 'Confirmado';
      case 'in_progress':
        return 'En progreso';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  const getPaymentStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pago pendiente';
      case 'completed':
        return 'Pago completado';
      case 'failed':
        return 'Pago fallido';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Reserva no encontrada</p>
      </div>
    );
  }

  const bookingDate = new Date(booking.scheduled_date);

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      <div className="pt-20 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver
          </Button>

          {/* Success Message */}
          <Card className="bg-card/95 backdrop-blur-sm shadow-raised mb-8">
            <CardContent className="pt-6">
              <div className="flex items-center justify-center space-x-3 text-green-600 mb-4">
                <CheckCircle className="w-8 h-8" />
                <h1 className="text-2xl font-bold">¡Reserva Exitosa!</h1>
              </div>
              <p className="text-center text-muted-foreground">
                Tu solicitud ha sido enviada al proveedor de servicios. 
                Te notificaremos cuando confirme tu reserva.
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Booking Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Service Info */}
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle>{booking.title || booking.service?.title || 'Servicio'}</CardTitle>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusText(booking.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{booking.description}</p>
                  
                  <Separator />
                  
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Fecha</p>
                        <p className="text-sm text-muted-foreground">
                          {format(bookingDate, "PPP", { locale: es })}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Clock className="w-5 h-5 text-primary" />
                      <div>
                        <p className="font-medium">Hora</p>
                        <p className="text-sm text-muted-foreground">
                          {format(bookingDate, "HH:mm")} ({booking.duration_hours}h)
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3 md:col-span-2">
                      <MapPin className="w-5 h-5 text-primary mt-1" />
                      <div>
                        <p className="font-medium">Dirección</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.address}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact & Communication */}
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="w-5 h-5" />
                    Comunicación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Una vez que el proveedor confirme tu reserva, podrás contactarlo directamente.
                  </p>
                  
                  <div className="flex gap-3">
                    <Button variant="outline" size="sm" disabled>
                      <MessageSquare className="w-4 h-4 mr-2" />
                      Enviar Mensaje
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Phone className="w-4 h-4 mr-2" />
                      Llamar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Summary */}
            <div className="lg:col-span-1">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Resumen de Pago
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Servicio base</span>
                      <span className="text-sm">${(booking.total_amount / booking.duration_hours).toFixed(2)}/h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Duración</span>
                      <span className="text-sm">{booking.duration_hours}h</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span>Total</span>
                      <span className="text-primary">${booking.total_amount}</span>
                    </div>
                  </div>

                  <Badge 
                    variant="outline" 
                    className={booking.payment_status === 'completed' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : 'bg-yellow-100 text-yellow-800 border-yellow-200'
                    }
                  >
                    {getPaymentStatusText(booking.payment_status)}
                  </Badge>

                  <div className="text-xs text-muted-foreground">
                    <p>El pago se procesará una vez que el proveedor confirme tu reserva.</p>
                  </div>

                  <Button className="w-full" disabled={booking.payment_status === 'completed'}>
                    {booking.payment_status === 'completed' ? 'Pago Completado' : 'Procesar Pago'}
                  </Button>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm">Próximos pasos:</h4>
                    <ul className="text-xs text-muted-foreground space-y-1">
                      <li>• El proveedor revisará tu solicitud</li>
                      <li>• Te notificaremos cuando confirme</li>
                      <li>• Podrás comunicarte directamente</li>
                      <li>• El pago se procesará automáticamente</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex justify-center space-x-4">
            <Link to="/jobs">
              <Button variant="outline">
                Ver Más Servicios
              </Button>
            </Link>
            <Link to="/profile">
              <Button>
                Mis Reservas
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingSummary;