import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check, MapPin, Calendar, FileText, Image, ArrowLeft } from "lucide-react";

interface BookingConfirmationProps {
  service: string;
  date: string;
  timePreference: string;
  location: string;
  details: string;
  photoCount: number;
  onConfirm: () => void;
  onGoBack: () => void;
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
}: BookingConfirmationProps) => {
  const [countdown, setCountdown] = useState(15);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    // Update progress bar
    const progressInterval = setInterval(() => {
      setProgressValue((prev) => {
        const increment = (100 / 15) / 10; // Update 10 times per second over 15 seconds
        if (prev >= 100) return 100;
        return prev + increment;
      });
    }, 100);

    // Update countdown
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
  }, [onConfirm]);

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-success/10 mx-auto mb-4">
          <Check className="w-8 h-8 text-success" />
        </div>
        <h1 className="text-4xl font-bold text-foreground font-['Made_Dillan']">
          Revisa tu solicitud
        </h1>
        <p className="text-muted-foreground text-lg">
          Confirma que toda la información sea correcta antes de enviar
        </p>
      </div>

      <Card className="p-6 space-y-6 border-2">
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Check className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Servicio</p>
              <p className="text-base font-semibold text-foreground mt-1">{service}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Fecha y hora</p>
              <p className="text-base font-semibold text-foreground mt-1">{date}</p>
              {timePreference !== "Sin preferencia" && (
                <p className="text-sm text-muted-foreground mt-1">{timePreference}</p>
              )}
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Ubicación</p>
              <p className="text-base font-semibold text-foreground mt-1">{location}</p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground font-medium">Detalles</p>
              <p className="text-base text-foreground mt-1 line-clamp-3">{details}</p>
            </div>
          </div>

          {photoCount > 0 && (
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Image className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-muted-foreground font-medium">Fotos adjuntas</p>
                <p className="text-base font-semibold text-foreground mt-1">
                  {photoCount} {photoCount === 1 ? 'foto' : 'fotos'}
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Auto-redirect progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Redirigiendo a WhatsApp en {countdown} segundo{countdown !== 1 ? 's' : ''}...
          </span>
          <span className="text-primary font-semibold">{Math.round(progressValue)}%</span>
        </div>
        <Progress value={progressValue} className="h-2" />
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4 pt-4">
        <Button
          variant="outline"
          onClick={onGoBack}
          className="h-14 px-8 rounded-full text-base flex items-center gap-2"
        >
          <ArrowLeft className="w-5 h-5" />
          Volver y editar
        </Button>
        
        <ModernButton
          variant="primary"
          onClick={onConfirm}
          className="h-14 px-8 rounded-full text-base flex-1"
        >
          Todo correcto - Enviar ahora
        </ModernButton>
      </div>
    </div>
  );
};
