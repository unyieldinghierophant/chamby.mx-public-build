import { useEffect, useState } from "react";
import { Check, ArrowRight } from "lucide-react";
import { ModernButton } from "@/components/ui/modern-button";
import { Progress } from "@/components/ui/progress";

interface JobSuccessScreenProps {
  jobId: string;
  onNavigate: () => void;
}

export const JobSuccessScreen = ({ jobId, onNavigate }: JobSuccessScreenProps) => {
  const [countdown, setCountdown] = useState(5);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgressValue((prev) => {
        const increment = (100 / 5) / 10;
        if (prev >= 100) return 100;
        return prev + increment;
      });
    }, 100);

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          clearInterval(progressInterval);
          onNavigate();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(countdownInterval);
      clearInterval(progressInterval);
    };
  }, [onNavigate]);

  return (
    <div className="w-full max-w-lg mx-auto space-y-8 animate-fade-in text-center py-12">
      {/* Success Animation */}
      <div className="relative mx-auto w-24 h-24">
        <div className="absolute inset-0 rounded-full bg-success/20 animate-ping" />
        <div className="relative w-24 h-24 rounded-full bg-success flex items-center justify-center animate-scale-in">
          <Check className="w-12 h-12 text-white" strokeWidth={3} />
        </div>
      </div>

      {/* Success Message */}
      <div className="space-y-3">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground font-['Made_Dillan']">
          ¡Solicitud enviada!
        </h1>
        <p className="text-muted-foreground text-lg max-w-sm mx-auto">
          Tu solicitud ha sido enviada exitosamente. Te contactaremos pronto.
        </p>
      </div>

      {/* What's Next */}
      <div className="bg-muted/50 rounded-2xl p-6 space-y-4">
        <h3 className="font-semibold text-foreground">¿Qué sigue?</h3>
        <ul className="text-sm text-muted-foreground space-y-2 text-left">
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
            <span>Revisaremos tu solicitud y buscaremos al mejor profesional</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
            <span>Te enviaremos un mensaje por WhatsApp con la confirmación</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
            <span>El profesional llegará en la fecha y hora acordada</span>
          </li>
        </ul>
      </div>

      {/* Auto-redirect progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Redirigiendo en {countdown}s...
          </span>
          <span className="text-primary font-medium">{Math.round(progressValue)}%</span>
        </div>
        <Progress value={progressValue} className="h-1.5" />
      </div>

      {/* Manual Navigation Button */}
      <ModernButton
        variant="primary"
        onClick={onNavigate}
        className="h-14 px-8 rounded-full text-base w-full"
      >
        Ver mi solicitud
        <ArrowRight className="w-5 h-5 ml-2" />
      </ModernButton>
    </div>
  );
};
