import { useState, useEffect } from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RescheduleCountdownProps {
  deadline: string;
  onExpire?: () => void;
}

export const RescheduleCountdown = ({ deadline, onExpire }: RescheduleCountdownProps) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    total: number;
  }>({ hours: 0, minutes: 0, seconds: 0, total: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = new Date(deadline).getTime() - new Date().getTime();
      
      if (difference <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, total: 0 });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds, total: difference });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, [deadline, onExpire]);

  if (timeLeft.total <= 0) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          El tiempo para responder ha expirado. Este trabajo será reasignado.
        </AlertDescription>
      </Alert>
    );
  }

  const isUrgent = timeLeft.total < 30 * 60 * 1000; // Less than 30 minutes

  return (
    <Alert variant={isUrgent ? "destructive" : "default"} className="border-2">
      <Clock className="h-4 w-4" />
      <AlertDescription>
        <div className="flex items-center justify-between">
          <span className="font-medium">
            {isUrgent ? '⚠️ ¡Tiempo casi agotado!' : 'Tiempo para responder:'}
          </span>
          <div className="text-2xl font-bold font-mono">
            {String(timeLeft.hours).padStart(2, '0')}:
            {String(timeLeft.minutes).padStart(2, '0')}:
            {String(timeLeft.seconds).padStart(2, '0')}
          </div>
        </div>
        {isUrgent && (
          <p className="text-xs mt-2">
            Si no respondes, el trabajo será reasignado a otro profesional.
          </p>
        )}
      </AlertDescription>
    </Alert>
  );
};
