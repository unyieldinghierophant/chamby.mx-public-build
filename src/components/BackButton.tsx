import { useNavigate } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackButtonProps {
  className?: string;
  variant?: "back" | "close";
  fallbackPath?: string;
}

export const BackButton = ({ 
  className, 
  variant = "back",
  fallbackPath = "/" 
}: BackButtonProps) => {
  const navigate = useNavigate();

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to a default path if no history
      navigate(fallbackPath);
    }
  };

  const Icon = variant === "close" ? X : ArrowLeft;
  const label = variant === "close" ? "Cerrar" : "Volver";

  return (
    <Button
      onClick={handleBack}
      variant="ghost"
      size="sm"
      className={cn(
        "gap-2 hover:bg-accent/50 transition-colors",
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  );
};
