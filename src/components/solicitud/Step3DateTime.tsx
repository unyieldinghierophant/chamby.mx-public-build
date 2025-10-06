import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Clock, Zap } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Step3DateTimeProps {
  urgent: boolean;
  scheduledAt: string | null;
  onUrgentChange: (urgent: boolean) => void;
  onScheduledAtChange: (scheduledAt: string | null) => void;
}

const Step3DateTime = ({
  urgent,
  scheduledAt,
  onUrgentChange,
  onScheduledAtChange,
}: Step3DateTimeProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    scheduledAt ? new Date(scheduledAt) : undefined
  );
  const [selectedTime, setSelectedTime] = useState<string>(
    scheduledAt ? format(new Date(scheduledAt), "HH:mm") : "09:00"
  );

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    setSelectedDate(date);
    
    // Combine date with time
    const [hours, minutes] = selectedTime.split(":");
    date.setHours(parseInt(hours), parseInt(minutes));
    onScheduledAtChange(date.toISOString());
  };

  const handleTimeChange = (time: string) => {
    setSelectedTime(time);
    if (selectedDate) {
      const [hours, minutes] = time.split(":");
      const newDate = new Date(selectedDate);
      newDate.setHours(parseInt(hours), parseInt(minutes));
      onScheduledAtChange(newDate.toISOString());
    }
  };

  const handleUrgentToggle = (checked: boolean) => {
    onUrgentChange(checked);
    if (checked) {
      onScheduledAtChange(null);
      setSelectedDate(undefined);
    }
  };

  const timeSlots = [
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">¿Cuándo necesitas el servicio?</h3>
        <p className="text-muted-foreground text-sm">
          Selecciona una fecha y hora o marca como urgente
        </p>
      </div>

      {/* Urgent Toggle */}
      <div className="flex items-center justify-between p-4 border rounded-lg bg-gradient-glass">
        <div className="flex items-center gap-3">
          <Zap className="h-5 w-5 text-orange-500" />
          <div>
            <Label htmlFor="urgent" className="text-base font-medium">
              Servicio urgente
            </Label>
            <p className="text-sm text-muted-foreground">
              Menos de 2 horas
            </p>
          </div>
        </div>
        <Switch
          id="urgent"
          checked={urgent}
          onCheckedChange={handleUrgentToggle}
        />
      </div>

      {/* Date and Time Selection */}
      {!urgent && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Programa tu servicio</span>
          </div>

          {/* Calendar */}
          <div className="flex justify-center">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
              locale={es}
              className={cn("rounded-md border pointer-events-auto")}
            />
          </div>

          {/* Time Slots */}
          {selectedDate && (
            <div>
              <Label className="mb-3 block">Selecciona una hora</Label>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {timeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleTimeChange(time)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                      selectedTime === time
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    )}
                  >
                    {time}
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedDate && selectedTime && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Fecha seleccionada:
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })} a las {selectedTime}
              </p>
            </div>
          )}
        </div>
      )}

      {urgent && (
        <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Zap className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                Servicio urgente activado
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300">
                Buscaremos un profesional disponible en las próximas 2 horas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step3DateTime;
