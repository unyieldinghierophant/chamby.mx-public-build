import { Button } from "@/components/ui/button";
import { Check, Wrench, Ruler, PackageOpen, Camera, Home, FileText, ArrowLeft } from "lucide-react";
import toolsPatternBg from "@/assets/tools-pattern-bg.png";
import { useEffect, useState } from "react";

const workTypeLabels: Record<string, string> = {
  reparacion: "Reparación", instalacion: "Instalación", armado: "Armado", ajuste: "Ajuste / Mantenimiento"
};
const jobSizeLabels: Record<string, string> = {
  small: "Pequeño (≤ 1 hora)", medium: "Mediano (1–3 horas)", large: "Grande (3+ horas)"
};
const materialsLabels: Record<string, string> = {
  client: "Yo tengo los materiales", provider: "Proveedor trae materiales", unsure: "No estoy seguro"
};
const toolsLabels: Record<string, string> = {
  yes: "Sí tengo herramientas", no: "No tengo herramientas", unsure: "No sé cuáles se necesitan"
};
const detailLabels: Record<string, string> = {
  perforate: "Perforar pared", measure: "Medir/nivelar", height: "Trabajo en altura",
  tight_space: "Espacio reducido", move_furniture: "Mover muebles"
};
const accessLabels: Record<string, string> = {
  apartment: "Departamento", house: "Casa", ground_floor: "Planta baja",
  stairs: "Escaleras", elevator: "Elevador", restricted_hours: "Horarios restringidos"
};

interface Props {
  formData: {
    description: string;
    workType: string | null;
    jobSize: string | null;
    materialsProvider: string | null;
    toolsAvailable: string | null;
    importantDetails: string[];
    photos: { url: string; uploaded: boolean }[];
    accessTypes: string[];
    additionalNotes: string;
  };
  onConfirm: () => void;
  onGoBack: () => void;
  isSubmitting: boolean;
}

export const HandymanSummary = ({ formData, onConfirm, onGoBack, isSubmitting }: Props) => {
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

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-blue-50" style={{ backgroundImage: `url(${toolsPatternBg})`, backgroundSize: '400px', backgroundRepeat: 'repeat' }} />

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
                  <Check className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Descripción</p>
                  <p className="font-semibold text-foreground">{formData.description}</p>
                </div>
              </div>
            </div>

            {formData.workType && <Row icon={Wrench} label="Tipo de trabajo" value={workTypeLabels[formData.workType] || formData.workType} />}
            {formData.jobSize && <Row icon={Ruler} label="Tamaño estimado" value={jobSizeLabels[formData.jobSize] || formData.jobSize} />}
            {formData.materialsProvider && <Row icon={PackageOpen} label="Materiales" value={materialsLabels[formData.materialsProvider] || ""} />}
            {formData.toolsAvailable && <Row icon={Wrench} label="Herramientas" value={toolsLabels[formData.toolsAvailable] || ""} />}

            {formData.importantDetails.length > 0 && (
              <Row icon={FileText} label="Detalles importantes" value={formData.importantDetails.map(d => detailLabels[d] || d).join(', ')} />
            )}

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
                `Confirmar y buscar proveedor (${countdown}s)`
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
