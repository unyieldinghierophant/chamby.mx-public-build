import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Check, MapPin, Calendar, FileText, Image, Clock } from "lucide-react";
import toolsPatternBg from "@/assets/tools-pattern-bg.png";

// Preload background image immediately
const preloadImage = new window.Image();
preloadImage.src = toolsPatternBg;

interface BookingConfirmationProps {
  service: string;
  date: string;
  timePreference: string;
  location: string;
  details: string;
  photoCount: number;
  onConfirm: () => void;
  onGoBack: () => void;
  isSubmitting?: boolean;
}

export const BookingConfirmation = ({
  service,
  date,
  timePreference,
  location,
  details,
  photoCount,
  onConfirm,
  onGoBack,
  isSubmitting = false,
}: BookingConfirmationProps) => {
  const [countdown, setCountdown] = useState(15);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    if (isSubmitting) return;

    const progressInterval = setInterval(() => {
      setProgressValue((prev) => {
        const increment = (100 / 15) / 10;
        if (prev >= 100) return 100;
        return prev + increment;
      });
    }, 100);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          clearInterval(progressInterval);
          onConfirm();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(progressInterval);
    };
  }, [onConfirm, isSubmitting]);

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 bg-blue-50"
        style={{
          backgroundImage: `url(${toolsPatternBg})`,
          backgroundSize: '400px',
          backgroundRepeat: 'repeat',
        }}
      />
      
      {/* Card Container */}
      <div className="flex-1 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-in-from-bottom relative z-10">
          {/* Header inside card */}
          <div className="text-center space-y-1 px-6 pt-6 pb-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground font-['Made_Dillan']">
              Preparando tu solicitud...
            </h1>
            <p className="text-sm text-muted-foreground">
              Verifica que todo esté correcto
            </p>
          </div>

      {/* Summary Card - Uber Style */}
      <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg">
        {/* Service Header */}
        <div className="bg-primary/5 px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">Servicio</p>
              <p className="font-semibold text-foreground">{service}</p>
            </div>
          </div>
        </div>

        {/* Details List */}
        <div className="divide-y divide-border">
          {/* Date */}
          <div className="px-6 py-4 flex items-center gap-4">
            <Calendar className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Fecha</p>
              <p className="font-medium text-foreground">{date}</p>
            </div>
          </div>

          {/* Time */}
          {timePreference !== "Sin preferencia" && (
            <div className="px-6 py-4 flex items-center gap-4">
              <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Horario preferido</p>
                <p className="font-medium text-foreground">{timePreference}</p>
              </div>
            </div>
          )}

          {/* Location */}
          <div className="px-6 py-4 flex items-center gap-4">
            <MapPin className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Ubicación</p>
              <p className="font-medium text-foreground truncate">{location}</p>
            </div>
          </div>

          {/* Description */}
          <div className="px-6 py-4 flex items-start gap-4">
            <FileText className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Detalles</p>
              <p className="font-medium text-foreground line-clamp-2">{details}</p>
            </div>
          </div>

          {/* Photos */}
          {photoCount > 0 && (
            <div className="px-6 py-4 flex items-center gap-4">
              <Image className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground">Fotos adjuntas</p>
                <p className="font-medium text-foreground">
                  {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons - Uber Style */}
      <div className="px-6 pb-6 space-y-3 pt-2">
        {/* Primary Button with Countdown */}
        <Button
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full h-14 rounded-full text-base font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
              Enviando...
            </span>
          ) : (
            `Todo listo (${formatCountdown(countdown)})`
          )}
        </Button>

        {/* Go Back Link */}
        <button
          onClick={onGoBack}
          disabled={isSubmitting}
          className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium disabled:opacity-50"
        >
          Volver y editar
        </button>
      </div>
        </div>
      </div>
    </div>
  );
};
