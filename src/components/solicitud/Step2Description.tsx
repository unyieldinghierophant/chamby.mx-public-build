import { Textarea } from "@/components/ui/textarea";
import { FileText } from "lucide-react";

interface Step2DescriptionProps {
  description: string;
  onDescriptionChange: (description: string) => void;
}

const Step2Description = ({
  description,
  onDescriptionChange,
}: Step2DescriptionProps) => {
  const maxLength = 300;
  const remaining = maxLength - description.length;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">Describe el problema</h3>
        <p className="text-muted-foreground text-sm">
          Proporciona detalles que ayuden al profesional a prepararse
        </p>
      </div>

      <div className="space-y-2">
        <Textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Ejemplo: La regadera del baño principal gotea constantemente. Ya intenté apretar la llave pero sigue goteando..."
          maxLength={maxLength}
          rows={6}
          className="resize-none"
        />
        <div className="flex justify-between items-center text-xs">
          <span
            className={`${
              remaining < 50 ? "text-orange-500" : "text-muted-foreground"
            }`}
          >
            {remaining} caracteres restantes
          </span>
        </div>
      </div>

      {description.length === 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <FileText className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
                Incluye información útil
              </p>
              <ul className="text-sm text-amber-700 dark:text-amber-300 list-disc list-inside mt-1">
                <li>¿Desde cuándo ocurre el problema?</li>
                <li>¿Ya intentaste alguna solución?</li>
                <li>¿Hay algún detalle especial a considerar?</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2Description;
