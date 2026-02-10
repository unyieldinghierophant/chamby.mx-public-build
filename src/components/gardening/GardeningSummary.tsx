import { Button } from "@/components/ui/button";
import { Check, Leaf, Ruler, TreePine, Wrench, Recycle, CalendarClock, Camera, Home, FileText, ArrowLeft } from "lucide-react";
import toolsPatternBg from "@/assets/tools-pattern-bg.png";
import { useEffect, useState } from "react";

const serviceLabels: Record<string, string> = {
  corte_pasto: "Corte de pasto", poda_plantas: "Poda de plantas / arbustos",
  poda_arboles: "Poda de árboles", limpieza: "Limpieza general",
  diseno: "Diseño / mejora estética", maleza: "Retiro de maleza", otro: "Otro",
};
const areaSizeLabels: Record<string, string> = {
  small: "Pequeño (patio / <50 m²)", medium: "Mediano (50–150 m²)", large: "Grande (150+ m²)",
};
const spaceLabels: Record<string, string> = {
  frontal: "Jardín frontal", trasero: "Jardín trasero", azotea: "Azotea",
  comun: "Área común", interior: "Interior (plantas dentro de casa)",
};
const treeLabels: Record<string, string> = {
  none: "No", small: "Sí, pequeños (≤3 m)", medium: "Sí, medianos (3–6 m)", large: "Sí, grandes (6+ m)",
};
const toolsLabels: Record<string, string> = {
  all: "Sí, todas", some: "Algunas", none: "No",
};
const materialsLabels: Record<string, string> = {
  client: "Yo", provider: "El proveedor", unsure: "No estoy seguro",
};
const wasteLabels: Record<string, string> = {
  yes: "Sí, necesito retiro", no: "No, yo me encargo", unsure: "No estoy seguro",
};
const frequencyLabels: Record<string, string> = {
  once: "Una sola vez", weekly: "Semanal", biweekly: "Quincenal",
  monthly: "Mensual", tbd: "A definir después",
};
const accessLabels: Record<string, string> = {
  easy: "Acceso fácil", enter_house: "Requiere entrar a la casa",
  restricted_hours: "Horarios restringidos", pets: "Mascotas en el área",
  noise_restricted: "Ruido permitido solo en ciertos horarios",
};

interface Props {
  formData: {
    services: string[];
    otherService: string;
    areaSize: string | null;
    spaceTypes: string[];
    trees: string | null;
    toolsAvailable: string | null;
    materialsProvider: string | null;
    wasteRemoval: string | null;
    frequency: string | null;
    photos: { url: string; uploaded: boolean }[];
    accessTypes: string[];
    additionalNotes: string;
  };
  onConfirm: () => void;
  onGoBack: () => void;
  isSubmitting: boolean;
}

export const GardeningSummary = ({ formData, onConfirm, onGoBack, isSubmitting }: Props) => {
  const [countdown, setCountdown] = useState(15);

  useEffect(() => {
    if (isSubmitting) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(interval); onConfirm(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitting]);

  const Row = ({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) => (
    <div className="px-5 py-3.5 flex items-start gap-4 border-b border-border last:border-b-0">
      <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="font-medium text-foreground text-sm">{value}</p>
      </div>
    </div>
  );

  const servicesText = formData.services
    .map(s => s === 'otro' ? (formData.otherService || 'Otro') : (serviceLabels[s] || s))
    .join(', ');

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-green-50 dark:bg-green-950/20" style={{ backgroundImage: `url(${toolsPatternBg})`, backgroundSize: '400px', backgroundRepeat: 'repeat' }} />

      <div className="flex-1 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-in-from-bottom relative z-10 max-h-[90vh] overflow-y-auto">
          <div className="text-center space-y-1 px-6 pt-6 pb-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground font-['Made_Dillan']">Resumen de tu solicitud</h1>
            <p className="text-sm text-muted-foreground">Verifica que todo esté correcto</p>
          </div>

          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg mx-4">
            <div className="bg-primary/5 px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Leaf className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Servicios</p>
                  <p className="font-semibold text-foreground">{servicesText}</p>
                </div>
              </div>
            </div>

            {formData.areaSize && <Row icon={Ruler} label="Tamaño del área" value={areaSizeLabels[formData.areaSize] || formData.areaSize} />}
            {formData.spaceTypes.length > 0 && <Row icon={Home} label="Tipo de espacio" value={formData.spaceTypes.map(s => spaceLabels[s] || s).join(', ')} />}
            {formData.trees && formData.trees !== 'none' && <Row icon={TreePine} label="Árboles" value={treeLabels[formData.trees] || formData.trees} />}
            {formData.toolsAvailable && <Row icon={Wrench} label="Herramientas" value={toolsLabels[formData.toolsAvailable] || ""} />}
            {formData.materialsProvider && <Row icon={Leaf} label="Materiales" value={materialsLabels[formData.materialsProvider] || ""} />}
            {formData.wasteRemoval && <Row icon={Recycle} label="Retiro de residuos" value={wasteLabels[formData.wasteRemoval] || ""} />}
            {formData.frequency && <Row icon={CalendarClock} label="Frecuencia" value={frequencyLabels[formData.frequency] || formData.frequency} />}

            {formData.photos.filter(p => p.uploaded).length > 0 && (
              <Row icon={Camera} label="Fotos" value={`${formData.photos.filter(p => p.uploaded).length} foto(s)`} />
            )}

            {formData.accessTypes.length > 0 && (
              <Row icon={Home} label="Acceso" value={formData.accessTypes.map(a => accessLabels[a] || a).join(', ')} />
            )}

            {formData.additionalNotes.trim() && (
              <Row icon={FileText} label="Notas adicionales" value={formData.additionalNotes} />
            )}
          </div>

          <div className="px-6 pb-6 space-y-3 pt-4">
            <Button
              onClick={onConfirm}
              disabled={isSubmitting}
              className="w-full h-14 rounded-full text-base font-semibold bg-foreground text-background hover:bg-foreground/90 transition-all"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-5 h-5 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Enviando...
                </span>
              ) : (
                `Confirmar y buscar jardinero (${countdown}s)`
              )}
            </Button>
            <button onClick={onGoBack} disabled={isSubmitting} className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              <ArrowLeft className="w-4 h-4 inline mr-1" /> Volver y editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
