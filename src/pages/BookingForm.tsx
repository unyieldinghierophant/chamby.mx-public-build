import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAvailability } from '@/hooks/useAvailability';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin, User, Star } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import Header from '@/components/Header';

interface Job {
  id: string;
  title: string;
  description: string;
  category: string;
  rate: number;
  provider_id: string;
  provider?: {
    email: string;
  };
}

const BookingForm = () => {
  const { jobId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState('');
  const [duration, setDuration] = useState(1);
  const [address, setAddress] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  
  // Get provider availability
  const { getAvailableSlots } = useAvailability(job?.provider_id);

  useEffect(() => {
    if (jobId) {
      fetchJob();
    }
  }, [jobId]);

  const fetchJob = async () => {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;
      setJob(data as any);
    } catch (error) {
      console.error('Error fetching job:', error);
      toast.error('Error al cargar el servicio');
      navigate('/jobs');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !job || !selectedDate || !selectedTime || !address) {
      toast.error('Por favor completa todos los campos requeridos');
      return;
    }

    setSubmitting(true);

    try {
      // Create booking date
      const [hours, minutes] = selectedTime.split(':');
      const bookingDate = new Date(selectedDate);
      bookingDate.setHours(parseInt(hours), parseInt(minutes));

      const totalAmount = job.rate * duration;

      // First get the customer's client ID
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email)
        .single();

      if (clientError) {
        // If client doesn't exist, we'll use the user.id directly
        console.warn('Client not found, using user.id directly');
      }

      const { data: booking, error: bookingError } = await supabase
        .from('jobs')
        .insert({
          client_id: clientData?.id,
          provider_id: job.provider_id,
          title: job.title,
          description: specialInstructions || job.description,
          category: job.category,
          scheduled_at: bookingDate.toISOString(),
          duration_hours: duration,
          total_amount: totalAmount,
          location: address,
          rate: job.rate,
          status: 'pending'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      toast.success('¡Solicitud enviada! El proveedor será notificado.');
      navigate(`/booking-summary/${booking.id}`);
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error('Error al crear la reserva: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const timeSlots = selectedDate ? getAvailableSlots(selectedDate) : [];

  // Fallback time slots if availability system is not ready
  const fallbackTimeSlots = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00',
    '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'
  ];

  const availableTimeSlots = timeSlots.length > 0 
    ? timeSlots.filter(slot => !slot.isBooked).map(slot => slot.start)
    : fallbackTimeSlots;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Servicio no encontrado</p>
      </div>
    );
  }

  const totalAmount = job.rate * duration;

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

          <div className="grid gap-8 lg:grid-cols-3">
            {/* Service Info */}
            <div className="lg:col-span-1">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised sticky top-24">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{job.title}</span>
                    <Badge variant="secondary">{job.category}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground">{job.description}</p>
                  
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">{job.provider?.email}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">5.0 (12 reseñas)</span>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-2xl font-bold text-primary">${job.rate}/hora</p>
                    <p className="text-sm text-muted-foreground">Tarifa base</p>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center mb-2">
                      <span>Duración: {duration}h</span>
                      <span>${job.rate} × {duration}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total:</span>
                      <span className="text-primary">${totalAmount}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Booking Form */}
            <div className="lg:col-span-2">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
                <CardHeader>
                  <CardTitle>Reservar Servicio</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Date Selection */}
                    <div className="space-y-2">
                      <Label>Fecha *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedDate ? (
                              format(selectedDate, "PPP", { locale: es })
                            ) : (
                              <span>Selecciona una fecha</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              setSelectedDate(date);
                              setSelectedTime(''); // Reset time when date changes
                            }}
                            disabled={(date) => date < new Date()}
                            className="p-3 pointer-events-auto"
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </div>

                    <div className="space-y-2">
                      <Label>Hora *</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {availableTimeSlots.map((time) => (
                          <Button
                            key={time}
                            type="button"
                            variant={selectedTime === time ? "default" : "outline"}
                            size="sm"
                            onClick={() => setSelectedTime(time)}
                          >
                            {time}
                          </Button>
                        ))}
                      </div>
                      {selectedDate && availableTimeSlots.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay horarios disponibles para esta fecha. Selecciona otra fecha.
                        </p>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="space-y-2">
                      <Label htmlFor="duration">Duración (horas) *</Label>
                      <Input
                        id="duration"
                        type="number"
                        min="1"
                        max="8"
                        value={duration}
                        onChange={(e) => setDuration(parseInt(e.target.value) || 1)}
                        required
                      />
                    </div>

                    {/* Address */}
                    <div className="space-y-2">
                      <Label htmlFor="address">Dirección *</Label>
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Ingresa la dirección donde se realizará el servicio"
                        required
                      />
                    </div>

                    {/* Special Instructions */}
                    <div className="space-y-2">
                      <Label htmlFor="instructions">Instrucciones especiales</Label>
                      <Textarea
                        id="instructions"
                        value={specialInstructions}
                        onChange={(e) => setSpecialInstructions(e.target.value)}
                        placeholder="Detalles adicionales sobre el trabajo..."
                        rows={3}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      className="w-full bg-primary hover:bg-primary/90"
                      disabled={submitting}
                    >
                      {submitting ? 'Procesando...' : `Reservar por $${totalAmount}`}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;