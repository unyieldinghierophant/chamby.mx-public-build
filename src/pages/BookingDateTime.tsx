import React, { useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, Sun, Sunset, Moon, Sunrise } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ModernButton } from '@/components/ui/modern-button';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { format, addDays, isToday, isTomorrow } from 'date-fns';
import { es } from 'date-fns/locale';
import MobileBottomNav from '@/components/MobileBottomNav';

const BookingDateTime = () => {
  const { providerId } = useParams();
  const [searchParams] = useSearchParams();
  const service = searchParams.get('service');
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>('');

  // Time slots with icons and periods
  const timeSlots = [
    {
      period: 'morning',
      label: 'Mañana',
      icon: Sunrise,
      times: ['08:00', '09:00', '10:00', '11:00'],
      color: 'bg-yellow-50 text-yellow-700 border-yellow-200'
    },
    {
      period: 'afternoon',
      label: 'Mediodía',
      icon: Sun,
      times: ['12:00', '13:00', '14:00', '15:00'],
      color: 'bg-orange-50 text-orange-700 border-orange-200'
    },
    {
      period: 'evening',
      label: 'Tarde',
      icon: Sunset,
      times: ['16:00', '17:00', '18:00', '19:00'],
      color: 'bg-blue-50 text-blue-700 border-blue-200'
    },
    {
      period: 'night',
      label: 'Noche',
      icon: Moon,
      times: ['20:00', '21:00'],
      color: 'bg-purple-50 text-purple-700 border-purple-200'
    }
  ];

  // Mock provider data
  const provider = {
    id: providerId,
    name: "María González",
    avatar: "/placeholder.svg",
    rating: 4.9,
    hourlyRate: 300
  };

  // Generate next 14 days for selection
  const availableDates = Array.from({ length: 14 }, (_, i) => addDays(new Date(), i));

  const getDateLabel = (date: Date) => {
    if (isToday(date)) return 'Hoy';
    if (isTomorrow(date)) return 'Mañana';
    return format(date, 'EEE d', { locale: es });
  };

  const handleContinue = () => {
    if (!selectedDate || !selectedTime) return;
    
    const bookingData = {
      providerId: providerId || '',
      service: service || '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: selectedTime,
      providerName: provider.name,
      providerRate: provider.hourlyRate.toString()
    };
    
    const queryString = new URLSearchParams(bookingData).toString();
    navigate(`/booking/summary?${queryString}`);
  };

  const isTimeSlotAvailable = (time: string) => {
    // Mock availability logic
    const unavailableTimes = ['09:00', '14:00', '18:00']; // Example unavailable times
    return !unavailableTimes.includes(time);
  };

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
              <h1 className="text-lg font-semibold text-foreground">Seleccionar Fecha y Hora</h1>
              <p className="text-sm text-muted-foreground">Con {provider.name}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Service Summary */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-foreground capitalize">
                  {service?.replace('-', ' ')} 
                </h2>
                <p className="text-sm text-muted-foreground">
                  Con {provider.name} • ${provider.hourlyRate}/hora
                </p>
              </div>
              <Badge variant="secondary">⭐ {provider.rating}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Date Selection */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold">Selecciona una fecha</h3>
            </div>
          </CardHeader>
          <CardContent>
            {/* Quick Date Selector */}
            <div className="grid grid-cols-7 gap-2 mb-6">
              {availableDates.slice(0, 7).map((date) => (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={cn(
                    "p-3 rounded-lg text-center transition-colors border-2",
                    selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd')
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-secondary border-border"
                  )}
                >
                  <div className="text-xs font-medium">
                    {getDateLabel(date)}
                  </div>
                  <div className="text-lg font-bold">
                    {format(date, 'd')}
                  </div>
                </button>
              ))}
            </div>

            {/* Calendar Component */}
            <div className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < new Date()}
                initialFocus
                locale={es}
                className="rounded-md border"
              />
            </div>
          </CardContent>
        </Card>

        {/* Time Selection */}
        {selectedDate && (
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold">
                  Horarios disponibles - {format(selectedDate, 'EEEE d MMMM', { locale: es })}
                </h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {timeSlots.map((slot) => (
                  <div key={slot.period}>
                    <div className={cn(
                      "flex items-center space-x-3 p-3 rounded-lg mb-3",
                      slot.color
                    )}>
                      <slot.icon className="w-5 h-5" />
                      <span className="font-medium">{slot.label}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {slot.times.map((time) => {
                        const isAvailable = isTimeSlotAvailable(time);
                        const isSelected = selectedTime === time;
                        
                        return (
                          <button
                            key={time}
                            onClick={() => isAvailable && setSelectedTime(time)}
                            disabled={!isAvailable}
                            className={cn(
                              "p-3 rounded-lg text-center transition-colors border-2 font-medium",
                              isSelected
                                ? "bg-primary text-primary-foreground border-primary"
                                : isAvailable
                                ? "bg-background hover:bg-secondary border-border hover:border-primary"
                                : "bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed"
                            )}
                          >
                            {time}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Continue Button */}
        {selectedDate && selectedTime && (
          <div className="sticky bottom-0 p-4 bg-white border-t shadow-lg">
            <ModernButton
              onClick={handleContinue}
              className="w-full"
              size="lg"
            >
              Continuar - {format(selectedDate, 'd MMM', { locale: es })} a las {selectedTime}
            </ModernButton>
          </div>
        )}

        {/* Mobile spacing */}
        <div className="h-20 md:hidden" />
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default BookingDateTime;