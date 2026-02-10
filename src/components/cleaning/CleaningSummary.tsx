import { Button } from "@/components/ui/button";
import { Check, Sparkles, Home, BedDouble, Bath, MapPin, Layers, Package, AlertTriangle, Camera, CalendarClock, ArrowLeft } from "lucide-react";
import toolsPatternBg from "@/assets/tools-pattern-bg.png";
import { useEffect, useState } from "react";

const cleaningTypeLabels: Record<string, string> = {
  general: "General", profunda: "Profunda", mudanza: "Mudanza (entrada/salida)",
  post_obra: "Post-obra", oficina: "Oficina",
};
const buildingLabels: Record<string, string> = { apartment: "Departamento", house: "Casa", office: "Oficina / local" };
const sizeLabels: Record<string, string> = { studio: "Estudio / 1 recámara", two: "2 recámaras", three: "3 recámaras", four_plus: "4+ recámaras" };
const bathroomLabels: Record<string, string> = { "1": "1 baño", "2": "2 baños", "3+": "3+ baños" };
const zoneLabels: Record<string, string> = {
  cocina_profunda: "Cocina profunda", banos_profundos: "Baños profundos",
  ventanas_int: "Ventanas interiores", ventanas_ext: "Ventanas exteriores",
  refrigerador: "Refrigerador (interior)", horno: "Horno (interior)",
  closets: "Closets", balcones: "Balcones / terrazas",
};
const surfaceLabels: Record<string, string> = {
  ceramico: "Piso cerámico", madera: "Madera / laminado", alfombra: "Alfombra",
  marmol: "Mármol / piedra", vidrio: "Vidrio",
};
const suppliesLabels: Record<string, string> = { client: "Yo", provider: "El proveedor" };
const conditionLabels: Record<string, string> = {
  mascotas: "Mascotas", polvo: "Polvo excesivo", grasa: "Grasa",
  moho: "Moho", humo: "Humo", alergias: "Alergias",
};
const frequencyLabels: Record<string, string> = {
  once: "Una sola vez", weekly: "Semanal", biweekly: "Quincenal", monthly: "Mensual",
};

interface Props {
  formData: {
    cleaningType: string | null;
    otherCleaningType: string;
    buildingType: string | null;
    size: string | null;
    bathrooms: string | null;
    includesKitchen: string | null;
    priorityZones: string[];
    surfaces: string[];
    suppliesProvider: string | null;
    hasVacuum: string | null;
    specialConditions: string[];
    allergyDetail: string;
    photos: { url: string; uploaded: boolean }[];
    frequency: string | null;
  };
  onConfirm: () => void;
  onGoBack: () => void;
  isSubmitting: boolean;
}

export const CleaningSummary = ({ formData, onConfirm, onGoBack, isSubmitting }: Props) => {
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

  const typeText = formData.cleaningType === 'otro'
    ? (formData.otherCleaningType || 'Otro')
    : (formData.cleaningType ? (cleaningTypeLabels[formData.cleaningType] || formData.cleaningType) : '');

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-cyan-50 dark:bg-cyan-950/20" style={{ backgroundImage: `url(${toolsPatternBg})`, backgroundSize: '400px', backgroundRepeat: 'repeat' }} />

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
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Tipo de limpieza</p>
                  <p className="font-semibold text-foreground">{typeText}</p>
                </div>
              </div>
            </div>

            {formData.buildingType && <Row icon={Home} label="Inmueble" value={buildingLabels[formData.buildingType] || formData.buildingType} />}
            {formData.size && <Row icon={BedDouble} label="Tamaño" value={sizeLabels[formData.size] || formData.size} />}
            {formData.bathrooms && <Row icon={Bath} label="Baños" value={bathroomLabels[formData.bathrooms] || formData.bathrooms} />}
            {formData.includesKitchen && <Row icon={Home} label="¿Incluye cocina?" value={formData.includesKitchen === 'yes' ? 'Sí' : 'No'} />}
            {formData.priorityZones.length > 0 && <Row icon={MapPin} label="Zonas prioritarias" value={formData.priorityZones.map(z => zoneLabels[z] || z).join(', ')} />}
            {formData.surfaces.length > 0 && <Row icon={Layers} label="Superficies" value={formData.surfaces.map(s => surfaceLabels[s] || s).join(', ')} />}
            {formData.suppliesProvider && <Row icon={Package} label="Productos de limpieza" value={suppliesLabels[formData.suppliesProvider] || ''} />}
            {formData.hasVacuum && <Row icon={Package} label="¿Tiene aspiradora?" value={formData.hasVacuum === 'yes' ? 'Sí' : 'No'} />}
            {formData.specialConditions.length > 0 && (
              <Row icon={AlertTriangle} label="Condiciones especiales" value={formData.specialConditions.map(c => c === 'alergias' ? `Alergias: ${formData.allergyDetail || 'sí'}` : (conditionLabels[c] || c)).join(', ')} />
            )}
            {formData.photos.filter(p => p.uploaded).length > 0 && (
              <Row icon={Camera} label="Fotos" value={`${formData.photos.filter(p => p.uploaded).length} foto(s)`} />
            )}
            {formData.frequency && <Row icon={CalendarClock} label="Frecuencia" value={frequencyLabels[formData.frequency] || formData.frequency} />}
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
                `Confirmar y buscar personal de limpieza (${countdown}s)`
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
