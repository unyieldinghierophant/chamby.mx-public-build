import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Check, Camera, ArrowLeft, Droplets, ShowerHead, Wrench, AlertTriangle, Gauge, Building, Home, KeyRound, Clock, CalendarClock, HelpCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { JobSuccessScreen } from "@/components/JobSuccessScreen";
import { VisitFeeAuthorizationSection } from "@/components/payments/VisitFeeAuthorizationSection";
import { PlumbingSummary } from "./PlumbingSummary";
import { PlumbingStepIndicator } from "./PlumbingStepIndicator";

// ---- Types ----
type PlumbingProblem = "fuga" | "tapada" | "instalacion" | "sanitario" | "presion" | "olor" | "emergencia" | "otro";
type PlumbingLocation = "bano" | "cocina" | "patio" | "azotea" | "comun" | "otro";
type Severity = "low" | "medium" | "high";
type WaterShut = "yes" | "no" | "unsure";
type BuildingType = "house" | "apartment" | "commercial";
type AffectsOthers = "yes" | "no" | "unsure";
type AccessCheck = "shutoff_accessible" | "meter_accessible" | "admin_permission" | "cut_general";
type MaterialsProvider = "client" | "provider" | "onsite";
type HasParts = "yes" | "no" | "unsure";
type InstallationAge = "new" | "mid" | "old" | "unsure";
type Schedule = "asap" | "today" | "specific" | "flexible";

interface UploadedFile {
  file: File | null;
  url: string;
  uploaded: boolean;
}

interface PlumbingFormData {
  problem: PlumbingProblem | null;
  otherProblem: string;
  locations: PlumbingLocation[];
  severity: Severity | null;
  waterShut: WaterShut | null;
  buildingType: BuildingType | null;
  affectsOthers: AffectsOthers | null;
  accessChecks: AccessCheck[];
  materialsProvider: MaterialsProvider | null;
  hasParts: HasParts | null;
  installationAge: InstallationAge | null;
  photos: UploadedFile[];
  schedule: Schedule | null;
  additionalNotes: string;
}

const TOTAL_STEPS = 10;

export const PlumbingBookingFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveFormData, loadFormData, clearFormData } = useFormPersistence('plumbing-booking');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<PlumbingFormData>({
    problem: null,
    otherProblem: "",
    locations: [],
    severity: null,
    waterShut: null,
    buildingType: null,
    affectsOthers: null,
    accessChecks: [],
    materialsProvider: null,
    hasParts: null,
    installationAge: null,
    photos: [],
    schedule: null,
    additionalNotes: "",
  });

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showVisitFeeAuth, setShowVisitFeeAuth] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [visitFeeAuthorized, setVisitFeeAuthorized] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved data
  useEffect(() => {
    const saved = loadFormData();
    if (saved?.plumbingFormData) {
      setFormData(prev => ({ ...prev, ...saved.plumbingFormData, photos: [] }));
      setCurrentStep(saved.currentStep || 1);
    }
    setIsLoading(false);
  }, []);

  // Auto-save
  useEffect(() => {
    if (formData.problem) {
      saveFormData({ plumbingFormData: { ...formData, photos: [] }, currentStep });
    }
  }, [formData, currentStep]);

  // ---- Helpers ----
  const update = <K extends keyof PlumbingFormData>(key: K, value: PlumbingFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleLocation = (loc: PlumbingLocation) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.includes(loc)
        ? prev.locations.filter(l => l !== loc)
        : [...prev.locations, loc],
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
      case 1: return formData.problem !== null && (formData.problem !== 'otro' || formData.otherProblem.trim().length >= 5);
      case 2: return formData.locations.length > 0;
      case 3: return formData.severity !== null;
      case 4: return formData.waterShut !== null;
      case 5: return formData.buildingType !== null && (formData.buildingType !== 'apartment' || formData.affectsOthers !== null);
      case 6: return true; // optional
      case 7: return formData.materialsProvider !== null && formData.hasParts !== null;
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

  // ---- Upload ----
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

  // ---- Submit ----
  const handleSubmit = async () => {
    if (!user) { setShowAuthModal(true); return; }
    setIsSubmitting(true);

    try {
      const problemLabels: Record<PlumbingProblem, string> = {
        fuga: "Fuga de agua", tapada: "Tubería tapada",
        instalacion: "Instalación (WC, lavabo, regadera, boiler)", sanitario: "Reparación de sanitario",
        presion: "Baja presión", olor: "Olor a drenaje", emergencia: "Emergencia (fuga activa)", otro: "Otro",
      };
      const locationLabels: Record<PlumbingLocation, string> = {
        bano: "Baño", cocina: "Cocina", patio: "Patio", azotea: "Azotea", comun: "Área común", otro: "Otro",
      };
      const severityLabels: Record<Severity, string> = {
        low: "Leve (goteo / lento)", medium: "Media (afecta uso)", high: "Alta (inunda / no se puede usar)",
      };
      const waterLabels: Record<WaterShut, string> = { yes: "Sí", no: "No", unsure: "No sé" };
      const buildingLabels: Record<BuildingType, string> = { house: "Casa", apartment: "Departamento", commercial: "Local / oficina" };
      const accessLabels: Record<AccessCheck, string> = {
        shutoff_accessible: "Llave de paso accesible", meter_accessible: "Medidor accesible",
        admin_permission: "Requiere permiso del administrador", cut_general: "Requiere cortar agua general",
      };
      const matLabels: Record<MaterialsProvider, string> = { client: "Yo", provider: "El proveedor", onsite: "A definir en sitio" };
      const partsLabels: Record<HasParts, string> = { yes: "Sí", no: "No", unsure: "No sé" };
      const ageLabels: Record<InstallationAge, string> = { new: "<5 años", mid: "5–15 años", old: "15+ años", unsure: "No sé" };
      const schedLabels: Record<Schedule, string> = { asap: "Lo antes posible", today: "Hoy", specific: "Fecha específica", flexible: "Flexible" };

      const problemText = formData.problem === 'otro'
        ? (formData.otherProblem || 'Otro')
        : (formData.problem ? problemLabels[formData.problem] : 'N/A');

      const isEmergency = formData.problem === 'emergencia';

      const parts = [
        `🔧 Problema: ${problemText}${isEmergency ? ' 🚨' : ''}`,
        `\n📍 Ubicación: ${formData.locations.map(l => locationLabels[l]).join(', ')}`,
        `⚠️ Gravedad: ${formData.severity ? severityLabels[formData.severity] : 'N/A'}`,
        `💧 ¿Agua cerrada?: ${formData.waterShut ? waterLabels[formData.waterShut] : 'N/A'}`,
        `🏠 Tipo: ${formData.buildingType ? buildingLabels[formData.buildingType] : 'N/A'}`,
      ];

      if (formData.buildingType === 'apartment' && formData.affectsOthers) {
        parts.push(`   ¿Afecta a otros?: ${formData.affectsOthers === 'yes' ? 'Sí' : formData.affectsOthers === 'no' ? 'No' : 'No sé'}`);
      }

      if (formData.accessChecks.length > 0) {
        parts.push(`\n🔑 Accesos:\n${formData.accessChecks.map(a => `  • ${accessLabels[a]}`).join('\n')}`);
      }

      parts.push(`\n🧱 Materiales: ${formData.materialsProvider ? matLabels[formData.materialsProvider] : 'N/A'}`);
      parts.push(`🔩 Refacciones: ${formData.hasParts ? partsLabels[formData.hasParts] : 'N/A'}`);
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
          title: `Fontanería: ${problemText.substring(0, 80)}`,
          description: richDescription,
          category: 'Fontanería',
          service_type: formData.problem || 'general',
          problem: richDescription,
          location: '',
          photos: formData.photos.filter(f => f.uploaded).map(f => f.url),
          rate: 1,
          status: 'active',
          scheduled_at: scheduledDate.toISOString(),
          time_preference: formData.schedule || '',
          exact_time: '',
          budget: '',
          urgent: isEmergency,
          photo_count: formData.photos.filter(f => f.uploaded).length,
        })
        .select('id')
        .single();

      if (error) throw error;

      clearFormData();
      setCreatedJobId(newJob.id);
      setShowSummary(false);
      setShowVisitFeeAuth(true);
    } catch (err: any) {
      toast({ title: "Error al enviar solicitud", description: err?.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthLogin = () => {
    saveFormData({ plumbingFormData: { ...formData, photos: [] }, currentStep });
    const returnPath = '/book-job?category=Fontanería';
    sessionStorage.setItem('auth_return_to', returnPath);
    localStorage.setItem('auth_return_to', returnPath);
    localStorage.setItem('booking_category', 'Fontanería');
    navigate('/login', { state: { returnTo: returnPath } });
  };

  const handleVisitFeeAuthorized = () => {
    setVisitFeeAuthorized(true);
    setShowVisitFeeAuth(false);
    setShowSuccess(true);
  };

  const handleSkipVisitFee = () => {
    setShowVisitFeeAuth(false);
    setShowSuccess(true);
  };

  const handleSuccessNavigate = () => {
    if (visitFeeAuthorized) {
      navigate(`/esperando-proveedor?job_id=${createdJobId}`);
    } else {
      navigate(`/job/${createdJobId}/payment`);
    }
  };

  // ---- Loading ----
  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-14 w-full" />
        <Skeleton className="h-14 w-full" />
      </div>
    );
  }

  // ---- Post-submit screens ----
  if (showSuccess && createdJobId) {
    return <JobSuccessScreen jobId={createdJobId} onNavigate={handleSuccessNavigate} visitFeeAuthorized={visitFeeAuthorized} />;
  }
  if (showVisitFeeAuth && createdJobId) {
    return (
      <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-jakarta font-medium text-foreground">¡Solicitud creada!</h1>
          <p className="text-muted-foreground">Ahora asegura tu visita para continuar</p>
        </div>
        <VisitFeeAuthorizationSection jobId={createdJobId} onAuthorized={handleVisitFeeAuthorized} onFailed={() => {}} onSkip={handleSkipVisitFee} />
      </div>
    );
  }

  // ---- Summary ----
  if (showSummary) {
    return (
      <PlumbingSummary
        formData={formData}
        onConfirm={handleSubmit}
        onGoBack={handleBack}
        isSubmitting={isSubmitting}
      />
    );
  }

  // ---- Chip component ----
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

      <PlumbingStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div className="mt-8 space-y-6 animate-fade-in" key={currentStep}>

        {/* ---- STEP 1: Problem ---- */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Qué problema tienes?</h1>
              <p className="text-muted-foreground mt-2">Selecciona el que mejor describa tu situación</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.problem === 'fuga'} onClick={() => update("problem", "fuga")} icon={Droplets}>💧 Fuga de agua</Chip>
              <Chip selected={formData.problem === 'tapada'} onClick={() => update("problem", "tapada")}>🚫 Tubería tapada</Chip>
              <Chip selected={formData.problem === 'instalacion'} onClick={() => update("problem", "instalacion")} icon={ShowerHead}>🚿 Instalación (WC, lavabo, regadera, boiler)</Chip>
              <Chip selected={formData.problem === 'sanitario'} onClick={() => update("problem", "sanitario")}>🚽 Reparación de sanitario</Chip>
              <Chip selected={formData.problem === 'presion'} onClick={() => update("problem", "presion")} icon={Gauge}>📉 Baja presión</Chip>
              <Chip selected={formData.problem === 'olor'} onClick={() => update("problem", "olor")}>👃 Olor a drenaje</Chip>
              <Chip selected={formData.problem === 'emergencia'} onClick={() => update("problem", "emergencia")} icon={AlertTriangle}>🚨 Emergencia (fuga activa)</Chip>
              <Chip selected={formData.problem === 'otro'} onClick={() => update("problem", "otro")}>📝 Otro</Chip>
            </div>
            {formData.problem === 'emergencia' && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl">
                <p className="text-sm font-medium text-destructive">⚡ Se marcará como prioridad alta para encontrar un plomero lo antes posible.</p>
              </div>
            )}
            {formData.problem === 'otro' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Describe el problema</Label>
                <Input
                  value={formData.otherProblem}
                  onChange={(e) => update("otherProblem", e.target.value)}
                  placeholder="Ej: Cambiar válvula de tanque"
                  className="h-12"
                  maxLength={200}
                />
              </div>
            )}
          </div>
        )}

        {/* ---- STEP 2: Location ---- */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Dónde ocurre?</h1>
              <p className="text-muted-foreground mt-2">Selecciona todas las áreas afectadas</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.locations.includes('bano')} onClick={() => toggleLocation('bano')}>🚿 Baño</CheckChip>
              <CheckChip selected={formData.locations.includes('cocina')} onClick={() => toggleLocation('cocina')}>🍳 Cocina</CheckChip>
              <CheckChip selected={formData.locations.includes('patio')} onClick={() => toggleLocation('patio')}>🌿 Patio</CheckChip>
              <CheckChip selected={formData.locations.includes('azotea')} onClick={() => toggleLocation('azotea')}>🏗️ Azotea</CheckChip>
              <CheckChip selected={formData.locations.includes('comun')} onClick={() => toggleLocation('comun')}>🏢 Área común</CheckChip>
              <CheckChip selected={formData.locations.includes('otro')} onClick={() => toggleLocation('otro')}>📍 Otro</CheckChip>
            </div>
          </div>
        )}

        {/* ---- STEP 3: Severity ---- */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Qué tan grave es?</h1>
              <p className="text-muted-foreground mt-2">Esto ayuda al plomero a prepararse</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.severity === 'low'} onClick={() => update("severity", "low")}>💧 Leve (goteo / lento)</Chip>
              <Chip selected={formData.severity === 'medium'} onClick={() => update("severity", "medium")} icon={Gauge}>⚠️ Media (afecta uso)</Chip>
              <Chip selected={formData.severity === 'high'} onClick={() => update("severity", "high")} icon={AlertTriangle}>🔴 Alta (inunda / no se puede usar)</Chip>
            </div>
          </div>
        )}

        {/* ---- STEP 4: Water shut ---- */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿El agua está cerrada?</h1>
              <p className="text-muted-foreground mt-2">Saber esto ayuda al plomero a planear</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.waterShut === 'yes'} onClick={() => update("waterShut", "yes")}>✅ Sí</Chip>
              <Chip selected={formData.waterShut === 'no'} onClick={() => update("waterShut", "no")}>❌ No</Chip>
              <Chip selected={formData.waterShut === 'unsure'} onClick={() => update("waterShut", "unsure")} icon={HelpCircle}>🤷 No sé</Chip>
            </div>
          </div>
        )}

        {/* ---- STEP 5: Building type ---- */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Tipo de instalación</h1>
              <p className="text-muted-foreground mt-2">¿Dónde se realizará el trabajo?</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.buildingType === 'house'} onClick={() => update("buildingType", "house")} icon={Home}>🏡 Casa</Chip>
              <Chip selected={formData.buildingType === 'apartment'} onClick={() => update("buildingType", "apartment")} icon={Building}>🏢 Departamento</Chip>
              <Chip selected={formData.buildingType === 'commercial'} onClick={() => update("buildingType", "commercial")}>🏪 Local / oficina</Chip>
            </div>
            {formData.buildingType === 'apartment' && (
              <div className="space-y-3 mt-4 p-4 bg-accent/30 rounded-2xl border border-border">
                <p className="text-sm font-medium text-foreground">¿El problema afecta a otros departamentos?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.affectsOthers === 'yes'} onClick={() => update("affectsOthers", "yes")}>Sí</Chip>
                  <Chip selected={formData.affectsOthers === 'no'} onClick={() => update("affectsOthers", "no")}>No</Chip>
                  <Chip selected={formData.affectsOthers === 'unsure'} onClick={() => update("affectsOthers", "unsure")}>No sé</Chip>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- STEP 6: Access & permissions ---- */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Accesos y permisos</h1>
              <p className="text-muted-foreground mt-2">Selecciona lo que aplique</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.accessChecks.includes('shutoff_accessible')} onClick={() => toggleAccess('shutoff_accessible')}>🔧 Llave de paso accesible</CheckChip>
              <CheckChip selected={formData.accessChecks.includes('meter_accessible')} onClick={() => toggleAccess('meter_accessible')}>📊 Medidor accesible</CheckChip>
              <CheckChip selected={formData.accessChecks.includes('admin_permission')} onClick={() => toggleAccess('admin_permission')}>👤 Requiere permiso del administrador</CheckChip>
              <CheckChip selected={formData.accessChecks.includes('cut_general')} onClick={() => toggleAccess('cut_general')}>🚫 Requiere cortar agua general</CheckChip>
            </div>
          </div>
        )}

        {/* ---- STEP 7: Materials & parts ---- */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Materiales y refacciones</h1>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Quién compra materiales?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.materialsProvider === 'client'} onClick={() => update("materialsProvider", "client")}>🙋 Yo</Chip>
                  <Chip selected={formData.materialsProvider === 'provider'} onClick={() => update("materialsProvider", "provider")}>👷 El proveedor</Chip>
                  <Chip selected={formData.materialsProvider === 'onsite'} onClick={() => update("materialsProvider", "onsite")}>📍 A definir en sitio</Chip>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Tienes refacciones?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.hasParts === 'yes'} onClick={() => update("hasParts", "yes")}>✅ Sí</Chip>
                  <Chip selected={formData.hasParts === 'no'} onClick={() => update("hasParts", "no")}>❌ No</Chip>
                  <Chip selected={formData.hasParts === 'unsure'} onClick={() => update("hasParts", "unsure")} icon={HelpCircle}>🤷 No sé</Chip>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ---- STEP 8: Installation age ---- */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Antigüedad de la instalación</h1>
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

        {/* ---- STEP 9: Photos ---- */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Fotos / video del problema</h1>
              <p className="text-muted-foreground mt-2">Ayuda a evaluar herramientas y refacciones necesarias</p>
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

        {/* ---- STEP 10: Schedule ---- */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Cuándo lo necesitas?</h1>
              <p className="text-muted-foreground mt-2">Selecciona tu preferencia de horario</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.schedule === 'asap'} onClick={() => update("schedule", "asap")} icon={AlertTriangle}>⚡ Lo antes posible</Chip>
              <Chip selected={formData.schedule === 'today'} onClick={() => update("schedule", "today")} icon={CalendarClock}>📅 Hoy</Chip>
              <Chip selected={formData.schedule === 'specific'} onClick={() => update("schedule", "specific")}>🗓️ Fecha específica</Chip>
              <Chip selected={formData.schedule === 'flexible'} onClick={() => update("schedule", "flexible")}>🤝 Flexible</Chip>
            </div>
            <div className="space-y-2 mt-4">
              <Label className="text-sm font-medium text-foreground">Algo más que el plomero deba saber (opcional)</Label>
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => update("additionalNotes", e.target.value)}
                placeholder="Ej: La fuga es detrás del refrigerador..."
                className="min-h-[80px]"
                maxLength={500}
              />
            </div>
          </div>
        )}
      </div>

      {/* ---- Nav ---- */}
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

      {/* Progress bar mobile */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 h-1 bg-muted z-40">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(currentStep / TOTAL_STEPS) * 100}%` }} />
      </div>
    </div>
  );
};
