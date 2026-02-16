import { useState, useEffect } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { categoryServicesMap, type ServiceOption } from "@/data/categoryServices";

interface WizardIntentStepProps {
  intentText?: string;
  category?: string;
  onConfirm: (intentText: string) => void;
}

/** Map URL category params → categoryServicesMap keys */
const CATEGORY_KEY_MAP: Record<string, string> = {
  handyman: "Handyman",
  electricidad: "Electricidad",
  fontanería: "Fontanería",
  fontaneria: "Fontanería",
  limpieza: "Limpieza",
  jardinería: "Jardinería",
  jardineria: "Jardinería",
  "auto & lavado": "Auto y Lavado",
  "auto y lavado": "Auto y Lavado",
};

function getSuggestions(category: string): ServiceOption[] {
  const key = CATEGORY_KEY_MAP[category.toLowerCase()] || category;
  return categoryServicesMap[key] || [];
}

export const WizardIntentStep = ({
  intentText = "",
  category = "",
  onConfirm,
}: WizardIntentStepProps) => {
  const [text, setText] = useState(intentText);
  const suggestions = getSuggestions(category);

  // Sync if intentText changes externally
  useEffect(() => {
    if (intentText && !text) setText(intentText);
  }, [intentText]);

  const canProceed = text.trim().length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (canProceed) onConfirm(text.trim());
  };

  const handlePillClick = (name: string) => {
    setText(name);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Heading */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground font-['Plus_Jakarta_Sans']">
            ¿Qué necesitas?
          </h1>
          <p className="text-muted-foreground text-base">
            Describe con tus propias palabras o elige una sugerencia.
          </p>
        </div>

        {/* Free-text input */}
        <div className="space-y-3">
          <Label htmlFor="wizard-intent-input" className="text-base font-medium">
            Describe lo que necesitas
          </Label>
          <Textarea
            id="wizard-intent-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ej: Necesito que alguien arregle una fuga en el baño..."
            className="min-h-[100px] text-base resize-none"
            autoFocus
          />
        </div>

        {/* Suggestion pills — category aware */}
        {suggestions.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Sparkles className="w-4 h-4" />
              Sugerencias
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestions
                .filter((s) => s.name !== "Otros Servicios")
                .map((s) => {
                  const isSelected = text === s.name;
                  return (
                    <button
                      key={s.name}
                      type="button"
                      onClick={() => handlePillClick(s.name)}
                      className={cn(
                        "flex items-center gap-1.5 px-4 py-2.5 rounded-full border-2 text-sm md:text-base font-medium transition-all active:scale-95",
                        isSelected
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-md"
                          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50"
                      )}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                      {s.name}
                    </button>
                  );
                })}
            </div>
          </div>
        )}

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
