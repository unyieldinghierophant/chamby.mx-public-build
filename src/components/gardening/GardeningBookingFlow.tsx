import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Check, Camera, ArrowLeft, Leaf, TreePine, Recycle, CalendarClock, Home, HelpCircle, Loader2, Scissors, Flower2, Shovel, Sprout, Bug } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { JobSuccessScreen } from "@/components/JobSuccessScreen";
import { VisitFeeAuthorizationSection } from "@/components/payments/VisitFeeAuthorizationSection";
import { GardeningSummary } from "./GardeningSummary";
import { GardeningStepIndicator } from "./GardeningStepIndicator";

// ---- Types ----
type GardeningService = "corte_pasto" | "poda_plantas" | "poda_arboles" | "limpieza" | "diseno" | "maleza" | "otro";
type AreaSize = "small" | "medium" | "large";
type SpaceType = "frontal" | "trasero" | "azotea" | "comun" | "interior";
type TreeSize = "none" | "small" | "medium" | "large";
type ToolsAvailability = "all" | "some" | "none";
type MaterialsProvider = "client" | "provider" | "unsure";
type WasteRemoval = "yes" | "no" | "unsure";
type Frequency = "once" | "weekly" | "biweekly" | "monthly" | "tbd";
type AccessType = "easy" | "enter_house" | "restricted_hours" | "pets" | "noise_restricted";

interface UploadedFile {
  file: File | null;
  url: string;
  uploaded: boolean;
}

interface GardeningFormData {
  services: GardeningService[];
  otherService: string;
  areaSize: AreaSize | null;
  spaceTypes: SpaceType[];
  trees: TreeSize | null;
  toolsAvailable: ToolsAvailability | null;
  materialsProvider: MaterialsProvider | null;
  wasteRemoval: WasteRemoval | null;
  frequency: Frequency | null;
  photos: UploadedFile[];
  accessTypes: AccessType[];
  additionalNotes: string;
}

const TOTAL_STEPS = 9;

export const GardeningBookingFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveFormData, loadFormData, clearFormData } = useFormPersistence('gardening-booking');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<GardeningFormData>({
    services: [],
    otherService: "",
    areaSize: null,
    spaceTypes: [],
    trees: null,
    toolsAvailable: null,
    materialsProvider: null,
    wasteRemoval: null,
    frequency: null,
    photos: [],
    accessTypes: [],
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
    if (saved?.gardeningFormData) {
      setFormData(prev => ({ ...prev, ...saved.gardeningFormData, photos: [] }));
      setCurrentStep(saved.currentStep || 1);
    }
    setIsLoading(false);
  }, []);

  // Auto-save
  useEffect(() => {
    if (formData.services.length > 0) {
      saveFormData({ gardeningFormData: { ...formData, photos: [] }, currentStep });
    }
  }, [formData, currentStep]);

  // ---- Helpers ----
  const update = <K extends keyof GardeningFormData>(key: K, value: GardeningFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleService = (service: GardeningService) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  const toggleSpace = (space: SpaceType) => {
    setFormData(prev => ({
      ...prev,
      spaceTypes: prev.spaceTypes.includes(space)
        ? prev.spaceTypes.filter(s => s !== space)
        : [...prev.spaceTypes, space],
    }));
  };

  const toggleAccess = (access: AccessType) => {
    setFormData(prev => ({
      ...prev,
      accessTypes: prev.accessTypes.includes(access)
        ? prev.accessTypes.filter(a => a !== access)
        : [...prev.accessTypes, access],
    }));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return formData.services.length > 0 && (!formData.services.includes('otro') || formData.otherService.trim().length >= 5);
      case 2: return formData.areaSize !== null;
      case 3: return formData.spaceTypes.length > 0;
      case 4: return formData.trees !== null;
      case 5: return formData.toolsAvailable !== null && formData.materialsProvider !== null;
      case 6: return formData.wasteRemoval !== null;
      case 7: return formData.frequency !== null;
      case 8: return true; // photos optional
      case 9: return true; // access optional
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
      const serviceLabels: Record<GardeningService, string> = {
        corte_pasto: "Corte de pasto", poda_plantas: "Poda de plantas / arbustos",
        poda_arboles: "Poda de árboles", limpieza: "Limpieza general",
        diseno: "Diseño / mejora estética", maleza: "Retiro de maleza", otro: "Otro",
      };
      const areaSizeLabels: Record<AreaSize, string> = {
        small: "Pequeño (<50 m²)", medium: "Mediano (50–150 m²)", large: "Grande (150+ m²)",
      };
      const treeLabels: Record<TreeSize, string> = {
        none: "Sin árboles", small: "Pequeños (≤3 m)", medium: "Medianos (3–6 m)", large: "Grandes (6+ m)",
      };
      const toolsLabels: Record<ToolsAvailability, string> = {
        all: "Tiene todas", some: "Tiene algunas", none: "No tiene",
      };
      const matLabels: Record<MaterialsProvider, string> = {
        client: "Cliente provee", provider: "Proveedor trae", unsure: "No está seguro",
      };
      const wasteLabels: Record<WasteRemoval, string> = {
        yes: "Sí, retiro necesario", no: "Cliente se encarga", unsure: "No está seguro",
      };
      const freqLabels: Record<Frequency, string> = {
        once: "Una sola vez", weekly: "Semanal", biweekly: "Quincenal", monthly: "Mensual", tbd: "A definir",
      };
      const accessLabels: Record<AccessType, string> = {
        easy: "Acceso fácil", enter_house: "Requiere entrar a la casa",
        restricted_hours: "Horarios restringidos", pets: "Mascotas en el área",
        noise_restricted: "Ruido permitido solo en ciertos horarios",
      };

      const servicesText = formData.services
        .map(s => s === 'otro' ? (formData.otherService || 'Otro') : serviceLabels[s])
        .join(', ');

      const parts = [
        `🌿 Servicios: ${servicesText}`,
        `\n📏 Tamaño: ${formData.areaSize ? areaSizeLabels[formData.areaSize] : "N/A"}`,
        `🌳 Árboles: ${formData.trees ? treeLabels[formData.trees] : "N/A"}`,
        `🛠️ Herramientas: ${formData.toolsAvailable ? toolsLabels[formData.toolsAvailable] : "N/A"}`,
        `🧱 Materiales: ${formData.materialsProvider ? matLabels[formData.materialsProvider] : "N/A"}`,
        `♻️ Retiro de residuos: ${formData.wasteRemoval ? wasteLabels[formData.wasteRemoval] : "N/A"}`,
        `📅 Frecuencia: ${formData.frequency ? freqLabels[formData.frequency] : "N/A"}`,
      ];

      if (formData.accessTypes.length > 0) {
        parts.push(`\n🏠 Acceso:\n${formData.accessTypes.map(a => `  • ${accessLabels[a]}`).join('\n')}`);
      }
      if (formData.additionalNotes.trim()) {
        parts.push(`\n📝 Notas: ${formData.additionalNotes}`);
      }

      const richDescription = parts.join('\n');
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          client_id: user.id,
          provider_id: null,
          title: `Jardinería: ${servicesText.substring(0, 80)}`,
          description: richDescription,
          category: 'Jardinería',
          service_type: formData.services[0] || 'general',
          problem: richDescription,
          location: '',
          photos: formData.photos.filter(f => f.uploaded).map(f => f.url),
          rate: 1,
          status: 'active',
          scheduled_at: scheduledDate.toISOString(),
          time_preference: '',
          exact_time: '',
          budget: '',
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
    saveFormData({ gardeningFormData: { ...formData, photos: [] }, currentStep });
    sessionStorage.setItem('auth_return_to', '/book-job');
    localStorage.setItem('auth_return_to', '/book-job');
    navigate('/login', { state: { returnTo: '/book-job' } });
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
      <GardeningSummary
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

  // ---- Multi-select chip ----
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

      {/* Step Indicator */}
      <GardeningStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Step Content */}
      <div className="mt-8 space-y-6 animate-fade-in" key={currentStep}>

        {/* ---- STEP 1: Services ---- */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Qué necesitas en tu jardín?</h1>
              <p className="text-muted-foreground mt-2">Selecciona todo lo que aplique</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.services.includes('corte_pasto')} onClick={() => toggleService('corte_pasto')}>🌱 Corte de pasto</CheckChip>
              <CheckChip selected={formData.services.includes('poda_plantas')} onClick={() => toggleService('poda_plantas')}>✂️ Poda de plantas / arbustos</CheckChip>
              <CheckChip selected={formData.services.includes('poda_arboles')} onClick={() => toggleService('poda_arboles')}>🌳 Poda de árboles</CheckChip>
              <CheckChip selected={formData.services.includes('limpieza')} onClick={() => toggleService('limpieza')}>🧹 Limpieza general</CheckChip>
              <CheckChip selected={formData.services.includes('diseno')} onClick={() => toggleService('diseno')}>🌺 Diseño / mejora estética</CheckChip>
              <CheckChip selected={formData.services.includes('maleza')} onClick={() => toggleService('maleza')}>🌿 Retiro de maleza</CheckChip>
              <CheckChip selected={formData.services.includes('otro')} onClick={() => toggleService('otro')}>📝 Otro</CheckChip>
            </div>
            {formData.services.includes('otro') && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Describe el servicio</Label>
                <Input
                  value={formData.otherService}
                  onChange={(e) => update("otherService", e.target.value)}
                  placeholder="Ej: Instalación de sistema de riego"
                  className="h-12"
                  maxLength={200}
                />
              </div>
            )}
          </div>
        )}

        {/* ---- STEP 2: Area Size ---- */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Tamaño del área</h1>
              <p className="text-muted-foreground mt-2">Esto ayuda a estimar el tiempo del trabajo</p>
            </div>
            <div className="space-y-3">
              {([
                { value: "small" as AreaSize, label: "Pequeño", sub: "Patio / <50 m²" },
                { value: "medium" as AreaSize, label: "Mediano", sub: "50–150 m²" },
                { value: "large" as AreaSize, label: "Grande", sub: "150+ m²" },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("areaSize", opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                    formData.areaSize === opt.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className={cn("font-semibold", formData.areaSize === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                  <span className="text-sm text-muted-foreground">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- STEP 3: Space Type ---- */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Tipo de espacio</h1>
              <p className="text-muted-foreground mt-2">Selecciona todo lo que aplique</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.spaceTypes.includes('frontal')} onClick={() => toggleSpace('frontal')}>🏡 Jardín frontal</CheckChip>
              <CheckChip selected={formData.spaceTypes.includes('trasero')} onClick={() => toggleSpace('trasero')}>🌿 Jardín trasero</CheckChip>
              <CheckChip selected={formData.spaceTypes.includes('azotea')} onClick={() => toggleSpace('azotea')}>🏢 Azotea</CheckChip>
              <CheckChip selected={formData.spaceTypes.includes('comun')} onClick={() => toggleSpace('comun')}>🏘️ Área común</CheckChip>
              <CheckChip selected={formData.spaceTypes.includes('interior')} onClick={() => toggleSpace('interior')}>🪴 Interior (plantas dentro de casa)</CheckChip>
            </div>
          </div>
        )}

        {/* ---- STEP 4: Trees ---- */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Hay árboles?</h1>
              <p className="text-muted-foreground mt-2">Esto afecta las herramientas necesarias</p>
            </div>
            <div className="space-y-3">
              {([
                { value: "none" as TreeSize, label: "No" },
                { value: "small" as TreeSize, label: "Sí, pequeños (≤3 m)" },
                { value: "medium" as TreeSize, label: "Sí, medianos (3–6 m)" },
                { value: "large" as TreeSize, label: "Sí, grandes (6+ m)" },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("trees", opt.value)}
                  className={cn(
                    "w-full flex items-center px-5 py-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                    formData.trees === opt.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className={cn("font-semibold", formData.trees === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                </button>
              ))}
            </div>
            {(formData.trees === 'medium' || formData.trees === 'large') && (
              <p className="text-sm text-primary bg-primary/5 px-4 py-3 rounded-xl border border-primary/20">
                🌳 La poda de árboles grandes puede requerir herramientas especiales.
              </p>
            )}
          </div>
        )}

        {/* ---- STEP 5: Tools & Materials ---- */}
        {currentStep === 5 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Herramientas y materiales</h1>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">¿Cuentas con herramientas?</Label>
              <div className="flex flex-wrap gap-3">
                <Chip selected={formData.toolsAvailable === 'all'} onClick={() => update("toolsAvailable", "all")}>Sí, todas</Chip>
                <Chip selected={formData.toolsAvailable === 'some'} onClick={() => update("toolsAvailable", "some")}>Algunas</Chip>
                <Chip selected={formData.toolsAvailable === 'none'} onClick={() => update("toolsAvailable", "none")}>No</Chip>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">¿Quién debe traer materiales?</Label>
              <p className="text-sm text-muted-foreground -mt-2">Fertilizante, tierra, plantas, etc.</p>
              <div className="flex flex-wrap gap-3">
                <Chip selected={formData.materialsProvider === 'client'} onClick={() => update("materialsProvider", "client")}>Yo</Chip>
                <Chip selected={formData.materialsProvider === 'provider'} onClick={() => update("materialsProvider", "provider")}>El proveedor</Chip>
                <Chip selected={formData.materialsProvider === 'unsure'} onClick={() => update("materialsProvider", "unsure")} icon={HelpCircle}>No estoy seguro</Chip>
              </div>
            </div>
          </div>
        )}

        {/* ---- STEP 6: Waste Removal ---- */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Retiro de residuos</h1>
              <p className="text-muted-foreground mt-2">¿Necesitas que retiren ramas y basura verde?</p>
            </div>
            <div className="space-y-3">
              {([
                { value: "yes" as WasteRemoval, label: "Sí, necesito que retiren ramas / basura verde", icon: Recycle },
                { value: "no" as WasteRemoval, label: "No, yo me encargo" },
                { value: "unsure" as WasteRemoval, label: "No estoy seguro", icon: HelpCircle },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("wasteRemoval", opt.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-5 py-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                    formData.wasteRemoval === opt.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  {opt.icon && <opt.icon className={cn("w-5 h-5", formData.wasteRemoval === opt.value ? "text-primary" : "text-muted-foreground")} />}
                  <span className={cn("font-semibold", formData.wasteRemoval === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- STEP 7: Frequency ---- */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Frecuencia</h1>
              <p className="text-muted-foreground mt-2">¿Con qué frecuencia necesitas el servicio?</p>
            </div>
            <div className="space-y-3">
              {([
                { value: "once" as Frequency, label: "Una sola vez" },
                { value: "weekly" as Frequency, label: "Semanal" },
                { value: "biweekly" as Frequency, label: "Quincenal" },
                { value: "monthly" as Frequency, label: "Mensual" },
                { value: "tbd" as Frequency, label: "A definir después" },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("frequency", opt.value)}
                  className={cn(
                    "w-full flex items-center px-5 py-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                    formData.frequency === opt.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className={cn("font-semibold", formData.frequency === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- STEP 8: Photos ---- */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Fotos</h1>
              <p className="text-muted-foreground mt-2">Sube fotos del área para recibir mejores propuestas</p>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
              <Input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" id="gardening-photo-upload" disabled={isUploading} />
              <div onClick={() => document.getElementById('gardening-photo-upload')?.click()} className="cursor-pointer flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Camera className="w-8 h-8 text-primary" />
                </div>
                <p className="text-base font-semibold text-foreground">{isUploading ? "Subiendo..." : "Subir fotos"}</p>
                <p className="text-sm text-muted-foreground">Altamente recomendado, no obligatorio</p>
              </div>
            </div>

            {formData.photos.length > 0 && (
              <div className="grid grid-cols-3 gap-3">
                {formData.photos.map((file, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-border aspect-square">
                    <img src={file.url} alt={`Foto ${idx + 1}`} className="w-full h-full object-cover" />
                    {file.uploaded && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-4 h-4 text-primary-foreground" />
                      </div>
                    )}
                    {!file.uploaded && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ---- STEP 9: Access & Considerations ---- */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Acceso y consideraciones</h1>
              <p className="text-muted-foreground mt-2">Selecciona todo lo que aplique (opcional)</p>
            </div>

            <div className="space-y-3">
              <CheckChip selected={formData.accessTypes.includes('easy')} onClick={() => toggleAccess('easy')}>✅ Acceso fácil</CheckChip>
              <CheckChip selected={formData.accessTypes.includes('enter_house')} onClick={() => toggleAccess('enter_house')}>🏠 Requiere entrar a la casa</CheckChip>
              <CheckChip selected={formData.accessTypes.includes('restricted_hours')} onClick={() => toggleAccess('restricted_hours')}>🕐 Horarios restringidos</CheckChip>
              <CheckChip selected={formData.accessTypes.includes('pets')} onClick={() => toggleAccess('pets')}>🐕 Mascotas en el área</CheckChip>
              <CheckChip selected={formData.accessTypes.includes('noise_restricted')} onClick={() => toggleAccess('noise_restricted')}>🔇 Ruido permitido solo en ciertos horarios</CheckChip>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium text-foreground">Algo más que el jardinero deba saber</Label>
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => update("additionalNotes", e.target.value)}
                placeholder="Instrucciones especiales, tipo de plantas, etc."
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-10 pt-6 border-t border-border">
        {currentStep > 1 ? (
          <Button variant="ghost" onClick={handleBack} className="h-12 px-6">
            <ArrowLeft className="w-4 h-4 mr-2" /> Atrás
          </Button>
        ) : <div />}

        <ModernButton
          variant="primary"
          onClick={handleNext}
          disabled={!canProceed()}
          className={cn(
            "h-12 px-8 rounded-full",
            currentStep === TOTAL_STEPS && "h-14 px-10 text-base"
          )}
        >
          {currentStep === TOTAL_STEPS ? "Ver resumen" : "Siguiente"}
        </ModernButton>
      </div>

      {/* Mobile Step Indicator dots */}
      <div className="lg:hidden mt-6 flex justify-center gap-1.5">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "h-2 rounded-full transition-all",
              currentStep === i + 1 ? "w-8 bg-primary" : i + 1 < currentStep ? "w-2 bg-primary/40" : "w-2 bg-muted"
            )}
          />
        ))}
      </div>
    </div>
  );
};
