import { Button } from "@/components/ui/button";
import { Check, Zap, MapPin, AlertTriangle, Building, Wrench, KeyRound, Clock, Camera, CalendarClock, ArrowLeft } from "lucide-react";
import toolsPatternBg from "@/assets/tools-pattern-bg.png";
import { useEffect, useState } from "react";

const serviceLabels: Record<string, string> = {
  apagon: "Apagón / falla", corto: "Corto / breaker se baja",
  instalacion: "Instalación (lámpara, ventilador, contacto)", reemplazo: "Reemplazo (apagador, toma, foco)",
  nuevo_punto: "Nuevo punto eléctrico", diagnostico: "Diagnóstico", emergencia: "Emergencia (riesgo)",
};
const locationLabels: Record<string, string> = {
  sala: "Sala", cocina: "Cocina", bano: "Baño", recamara: "Recámara",
  exterior: "Exterior", comun: "Área común", otro: "Otro",
};
const riskLabels: Record<string, string> = { no: "No", yes: "Sí (chispas, olor a quemado, cables expuestos)" };
const buildingLabels: Record<string, string> = { house: "Casa", apartment: "Departamento", commercial: "Local / oficina" };
const equipmentLabels: Record<string, string> = {
  lampara: "Lámpara", ventilador: "Ventilador de techo", contacto: "Contacto",
  apagador: "Apagador", breaker: "Breaker", otro: "Otro",
};
const materialsLabels: Record<string, string> = { client: "Yo", provider: "El proveedor", onsite: "A definir en sitio" };
const accessLabels: Record<string, string> = {
  breaker_accessible: "Tablero/breaker accesible", height: "Altura (escalera necesaria)",
  drilling: "Requiere perforar", cut_power: "Requiere cortar energía general", admin_permission: "Permisos del administrador",
};
const ageLabels: Record<string, string> = { new: "<5 años", mid: "5–15 años", old: "15+ años", unsure: "No sé" };
const scheduleLabels: Record<string, string> = { asap: "Lo antes posible", today: "Hoy", specific: "Fecha específica", flexible: "Flexible" };

interface Props {
  formData: {
    service: string | null;
    locations: string[];
    immediateRisk: string | null;
    buildingType: string | null;
    affectsOthers: string | null;
    equipment: string[];
    otherEquipment: string;
    materialsProvider: string | null;
    hasEquipment: string | null;
    accessChecks: string[];
    installationAge: string | null;
    photos: { url: string; uploaded: boolean }[];
    schedule: string | null;
    additionalNotes: string;
  };
  onConfirm: () => void;
  onGoBack: () => void;
  isSubmitting: boolean;
}

export const ElectricalSummary = ({ formData, onConfirm, onGoBack, isSubmitting }: Props) => {
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

  const serviceText = formData.service ? (serviceLabels[formData.service] || formData.service) : '';
  const isEmergency = formData.service === 'emergencia';
  const hasRisk = formData.immediateRisk === 'yes';

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-yellow-50 dark:bg-yellow-950/20" style={{ backgroundImage: `url(${toolsPatternBg})`, backgroundSize: '400px', backgroundRepeat: 'repeat' }} />

      <div className="flex-1 flex items-end sm:items-center justify-center p-4">
        <div className="w-full max-w-xl bg-card rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-in-from-bottom relative z-10 max-h-[90vh] overflow-y-auto">
          <div className="text-center space-y-1 px-6 pt-6 pb-4">
            <h1 className="text-xl md:text-2xl font-bold text-foreground font-['Made_Dillan']">Resumen de tu solicitud</h1>
            <p className="text-sm text-muted-foreground">Verifica que todo esté correcto</p>
          </div>

          {(isEmergency || hasRisk) && (
            <div className="mx-4 mb-3 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              <span className="text-sm font-semibold text-destructive">
                {isEmergency ? '🚨 Emergencia — prioridad alta' : '⚠️ Riesgo inmediato detectado'}
              </span>
            </div>
          )}

          <div className="bg-card border-2 border-border rounded-2xl overflow-hidden shadow-lg mx-4">
            <div className="bg-primary/5 px-5 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Servicio</p>
                  <p className="font-semibold text-foreground">{serviceText}</p>
                </div>
              </div>
            </div>

            {formData.locations.length > 0 && <Row icon={MapPin} label="Ubicación" value={formData.locations.map(l => locationLabels[l] || l).join(', ')} />}
            {formData.immediateRisk && <Row icon={AlertTriangle} label="Riesgo inmediato" value={riskLabels[formData.immediateRisk] || formData.immediateRisk} />}
            {formData.buildingType && <Row icon={Building} label="Tipo de inmueble" value={buildingLabels[formData.buildingType] || formData.buildingType} />}
            {formData.buildingType === 'apartment' && formData.affectsOthers && (
              <Row icon={Building} label="¿Afecta a otros?" value={formData.affectsOthers === 'yes' ? 'Sí' : formData.affectsOthers === 'no' ? 'No' : 'No sé'} />
            )}
            {formData.equipment.length > 0 && (
              <Row icon={Wrench} label="Equipo" value={formData.equipment.map(e => e === 'otro' ? (formData.otherEquipment || 'Otro') : (equipmentLabels[e] || e)).join(', ')} />
            )}
            {formData.materialsProvider && <Row icon={Wrench} label="Materiales" value={materialsLabels[formData.materialsProvider] || ''} />}
            {formData.hasEquipment && <Row icon={Wrench} label="¿Tiene el equipo?" value={formData.hasEquipment === 'yes' ? 'Sí' : 'No'} />}
            {formData.accessChecks.length > 0 && <Row icon={KeyRound} label="Accesos" value={formData.accessChecks.map(a => accessLabels[a] || a).join(', ')} />}
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
                `Confirmar y buscar electricista (${countdown}s)`
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
