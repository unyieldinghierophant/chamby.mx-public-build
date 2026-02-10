import { Button } from "@/components/ui/button";
import { Check, Car, Droplets, MapPin, Package, Key, Camera, CalendarClock, ArrowLeft, AlertTriangle } from "lucide-react";
import toolsPatternBg from "@/assets/tools-pattern-bg.png";
import { useEffect, useState } from "react";

const serviceLabels: Record<string, string> = {
  exterior: "Lavado exterior", interior: "Lavado interior", completo: "Lavado completo",
  detallado: "Detallado (interior/exterior)", encerado: "Encerado / pulido",
};
const vehicleLabels: Record<string, string> = { auto: "Auto", suv: "SUV", camioneta: "Camioneta", van: "Van" };
const dirtLabels: Record<string, string> = { light: "Ligera", medium: "Media", heavy: "Alta (lodo, arena, pelo de mascota)" };
const stainLabels: Record<string, string> = {
  asientos: "Asientos", alfombras: "Alfombras", cajuela: "Cajuela", techo: "Techo",
  rines: "Rines", motor: "Motor", pelo_mascotas: "Pelo de mascotas", manchas_dificiles: "Manchas difíciles",
};
const conditionLabels: Record<string, string> = {
  espacio: "Espacio para trabajar", sombra: "Sombra disponible", agua: "Toma de agua",
  electricidad: "Conexión eléctrica", estacionamiento: "Estacionamiento permitido",
};
const suppliesLabels: Record<string, string> = { client: "Yo", provider: "El proveedor" };
const pressureLabels: Record<string, string> = { yes: "Sí", no: "No", unsure: "No sé" };
const accessLabels: Record<string, string> = {
  keys: "Llaves disponibles", open: "Vehículo abierto", present: "Estaré presente", chat: "Coordinar por chat",
};
const scheduleLabels: Record<string, string> = { today: "Hoy", specific: "Fecha específica", flexible: "Flexible" };

interface Props {
  formData: {
    serviceType: string | null;
    otherService: string;
    vehicleType: string | null;
    dirtLevel: string | null;
    stains: string[];
    stainDetail: string;
    siteConditions: string[];
    suppliesProvider: string | null;
    needsPressureWasher: string | null;
    vehicleAccess: string | null;
    photos: { url: string; uploaded: boolean }[];
    schedule: string | null;
  };
  onConfirm: () => void;
  onGoBack: () => void;
  isSubmitting: boolean;
}

export const AutoWashSummary = ({ formData, onConfirm, onGoBack, isSubmitting }: Props) => {
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

  const serviceText = formData.serviceType === 'otro'
    ? (formData.otherService || 'Otro')
    : (formData.serviceType ? (serviceLabels[formData.serviceType] || formData.serviceType) : '');

  const noWater = !formData.siteConditions.includes('agua');
  const noElectricity = !formData.siteConditions.includes('electricidad');

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-sky-50 dark:bg-sky-950/20" style={{ backgroundImage: `url(${toolsPatternBg})`, backgroundSize: '400px', backgroundRepeat: 'repeat' }} />

      <div className="flex-1 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-in-from-bottom relative z-10 max-h-[90vh] overflow-y-auto">
          <div className="text-center space-y-1 px-6 pt-6 pb-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground font-['Made_Dillan']">Resumen de tu solicitud</h1>
            <p className="text-sm text-muted-foreground">Verifica que todo esté correcto</p>
          </div>

          {(noWater || noElectricity) && (
            <div className="mx-4 mb-3 px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">
                {noWater && noElectricity ? '⚠️ Sin agua ni electricidad' : noWater ? '⚠️ Sin toma de agua' : '⚠️ Sin conexión eléctrica'}
              </span>
            </div>
          )}

          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg mx-4">
            <div className="bg-primary/5 px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Car className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Servicio</p>
                  <p className="font-semibold text-foreground">{serviceText}</p>
                </div>
              </div>
            </div>

            {formData.vehicleType && <Row icon={Car} label="Vehículo" value={vehicleLabels[formData.vehicleType] || formData.vehicleType} />}
            {formData.dirtLevel && <Row icon={Droplets} label="Nivel de suciedad" value={dirtLabels[formData.dirtLevel] || formData.dirtLevel} />}
            {formData.stains.length > 0 && (
              <Row icon={Droplets} label="Trabajos especiales" value={formData.stains.map(s => s === 'manchas_dificiles' ? `Manchas: ${formData.stainDetail || 'sí'}` : (stainLabels[s] || s)).join(', ')} />
            )}
            {formData.siteConditions.length > 0 && <Row icon={MapPin} label="Condiciones del lugar" value={formData.siteConditions.map(c => conditionLabels[c] || c).join(', ')} />}
            {formData.suppliesProvider && <Row icon={Package} label="Productos/equipo" value={suppliesLabels[formData.suppliesProvider] || ''} />}
            {formData.needsPressureWasher && <Row icon={Droplets} label="Hidrolavadora" value={pressureLabels[formData.needsPressureWasher] || ''} />}
            {formData.vehicleAccess && <Row icon={Key} label="Acceso al vehículo" value={accessLabels[formData.vehicleAccess] || formData.vehicleAccess} />}
            {formData.photos.filter(p => p.uploaded).length > 0 && (
              <Row icon={Camera} label="Fotos" value={`${formData.photos.filter(p => p.uploaded).length} foto(s)`} />
            )}
            {formData.schedule && <Row icon={CalendarClock} label="Horario" value={scheduleLabels[formData.schedule] || formData.schedule} />}
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
                `Confirmar y buscar servicio (${countdown}s)`
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
