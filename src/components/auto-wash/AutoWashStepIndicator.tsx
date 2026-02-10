import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const stepLabels = [
  "Servicio",
  "Vehículo",
  "Suciedad",
  "Manchas",
  "Ubicación",
  "Equipo",
  "Acceso",
  "Fotos",
  "Horario",
];

interface Props {
  currentStep: number;
  totalSteps: number;
}

export const AutoWashStepIndicator = ({ currentStep, totalSteps }: Props) => {
  return (
    <div className="hidden lg:flex items-center gap-1.5 mb-2 flex-wrap">
      {stepLabels.map((label, i) => {
        const stepNum = i + 1;
        const isActive = currentStep === stepNum;
        const isDone = currentStep > stepNum;

        return (
          <div key={i} className="flex items-center gap-1.5">
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors",
                  isActive && "bg-primary text-primary-foreground",
                  isDone && "bg-primary/20 text-primary",
                  !isActive && !isDone && "bg-muted text-muted-foreground"
                )}
              >
                {isDone ? <Check className="w-4 h-4" /> : stepNum}
              </div>
              <span className={cn(
                "text-xs font-medium transition-colors",
                isActive ? "text-foreground" : "text-muted-foreground"
              )}>
                {label}
              </span>
            </div>
            {i < totalSteps - 1 && (
              <div className={cn(
                "w-4 h-0.5 rounded-full",
                isDone ? "bg-primary/40" : "bg-muted"
              )} />
            )}
          </div>
        );
      })}
    </div>
  );
};
