import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight } from "lucide-react";

interface BookingIntentStepProps {
  initialIntent?: string;
  initialCategory?: string;
  onConfirm: (intentText: string) => void;
  onCategoryChange?: (category: string) => void;
}

export const BookingIntentStep = ({
  initialIntent = "",
  initialCategory = "",
  onConfirm,
  onCategoryChange,
}: BookingIntentStepProps) => {
  const [intentText, setIntentText] = useState(initialIntent);

  const canProceed = intentText.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) {
      onConfirm(intentText.trim());
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step indicator */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-semibold">
            1
          </div>
          <span className="text-sm font-medium text-muted-foreground">
            Paso 1 de 4
          </span>
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            ¿Qué necesitas?
          </h1>
          <p className="text-muted-foreground text-base">
            Describe con tus propias palabras lo que necesitas. No te preocupes por la categoría, nosotros te ayudamos.
          </p>
        </div>

        {/* Free-text input */}
        <div className="space-y-3">
          <Label htmlFor="intent-input" className="text-base font-medium">
            Describe lo que necesitas
          </Label>
          <Textarea
            id="intent-input"
            value={intentText}
            onChange={(e) => setIntentText(e.target.value)}
            placeholder="Ej: Necesito que alguien arregle una fuga en el baño, cambiar unos focos, o montar una TV en la pared..."
            className="min-h-[140px] text-base resize-none"
            autoFocus
          />
        </div>

        {/* CTA */}
        <Button
          type="submit"
          disabled={!canProceed}
          size="lg"
          className="w-full bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant text-base font-semibold"
        >
          Continuar
          <ArrowRight className="ml-2 w-5 h-5" />
        </Button>
      </form>
    </div>
  );
};
