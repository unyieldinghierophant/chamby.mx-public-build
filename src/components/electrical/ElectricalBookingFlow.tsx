import { useState, useEffect } from "react";
import { VISIT_BASE_FEE } from "@/utils/pricingConfig";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Check, Camera, ArrowLeft, Zap, Lightbulb, AlertTriangle, Building, Home, KeyRound, Clock, CalendarClock, HelpCircle, Loader2, Fan, PlugZap } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { JobSuccessScreen } from "@/components/JobSuccessScreen";
// DEPRECATED: Authorization flow disabled in favor of Checkout flow. See Phase 4 S5.
// import { VisitFeeAuthorizationSection } from "@/components/payments/VisitFeeAuthorizationSection";
import { useVisitFeeCheckout } from "@/hooks/useVisitFeeCheckout";
import { ElectricalSummary } from "./ElectricalSummary";
import { ElectricalStepIndicator } from "./ElectricalStepIndicator";

// ---- Types ----
type ElectricalService = "apagon" | "corto" | "instalacion" | "reemplazo" | "nuevo_punto" | "diagnostico" | "emergencia";
type ElectricalLocation = "sala" | "cocina" | "bano" | "recamara" | "exterior" | "comun" | "otro";
type ImmediateRisk = "no" | "yes";
type BuildingType = "house" | "apartment" | "commercial";
type AffectsOthers = "yes" | "no" | "unsure";
type Equipment = "lampara" | "ventilador" | "contacto" | "apagador" | "breaker" | "otro";
type MaterialsProvider = "client" | "provider" | "onsite";
type HasEquipment = "yes" | "no";
type AccessCheck = "breaker_accessible" | "height" | "drilling" | "cut_power" | "admin_permission";
type InstallationAge = "new" | "mid" | "old" | "unsure";
type Schedule = "asap" | "today" | "specific" | "flexible";

interface UploadedFile {
  file: File | null;
  url: string;
  uploaded: boolean;
}

interface ElectricalFormData {
  service: ElectricalService | null;
  locations: ElectricalLocation[];
  immediateRisk: ImmediateRisk | null;
  buildingType: BuildingType | null;
  affectsOthers: AffectsOthers | null;
  equipment: Equipment[];
  otherEquipment: string;
  materialsProvider: MaterialsProvider | null;
  hasEquipment: HasEquipment | null;
  accessChecks: AccessCheck[];
  installationAge: InstallationAge | null;
  photos: UploadedFile[];
  schedule: Schedule | null;
  additionalNotes: string;
}

const TOTAL_STEPS = 10;

// Keyword → service mapping for intent matching
const SERVICE_KEYWORDS: Record<ElectricalService, string[]> = {
  apagon: ["apagon", "apagón", "sin luz", "no hay luz", "se fue la luz", "falla", "no funciona la luz", "no prende"],
  corto: ["corto", "cortocircuito", "breaker", "se baja", "se dispara", "chispazo", "truena"],
  instalacion: ["instalar", "instalacion", "instalación", "poner", "colocar", "montar", "lampara", "lámpara", "ventilador", "contacto", "techo"],
  reemplazo: ["cambiar", "reemplazar", "reemplazo", "apagador", "foco", "focos", "toma", "switch", "bombilla"],
  nuevo_punto: ["nuevo punto", "punto electrico", "punto eléctrico", "agregar contacto", "nueva toma", "nuevo enchufe"],
  diagnostico: ["diagnostico", "diagnóstico", "revisar", "revision", "revisión", "checar", "verificar", "inspeccionar"],
  emergencia: ["emergencia", "urgente", "riesgo", "humo", "quemado", "fuego", "olor a quemado", "chispas"],
};

function matchIntentToService(intent: string): { service: ElectricalService | null; additionalNotes: string } {
  if (!intent.trim()) return { service: null, additionalNotes: "" };
  const q = intent.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let bestMatch: ElectricalService | null = null;
  let bestScore = 0;

  for (const [svc, keywords] of Object.entries(SERVICE_KEYWORDS) as [ElectricalService, string[]][]) {
    for (const kw of keywords) {
      const nkw = kw.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      if (q.includes(nkw)) {
        const score = nkw.length;
        if (score > bestScore) { bestScore = score; bestMatch = svc; }
      }
    }
  }
  return { service: bestMatch, additionalNotes: intent };
}

interface ElectricalBookingFlowProps {
  intentText?: string;
}

export const ElectricalBookingFlow = ({ intentText = "" }: ElectricalBookingFlowProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveFormData, loadFormData, clearFormData } = useFormPersistence('electrical-booking');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<ElectricalFormData>({
    service: null,
    locations: [],
    immediateRisk: null,
    buildingType: null,
    affectsOthers: null,
    equipment: [],
    otherEquipment: "",
    materialsProvider: null,
    hasEquipment: null,
    accessChecks: [],
    installationAge: null,
    photos: [],
    schedule: null,
    additionalNotes: "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  // DEPRECATED: showVisitFeeAuth removed — now using Checkout redirect. See Phase 4 S5.
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const { redirectToCheckout } = useVisitFeeCheckout();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const saved = loadFormData();
    if (saved?.electricalFormData) {
      setFormData(prev => ({ ...prev, ...saved.electricalFormData, photos: [] }));
      setCurrentStep(saved.currentStep || 1);
    } else if (intentText) {
      // Auto-match search intent to a service pill and skip to step 2
      const { service, additionalNotes } = matchIntentToService(intentText);
      setFormData(prev => ({
        ...prev,
        service,
        additionalNotes: additionalNotes || prev.additionalNotes,
      }));
      if (service) setCurrentStep(2);
    }
    setIsLoading(false);
  }, []);


  useEffect(() => {
    if (formData.service) {
      saveFormData({ electricalFormData: { ...formData, photos: [] }, currentStep });
    }
  }, [formData, currentStep]);

  const update = <K extends keyof ElectricalFormData>(key: K, value: ElectricalFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleLocation = (loc: ElectricalLocation) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(loc)
        ? prev.locations.filter(l => l !== loc)
        : [...prev.locations, loc],
    }));
  };

  const toggleEquipment = (eq: Equipment) => {
    setFormData(prev => ({
      ...prev,
      equipment: prev.equipment.includes(eq)
        ? prev.equipment.filter(e => e !== eq)
        : [...prev.equipment, eq],
    }));
  };

  const toggleAccess = (access: AccessCheck) => {
    setFormData(prev => ({
      ...prev,
      accessChecks: prev.accessChecks.includes(access)
        ? prev.accessChecks.filter(a => a !== access)
        : [...prev.accessChecks, access],
    }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return formData.service !== null;
      case 2: return formData.locations.length > 0;
      case 3: return formData.immediateRisk !== null;
      case 4: return formData.buildingType !== null && (formData.buildingType !== 'apartment' || formData.affectsOthers !== null);
      case 5: return true; // optional
      case 6: return formData.materialsProvider !== null && formData.hasEquipment !== null;
      case 7: return true; // optional
      case 8: return formData.installationAge !== null;
      case 9: return true; // photos optional
      case 10: return formData.schedule !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    } else if (currentStep === TOTAL_STEPS) {
      handleShowSummary();
    }
  };

  const handleBack = () => {
    if (showSummary) { setShowSummary(false); return; }
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleShowSummary = () => {
    if (!user) { setShowAuthModal(true); return; }
    setShowSummary(true);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setIsUploading(true);

    const newFiles: UploadedFile[] = files.map(f => ({ file: f, url: URL.createObjectURL(f), uploaded: false }));
    update("photos", [...formData.photos, ...newFiles]);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop();
      const path = user ? `${user.id}/${Math.random()}.${ext}` : `temp-uploads/${Math.random()}.${ext}`;

      try {
        const { error } = await supabase.storage.from('job-photos').upload(path, file);
        if (error) throw error;
        const { data: signed } = await supabase.storage.from('job-photos').createSignedUrl(path, 31536000);
        if (signed) {
          setFormData(prev => ({
            ...prev,
            photos: prev.photos.map((f, idx) =>
              idx === prev.photos.length - files.length + i
                ? { ...f, url: signed.signedUrl, uploaded: true }
                : f
            ),
          }));
        }
      } catch (err: any) {
        toast({ title: "Error al subir imagen", description: err?.message, variant: "destructive" });
      }
    }
    setIsUploading(false);
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!user) { setShowAuthModal(true); return; }
    setIsSubmitting(true);

    try {
      const serviceLabels: Record<ElectricalService, string> = {
        apagon: "Apagón / falla", corto: "Corto / breaker se baja",
        instalacion: "Instalación (lámpara, ventilador, contacto)", reemplazo: "Reemplazo (apagador, toma, foco)",
        nuevo_punto: "Nuevo punto eléctrico", diagnostico: "Diagnóstico", emergencia: "Emergencia (riesgo)",
      };
      const locationLabels: Record<ElectricalLocation, string> = {
        sala: "Sala", cocina: "Cocina", bano: "Baño", recamara: "Recámara",
        exterior: "Exterior", comun: "Área común", otro: "Otro",
      };
      const equipmentLabels: Record<Equipment, string> = {
        lampara: "Lámpara", ventilador: "Ventilador de techo", contacto: "Contacto",
        apagador: "Apagador", breaker: "Breaker", otro: "Otro",
      };
      const matLabels: Record<MaterialsProvider, string> = { client: "Yo", provider: "El proveedor", onsite: "A definir en sitio" };
      const accessLabels: Record<AccessCheck, string> = {
        breaker_accessible: "Tablero accesible", height: "Altura (escalera)", drilling: "Requiere perforar",
        cut_power: "Cortar energía general", admin_permission: "Permiso administrador",
      };
      const ageLabels: Record<InstallationAge, string> = { new: "<5 años", mid: "5–15 años", old: "15+ años", unsure: "No sé" };
      const schedLabels: Record<Schedule, string> = { asap: "Lo antes posible", today: "Hoy", specific: "Fecha específica", flexible: "Flexible" };

      const serviceText = formData.service ? serviceLabels[formData.service] : 'N/A';
      const isEmergency = formData.service === 'emergencia';
      const hasRisk = formData.immediateRisk === 'yes';

      const parts = [
        `⚡ Servicio: ${serviceText}${isEmergency ? ' 🚨' : ''}${hasRisk ? ' ⚠️ RIESGO' : ''}`,
        `\n📍 Ubicación: ${formData.locations.map(l => locationLabels[l]).join(', ')}`,
        `🔥 Riesgo inmediato: ${formData.immediateRisk === 'yes' ? 'Sí (chispas, olor, cables)' : 'No'}`,
        `🏠 Tipo: ${formData.buildingType === 'house' ? 'Casa' : formData.buildingType === 'apartment' ? 'Departamento' : 'Local / oficina'}`,
      ];

      if (formData.buildingType === 'apartment' && formData.affectsOthers) {
        parts.push(`   ¿Afecta a otros?: ${formData.affectsOthers === 'yes' ? 'Sí' : formData.affectsOthers === 'no' ? 'No' : 'No sé'}`);
      }

      if (formData.equipment.length > 0) {
        const eqText = formData.equipment.map(e => e === 'otro' ? (formData.otherEquipment || 'Otro') : equipmentLabels[e]).join(', ');
        parts.push(`\n🔌 Equipo: ${eqText}`);
      }

      parts.push(`🧱 Materiales: ${formData.materialsProvider ? matLabels[formData.materialsProvider] : 'N/A'}`);
      parts.push(`📦 ¿Tiene equipo?: ${formData.hasEquipment === 'yes' ? 'Sí' : 'No'}`);

      if (formData.accessChecks.length > 0) {
        parts.push(`\n🔑 Accesos:\n${formData.accessChecks.map(a => `  • ${accessLabels[a]}`).join('\n')}`);
      }

      parts.push(`📅 Antigüedad: ${formData.installationAge ? ageLabels[formData.installationAge] : 'N/A'}`);
      parts.push(`⏰ Horario: ${formData.schedule ? schedLabels[formData.schedule] : 'N/A'}`);

      if (formData.additionalNotes.trim()) {
        parts.push(`\n📝 Notas: ${formData.additionalNotes}`);
      }

      const richDescription = parts.join('\n');
      const scheduledDate = new Date(Date.now() + (isEmergency ? 2 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          client_id: user.id,
          provider_id: null,
          title: `Electricidad: ${serviceText.substring(0, 80)}`,
          description: richDescription,
          category: 'Electricidad',
          service_type: formData.service || 'general',
          problem: richDescription,
          location: '',
          photos: formData.photos.filter(f => f.uploaded).map(f => f.url),
          rate: VISIT_BASE_FEE,
          status: 'pending',
          scheduled_at: scheduledDate.toISOString(),
          time_preference: formData.schedule || '',
          exact_time: '',
          budget: '',
          urgent: isEmergency || hasRisk,
          photo_count: formData.photos.filter(f => f.uploaded).length,
        })
        .select('id')
        .single();

      if (error) throw error;

      clearFormData();
      setCreatedJobId(newJob.id);
      setShowSummary(false);
      await redirectToCheckout(newJob.id);
    } catch (err: any) {
      toast({ title: "Error al enviar solicitud", description: err?.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthLogin = () => {
    saveFormData({ electricalFormData: { ...formData, photos: [] }, currentStep });
    const returnPath = '/book-job?category=Electricidad';
    sessionStorage.setItem('auth_return_to', returnPath);
    localStorage.setItem('auth_return_to', returnPath);
    localStorage.setItem('booking_category', 'Electricidad');
    navigate('/login', { state: { returnTo: returnPath } });
  };

  // DEPRECATED: Authorization handlers removed in favor of Checkout flow. See Phase 4 S5.
  const handleSuccessNavigate = () => {
    navigate(`/esperando-proveedor?job_id=${createdJobId}`);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  if (showSuccess && createdJobId) {
    return <JobSuccessScreen jobId={createdJobId} onNavigate={handleSuccessNavigate} visitFeeAuthorized={true} />;
  }
  // DEPRECATED: VisitFeeAuthorizationSection block removed. See Phase 4 S5.

  if (showSummary) {
    return <ElectricalSummary formData={formData} onConfirm={handleSubmit} onGoBack={handleBack} isSubmitting={isSubmitting} />;
  }

  const Chip = ({ selected, onClick, children, icon: Icon }: { selected: boolean; onClick: () => void; children: React.ReactNode; icon?: React.ElementType }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-5 py-3 rounded-full border-2 text-sm font-medium transition-all active:scale-95",
        selected
          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20 shadow-md"
          : "border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent/50"
      )}
    >
      {Icon && <Icon className={cn("w-4 h-4", selected ? "text-primary" : "text-muted-foreground")} />}
      {children}
    </button>
  );

  const CheckChip = ({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 text-left",
        selected
          ? "border-primary bg-primary/10 text-primary"
          : "border-border bg-card text-foreground hover:border-primary/40"
      )}
    >
      <div className={cn(
        "w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors",
        selected ? "border-primary bg-primary" : "border-muted-foreground/30"
      )}>
        {selected && <Check className="w-3 h-3 text-primary-foreground" />}
      </div>
      {children}
    </button>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} onLogin={handleAuthLogin} onGuest={() => {}} showGuestOption={false} />

      <ElectricalStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div className="mt-8 space-y-6 animate-fade-in" key={currentStep}>

        {/* STEP 1: Service */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Qué necesitas?</h1>
              <p className="text-muted-foreground mt-2">Selecciona el servicio que mejor describa tu situación</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.service === 'apagon'} onClick={() => update("service", "apagon")} icon={Zap}>💡 Apagón / falla</Chip>
              <Chip selected={formData.service === 'corto'} onClick={() => update("service", "corto")}>⚡ Corto / breaker se baja</Chip>
              <Chip selected={formData.service === 'instalacion'} onClick={() => update("service", "instalacion")} icon={Lightbulb}>🔧 Instalación (lámpara, ventilador, contacto)</Chip>
              <Chip selected={formData.service === 'reemplazo'} onClick={() => update("service", "reemplazo")}>🔄 Reemplazo (apagador, toma, foco)</Chip>
              <Chip selected={formData.service === 'nuevo_punto'} onClick={() => update("service", "nuevo_punto")} icon={PlugZap}>➕ Nuevo punto eléctrico</Chip>
              <Chip selected={formData.service === 'diagnostico'} onClick={() => update("service", "diagnostico")}>🔍 Diagnóstico</Chip>
              <Chip selected={formData.service === 'emergencia'} onClick={() => update("service", "emergencia")} icon={AlertTriangle}>🚨 Emergencia (riesgo)</Chip>
            </div>
            {formData.service === 'emergencia' && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                <p className="text-sm font-medium text-destructive">⚡ Se marcará como prioridad alta para encontrar un electricista lo antes posible.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Dónde está el problema?</h1>
              <p className="text-muted-foreground mt-2">Selecciona todas las áreas afectadas</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.locations.includes('sala')} onClick={() => toggleLocation('sala')}>🛋️ Sala</CheckChip>
              <CheckChip selected={formData.locations.includes('cocina')} onClick={() => toggleLocation('cocina')}>🍳 Cocina</CheckChip>
              <CheckChip selected={formData.locations.includes('bano')} onClick={() => toggleLocation('bano')}>🚿 Baño</CheckChip>
              <CheckChip selected={formData.locations.includes('recamara')} onClick={() => toggleLocation('recamara')}>🛏️ Recámara</CheckChip>
              <CheckChip selected={formData.locations.includes('exterior')} onClick={() => toggleLocation('exterior')}>🌿 Exterior</CheckChip>
              <CheckChip selected={formData.locations.includes('comun')} onClick={() => toggleLocation('comun')}>🏢 Área común</CheckChip>
              <CheckChip selected={formData.locations.includes('otro')} onClick={() => toggleLocation('otro')}>📍 Otro</CheckChip>
            </div>
          </div>
        )}

        {/* STEP 3: Immediate risk */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Hay riesgo inmediato?</h1>
              <p className="text-muted-foreground mt-2">Chispas, olor a quemado, cables expuestos</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.immediateRisk === 'no'} onClick={() => update("immediateRisk", "no")}>✅ No</Chip>
              <Chip selected={formData.immediateRisk === 'yes'} onClick={() => update("immediateRisk", "yes")} icon={AlertTriangle}>⚠️ Sí (chispas, olor a quemado, cables expuestos)</Chip>
            </div>
            {formData.immediateRisk === 'yes' && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                <p className="text-sm font-medium text-destructive">🛑 Por seguridad, evita usar el área hasta que llegue el técnico.</p>
              </div>
            )}
          </div>
        )}

        {/* STEP 4: Building type */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Tipo de inmueble</h1>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.buildingType === 'house'} onClick={() => update("buildingType", "house")} icon={Home}>🏡 Casa</Chip>
              <Chip selected={formData.buildingType === 'apartment'} onClick={() => update("buildingType", "apartment")} icon={Building}>🏢 Departamento</Chip>
              <Chip selected={formData.buildingType === 'commercial'} onClick={() => update("buildingType", "commercial")}>🏪 Local / oficina</Chip>
            </div>
            {formData.buildingType === 'apartment' && (
              <div className="space-y-3 mt-4 p-4 bg-accent/30 rounded-2xl border border-border">
                <p className="text-sm font-medium text-foreground">¿Afecta a otros departamentos?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.affectsOthers === 'yes'} onClick={() => update("affectsOthers", "yes")}>Sí</Chip>
                  <Chip selected={formData.affectsOthers === 'no'} onClick={() => update("affectsOthers", "no")}>No</Chip>
                  <Chip selected={formData.affectsOthers === 'unsure'} onClick={() => update("affectsOthers", "unsure")}>No sé</Chip>
                </div>
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Equipment */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Qué se va a instalar o reemplazar?</h1>
              <p className="text-muted-foreground mt-2">Selecciona lo que aplique (opcional)</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.equipment.includes('lampara')} onClick={() => toggleEquipment('lampara')}>💡 Lámpara</CheckChip>
              <CheckChip selected={formData.equipment.includes('ventilador')} onClick={() => toggleEquipment('ventilador')}>🌀 Ventilador de techo</CheckChip>
              <CheckChip selected={formData.equipment.includes('contacto')} onClick={() => toggleEquipment('contacto')}>🔌 Contacto</CheckChip>
              <CheckChip selected={formData.equipment.includes('apagador')} onClick={() => toggleEquipment('apagador')}>🔘 Apagador</CheckChip>
              <CheckChip selected={formData.equipment.includes('breaker')} onClick={() => toggleEquipment('breaker')}>⚡ Breaker</CheckChip>
              <CheckChip selected={formData.equipment.includes('otro')} onClick={() => toggleEquipment('otro')}>📝 Otro</CheckChip>
            </div>
            {formData.equipment.includes('otro') && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Describe el equipo</Label>
                <Input
                  value={formData.otherEquipment}
                  onChange={(e) => update("otherEquipment", e.target.value)}
                  placeholder="Ej: Timbre eléctrico"
                  className="h-12"
                  maxLength={200}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Materials */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Materiales</h1>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Quién provee materiales?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.materialsProvider === 'client'} onClick={() => update("materialsProvider", "client")}>🙋 Yo</Chip>
                  <Chip selected={formData.materialsProvider === 'provider'} onClick={() => update("materialsProvider", "provider")}>👷 El proveedor</Chip>
                  <Chip selected={formData.materialsProvider === 'onsite'} onClick={() => update("materialsProvider", "onsite")}>📍 A definir en sitio</Chip>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Ya tienes el equipo/artefacto?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.hasEquipment === 'yes'} onClick={() => update("hasEquipment", "yes")}>✅ Sí</Chip>
                  <Chip selected={formData.hasEquipment === 'no'} onClick={() => update("hasEquipment", "no")}>❌ No</Chip>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Access */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Accesos</h1>
              <p className="text-muted-foreground mt-2">Selecciona lo que aplique</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.accessChecks.includes('breaker_accessible')} onClick={() => toggleAccess('breaker_accessible')}>⚡ Tablero/breaker accesible</CheckChip>
              <CheckChip selected={formData.accessChecks.includes('height')} onClick={() => toggleAccess('height')}>🪜 Altura (escalera necesaria)</CheckChip>
              <CheckChip selected={formData.accessChecks.includes('drilling')} onClick={() => toggleAccess('drilling')}>🔩 Requiere perforar</CheckChip>
              <CheckChip selected={formData.accessChecks.includes('cut_power')} onClick={() => toggleAccess('cut_power')}>🔌 Requiere cortar energía general</CheckChip>
              <CheckChip selected={formData.accessChecks.includes('admin_permission')} onClick={() => toggleAccess('admin_permission')}>👤 Permisos del administrador</CheckChip>
            </div>
          </div>
        )}

        {/* STEP 8: Installation age */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Antigüedad del sistema eléctrico</h1>
              <p className="text-muted-foreground mt-2">Ayuda a preparar las herramientas correctas</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.installationAge === 'new'} onClick={() => update("installationAge", "new")} icon={Clock}>🆕 Menos de 5 años</Chip>
              <Chip selected={formData.installationAge === 'mid'} onClick={() => update("installationAge", "mid")}>📅 5–15 años</Chip>
              <Chip selected={formData.installationAge === 'old'} onClick={() => update("installationAge", "old")}>🏚️ 15+ años</Chip>
              <Chip selected={formData.installationAge === 'unsure'} onClick={() => update("installationAge", "unsure")} icon={HelpCircle}>🤷 No sé</Chip>
            </div>
          </div>
        )}

        {/* STEP 9: Photos */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Fotos / video</h1>
              <p className="text-muted-foreground mt-2">Fotos del área, tablero, cableado visible</p>
            </div>
            <label className={cn(
              "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
              isUploading ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/30"
            )}>
              <input type="file" multiple accept="image/*,video/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Subiendo...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Toca para subir fotos o video</span>
                </div>
              )}
            </label>
            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {formData.photos.map((photo, idx) => (
                  <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border">
                    <img src={photo.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    {photo.uploaded && (
                      <div className="absolute top-1 right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-primary-foreground" />
                      </div>
                    )}
                    <button
                      onClick={() => update("photos", formData.photos.filter((_, i) => i !== idx))}
                      className="absolute top-1 left-1 w-6 h-6 bg-destructive/80 rounded-full flex items-center justify-center text-destructive-foreground text-xs"
                    >✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 10: Schedule */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Cuándo lo necesitas?</h1>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.schedule === 'asap'} onClick={() => update("schedule", "asap")} icon={AlertTriangle}>⚡ Lo antes posible</Chip>
              <Chip selected={formData.schedule === 'today'} onClick={() => update("schedule", "today")} icon={CalendarClock}>📅 Hoy</Chip>
              <Chip selected={formData.schedule === 'specific'} onClick={() => update("schedule", "specific")}>🗓️ Fecha específica</Chip>
              <Chip selected={formData.schedule === 'flexible'} onClick={() => update("schedule", "flexible")}>🤝 Flexible</Chip>
            </div>
            <div className="space-y-2 mt-4">
              <Label className="text-sm font-medium text-foreground">Algo más que el electricista deba saber (opcional)</Label>
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => update("additionalNotes", e.target.value)}
                placeholder="Ej: El tablero está en el sótano..."
                className="min-h-[80px]"
                maxLength={500}
              />
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center gap-3 mt-8 mb-12">
        {currentStep > 1 && (
          <Button variant="outline" onClick={handleBack} className="h-12 px-6 rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
          </Button>
        )}
        <ModernButton
          onClick={handleNext}
          disabled={!canProceed()}
          className="flex-1 h-12 rounded-full text-base font-semibold"
        >
          {currentStep === TOTAL_STEPS ? "Ver resumen" : "Continuar"}
        </ModernButton>
      </div>

      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-1 bg-muted z-40">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} />
      </div>
    </div>
  );
};
