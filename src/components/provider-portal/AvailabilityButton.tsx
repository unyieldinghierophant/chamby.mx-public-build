import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";

interface AvailabilityButtonProps {
  isAvailable: boolean;
  onToggle: (value: boolean) => void;
  disabled?: boolean;
}

export const AvailabilityButton = ({ 
  isAvailable, 
  onToggle, 
  disabled = false 
}: AvailabilityButtonProps) => {
  return (
    <div className="space-y-1.5">
      <button
        onClick={() => onToggle(!isAvailable)}
        disabled={disabled}
        className={cn(
          "w-full py-3 px-4 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2",
          "active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none",
          isAvailable 
            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" 
            : "bg-transparent border-2 border-muted-foreground/30 text-muted-foreground hover:border-muted-foreground/50"
        )}
      >
        {isAvailable ? (
          <>
            <Check className="w-4 h-4" />
            Disponible para trabajos
          </>
        ) : (
          <>
            <X className="w-4 h-4" />
            No disponible
          </>
        )}
      </button>
      <p className="text-[10px] text-muted-foreground text-center">
        Recibe trabajos solo cuando estés disponible
      </p>
    </div>
  );
};
