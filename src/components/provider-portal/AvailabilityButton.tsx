import { cn } from "@/lib/utils";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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
    <div className="space-y-1">
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => onToggle(!isAvailable)}
        disabled={disabled}
        className={cn(
          "w-full py-3.5 px-5 rounded-2xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2.5",
          "disabled:opacity-50 disabled:pointer-events-none relative overflow-hidden",
          isAvailable 
            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/25" 
            : "bg-muted/60 text-muted-foreground"
        )}
      >
        <AnimatePresence mode="wait">
          {isAvailable ? (
            <motion.span
              key="available"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Disponible para trabajos
            </motion.span>
          ) : (
            <motion.span
              key="unavailable"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              No disponible
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      <p className="text-[10px] text-muted-foreground/60 text-center">
        Recibe trabajos solo cuando estés disponible
      </p>
    </div>
  );
};
