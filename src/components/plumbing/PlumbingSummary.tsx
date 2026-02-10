import { Button } from "@/components/ui/button";
import { Check, Droplets, MapPin, AlertTriangle, Gauge, Building, KeyRound, Wrench, Clock, Camera, CalendarClock, ArrowLeft } from "lucide-react";
import toolsPatternBg from "@/assets/tools-pattern-bg.png";
import { useEffect, useState } from "react";

const problemLabels: Record<string, string> = {
  fuga: "Fuga de agua", tapada: "Tubería tapada",
  instalacion: "Instalación (WC, lavabo, regadera, boiler)", sanitario: "Reparación de sanitario",
  presion: "Baja presión", olor: "Olor a drenaje", emergencia: "Emergencia (fuga activa)", otro: "Otro",
};
const locationLabels: Record<string, string> = {
  bano: "Baño", cocina: "Cocina", patio: "Patio", azotea: "Azotea", comun: "Área común", otro: "Otro",
};
const severityLabels: Record<string, string> = {
  low: "Leve (goteo / lento)", medium: "Media (afecta uso)", high: "Alta (inunda / no se puede usar)",
};
const waterShutLabels: Record<string, string> = {
  yes: "Sí", no: "No", unsure: "No sé",
};
const buildingLabels: Record<string, string> = {
  house: "Casa", apartment: "Departamento", commercial: "Local / oficina",
};
const accessLabels: Record<string, string> = {
  shutoff_accessible: "Llave de paso accesible", meter_accessible: "Medidor accesible",
  admin_permission: "Requiere permiso del administrador", cut_general: "Requiere cortar agua general",
};
const materialsLabels: Record<string, string> = {
  client: "Yo", provider: "El proveedor", onsite: "A definir en sitio",
};
const partsLabels: Record<string, string> = {
  yes: "Sí", no: "No", unsure: "No sé",
};
const ageLabels: Record<string, string> = {
  new: "<5 años", mid: "5–15 años", old: "15+ años", unsure: "No sé",
};
const scheduleLabels: Record<string, string> = {
  asap: "Lo antes posible", today: "Hoy", specific: "Fecha específica", flexible: "Flexible",
};

interface Props {
  formData: {
    problem: string | null;
    otherProblem: string;
    locations: string[];
    severity: string | null;
    waterShut: string | null;
    buildingType: string | null;
    affectsOthers: string | null;
    accessChecks: string[];
    materialsProvider: string | null;
    hasParts: string | null;
    installationAge: string | null;
    photos: { url: string; uploaded: boolean }[];
    schedule: string | null;
    additionalNotes: string;
  };
  onConfirm: () => void;
  onGoBack: () => void;
  isSubmitting: boolean;
}

export const PlumbingSummary = ({ formData, onConfirm, onGoBack, isSubmitting }: Props) => {
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

  const problemText = formData.problem === 'otro'
    ? (formData.otherProblem || 'Otro')
    : (formData.problem ? problemLabels[formData.problem] || formData.problem : '');

  const isEmergency = formData.problem === 'emergencia';

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-blue-50 dark:bg-blue-950/20" style={{ backgroundImage: `url(${toolsPatternBg})`, backgroundSize: '400px', backgroundRepeat: 'repeat' }} />

      <div className="flex-1 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-in-from-bottom relative z-10 max-h-[90vh] overflow-y-auto">
          <div className="text-center space-y-1 px-6 pt-6 pb-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground font-['Made_Dillan']">Resumen de tu solicitud</h1>
            <p className="text-sm text-muted-foreground">Verifica que todo esté correcto</p>
          </div>

          {isEmergency && (
            <div className="mx-4 mb-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-semibold text-destructive">🚨 Emergencia — prioridad alta</span>
            </div>
          )}

          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg mx-4">
            <div className="bg-primary/5 px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Droplets className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Problema</p>
                  <p className="font-semibold text-foreground">{problemText}</p>
                </div>
              </div>
            </div>

            {formData.locations.length > 0 && <Row icon={MapPin} label="Ubicación" value={formData.locations.map(l => locationLabels[l] || l).join(', ')} />}
            {formData.severity && <Row icon={Gauge} label="Gravedad" value={severityLabels[formData.severity] || formData.severity} />}
            {formData.waterShut && <Row icon={Droplets} label="¿Agua cerrada?" value={waterShutLabels[formData.waterShut] || formData.waterShut} />}
            {formData.buildingType && <Row icon={Building} label="Tipo de instalación" value={buildingLabels[formData.buildingType] || formData.buildingType} />}
            {formData.buildingType === 'apartment' && formData.affectsOthers && (
              <Row icon={Building} label="¿Afecta a otros?" value={formData.affectsOthers === 'yes' ? 'Sí' : formData.affectsOthers === 'no' ? 'No' : 'No sé'} />
            )}
            {formData.accessChecks.length > 0 && <Row icon={KeyRound} label="Accesos" value={formData.accessChecks.map(a => accessLabels[a] || a).join(', ')} />}
            {formData.materialsProvider && <Row icon={Wrench} label="Materiales" value={materialsLabels[formData.materialsProvider] || ''} />}
            {formData.hasParts && <Row icon={Wrench} label="¿Tiene refacciones?" value={partsLabels[formData.hasParts] || ''} />}
            {formData.installationAge && <Row icon={Clock} label="Antigüedad" value={ageLabels[formData.installationAge] || formData.installationAge} />}
            {formData.photos.filter(p => p.uploaded).length > 0 && (
              <Row icon={Camera} label="Fotos" value={`${formData.photos.filter(p => p.uploaded).length} foto(s)`} />
            )}
            {formData.schedule && <Row icon={CalendarClock} label="Horario" value={scheduleLabels[formData.schedule] || formData.schedule} />}
            {formData.additionalNotes.trim() && (
              <Row icon={Wrench} label="Notas adicionales" value={formData.additionalNotes} />
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
                `Confirmar y buscar plomero (${countdown}s)`
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
