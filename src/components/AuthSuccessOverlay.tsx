import { CheckCircle } from "lucide-react";
import { useEffect } from "react";

interface AuthSuccessOverlayProps {
  message: string;
  onComplete: () => void;
}

export const AuthSuccessOverlay = ({ message, onComplete }: AuthSuccessOverlayProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
        <h2 className="text-2xl font-semibold text-foreground">{message}</h2>
        <p className="text-muted-foreground">Redirigiendo...</p>
      </div>
    </div>
  );
};
