import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TimeSlot {
  start: string;
  end: string;
  isBooked: boolean;
  bookingId?: string;
}

interface DayAvailability {
  enabled: boolean;
  startTime: string;
  endTime: string;
  timeSlots: TimeSlot[];
}

interface WeeklyAvailability {
  monday: DayAvailability;
  tuesday: DayAvailability;
  wednesday: DayAvailability;
  thursday: DayAvailability;
  friday: DayAvailability;
  saturday: DayAvailability;
  sunday: DayAvailability;
}

export const useAvailability = (providerId?: string) => {
  const { user } = useAuth();
  const [availability, setAvailability] = useState<WeeklyAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = async () => {
    if (!user && !providerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // This would fetch availability from a database table
      // For now, we'll use default availability
      const defaultAvailability: WeeklyAvailability = {
        monday: { enabled: true, startTime: '09:00', endTime: '17:00', timeSlots: [] },
        tuesday: { enabled: true, startTime: '09:00', endTime: '17:00', timeSlots: [] },
        wednesday: { enabled: true, startTime: '09:00', endTime: '17:00', timeSlots: [] },
        thursday: { enabled: true, startTime: '09:00', endTime: '17:00', timeSlots: [] },
        friday: { enabled: true, startTime: '09:00', endTime: '17:00', timeSlots: [] },
        saturday: { enabled: false, startTime: '09:00', endTime: '17:00', timeSlots: [] },
        sunday: { enabled: false, startTime: '09:00', endTime: '17:00', timeSlots: [] }
      };

      setAvailability(defaultAvailability);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching availability:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableSlots = (date: Date): TimeSlot[] => {
    if (!availability) return [];

    const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][date.getDay()] as keyof WeeklyAvailability;
    const dayAvailability = availability[dayOfWeek];
    
    if (!dayAvailability.enabled) return [];

    // Generate 30-minute time slots
    const slots: TimeSlot[] = [];
    const startTime = dayAvailability.startTime;
    const endTime = dayAvailability.endTime;
    
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      const nextHours = Math.floor((minutes + 30) / 60);
      const nextMins = (minutes + 30) % 60;
      
      const startSlot = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
      const endSlot = `${nextHours.toString().padStart(2, '0')}:${nextMins.toString().padStart(2, '0')}`;
      
      slots.push({
        start: startSlot,
        end: endSlot,
        isBooked: false // This would be checked against bookings
      });
    }
    
    return slots;
  };

  const updateAvailability = async (newAvailability: WeeklyAvailability) => {
    try {
      // This would update the availability in the database
      setAvailability(newAvailability);
      return { error: null };
    } catch (error: any) {
      setError(error.message);
      return { error: error.message };
    }
  };

  useEffect(() => {
    fetchAvailability();
  }, [user, providerId]);

  return {
    availability,
    loading,
    error,
    getAvailableSlots,
    updateAvailability,
    refetch: fetchAvailability
  };
};