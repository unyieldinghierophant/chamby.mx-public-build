import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Upload, Check, Camera, ArrowLeft, Wrench, Hammer, Settings, RotateCcw, Ruler, MoveVertical, PackageOpen, HelpCircle, Building, Home, Loader2, MapPin, Navigation, CalendarIcon, Clock, Zap, Sun, Sunset, Moon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { JobSuccessScreen } from "@/components/JobSuccessScreen";
import { VisitFeeAuthorizationSection } from "@/components/payments/VisitFeeAuthorizationSection";
import { HandymanSummary } from "./HandymanSummary";
import { HandymanStepIndicator } from "./HandymanStepIndicator";
import { useGlobalLocation } from "@/hooks/useGlobalLocation";

// ---- Types ----
type WorkType = "reparacion" | "instalacion" | "armado" | "ajuste";
type JobSize = "small" | "medium" | "large";
type MaterialsProvider = "client" | "provider" | "unsure";
type ToolsAvailability = "yes" | "no" | "unsure";
type ScheduleMode = "asap" | "today" | "date";
type TimeWindow = "morning" | "midday" | "afternoon" | "night";
type ImportantDetail = "perforate" | "measure" | "height" | "tight_space" | "move_furniture";
type AccessType = "apartment" | "house" | "ground_floor" | "stairs" | "elevator" | "restricted_hours";

interface UploadedFile {
  file: File | null;
  url: string;
  uploaded: boolean;
}

interface HandymanFormData {
  description: string;
  workType: WorkType | null;
  serviceAddress: string;
  serviceLatitude: number | null;
  serviceLongitude: number | null;
  addressNotes: string;
  scheduleMode: ScheduleMode | null;
  scheduledDate: Date | null;
  timeWindow: TimeWindow | null;
  jobSize: JobSize | null;
  materialsProvider: MaterialsProvider | null;
  toolsAvailable: ToolsAvailability | null;
  importantDetails: ImportantDetail[];
  photos: UploadedFile[];
  accessTypes: AccessType[];
  additionalNotes: string;
}

// ---- Rotating placeholder ----
const placeholders = [
  "Colgar una TV en la pared",
  "Armar un mueble de IKEA",
  "Reparar una puerta que no cierra",
  "Instalar repisas flotantes",
  "Ajustar cerraduras de la casa",
];

// ---- Autofill suggestions ----
const handymanSuggestions = [
  "Colgar una TV", "Armar un mueble", "Reparar una puerta",
  "Instalar repisas", "Ajustar cerraduras", "Colgar cuadros",
  "Armar estante", "Reparar closet", "Instalar cortinas",
  "Cambiar chapas", "Instalar espejos", "Reparar bisagras",
  "Instalar barras de cortina", "Armar gabinetes", "Reparar cajones",
  "Instalar mosquiteros", "Parchear agujeros en pared", "Cambiar manijas",
  "Instalar ganchos y organizadores", "Reparar molduras",
  "Instalar persianas", "Armar escritorio", "Reparar sillas",
  "Instalar repisas flotantes", "Reparar ventanas",
];

const TOTAL_STEPS = 9;

// ---- Keyword → WorkType mapping ----
const WORK_TYPE_KEYWORDS: Record<WorkType, string[]> = {
  armado: ["armar", "ensamblar", "montar", "mueble", "muebles", "cama", "escritorio", "librero", "estante", "gabinete"],
  reparacion: ["reparar", "arreglar", "componer", "ajustar", "bisagra", "manija", "puerta", "ventana", "cajón", "cajones", "silla"],
  instalacion: ["instalar", "colgar", "colocar", "poner", "cortina", "persiana", "repisa", "espejo", "cuadro", "tv", "televisión", "barra", "mosquitero", "gancho"],
  ajuste: ["ajustar", "manteni", "calibrar", "chapa", "cerradura"],
};

function detectWorkType(text: string): WorkType | null {
  const normalized = text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  let best: WorkType | null = null;
  let bestCount = 0;
  for (const [type, keywords] of Object.entries(WORK_TYPE_KEYWORDS) as [WorkType, string[]][]) {
    const count = keywords.filter(k => normalized.includes(k)).length;
    if (count > bestCount) { best = type; bestCount = count; }
  }
  return best;
}

interface HandymanBookingFlowProps {
  intentText?: string;
}

export const HandymanBookingFlow = ({ intentText }: HandymanBookingFlowProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveFormData, loadFormData, clearFormData } = useFormPersistence('handyman-booking');
  const { location: globalLocation } = useGlobalLocation();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<HandymanFormData>({
    description: "",
    workType: null,
    serviceAddress: "",
    serviceLatitude: null,
    serviceLongitude: null,
    addressNotes: "",
    scheduleMode: null,
    scheduledDate: null,
    timeWindow: null,
    jobSize: null,
    materialsProvider: null,
    toolsAvailable: null,
    importantDetails: [],
    photos: [],
    accessTypes: [],
    additionalNotes: "",
  });

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showVisitFeeAuth, setShowVisitFeeAuth] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [visitFeeAuthorized, setVisitFeeAuthorized] = useState(false);
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rotate placeholder
  useEffect(() => {
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Load saved data
  useEffect(() => {
    const saved = loadFormData();
    if (saved?.handymanFormData) {
      setFormData(prev => ({ ...prev, ...saved.handymanFormData, photos: [] }));
      setCurrentStep(saved.currentStep || 1);
    }
    setIsLoading(false);
  }, []);

  // Pre-fill description from global intent as a helper prefix — never overwrite user edits
  useEffect(() => {
    if (intentText && intentText.trim().length > 0 && !formData.description) {
      setFormData(prev => ({
        ...prev,
        description: `Necesito ayuda con: ${intentText}`,
      }));
    }
  }, [intentText]);

  // Pre-fill location from global location chip — never overwrite user edits
  useEffect(() => {
    if (globalLocation && !formData.serviceAddress) {
      setFormData(prev => ({
        ...prev,
        serviceAddress: globalLocation.address,
        serviceLatitude: globalLocation.latitude,
        serviceLongitude: globalLocation.longitude,
      }));
    }
  }, [globalLocation]);

  // Auto-save
  useEffect(() => {
    if (formData.description) {
      saveFormData({ handymanFormData: { ...formData, photos: [] }, currentStep });
    }
  }, [formData, currentStep]);

  // Filter suggestions
  useEffect(() => {
    const q = formData.description.toLowerCase().trim();
    const filtered = q === ""
      ? handymanSuggestions.slice(0, 10)
      : handymanSuggestions.filter(s => s.toLowerCase().includes(q)).slice(0, 10);
    setFilteredSuggestions(filtered);
  }, [formData.description]);

  // ---- Helpers ----
  const update = <K extends keyof HandymanFormData>(key: K, value: HandymanFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleDetail = (detail: ImportantDetail) => {
    setFormData(prev => ({
      ...prev,
      importantDetails: prev.importantDetails.includes(detail)
        ? prev.importantDetails.filter(d => d !== detail)
        : [...prev.importantDetails, detail],
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
      case 1: return formData.description.trim().length >= 15;
      case 2: return formData.workType !== null;
      case 3: return formData.serviceAddress.trim().length >= 5;
      case 4: {
        if (!formData.scheduleMode) return false;
        if (formData.scheduleMode === 'date' && !formData.scheduledDate) return false;
        return true;
      }
      case 5: return formData.jobSize !== null;
      case 6: return formData.materialsProvider !== null && formData.toolsAvailable !== null;
      case 7: return true; // optional details
      case 8: return true; // optional photos
      case 9: return true; // optional access
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
      const workTypeLabels: Record<WorkType, string> = {
        reparacion: "Reparación", instalacion: "Instalación", armado: "Armado", ajuste: "Ajuste / Mantenimiento"
      };
      const jobSizeLabels: Record<JobSize, string> = {
        small: "Pequeño (≤ 1 hora)", medium: "Mediano (1–3 horas)", large: "Grande (3+ horas)"
      };
      const materialsLabels: Record<MaterialsProvider, string> = {
        client: "Cliente tiene materiales", provider: "Proveedor trae materiales", unsure: "No está seguro"
      };
      const toolsLabels: Record<ToolsAvailability, string> = {
        yes: "Sí tiene herramientas", no: "No tiene herramientas", unsure: "No sabe cuáles se necesitan"
      };
      const detailLabels: Record<ImportantDetail, string> = {
        perforate: "Requiere perforar pared", measure: "Requiere medir/nivelar",
        height: "Trabajo en altura", tight_space: "Espacio reducido", move_furniture: "Requiere mover muebles"
      };
      const accessLabels: Record<AccessType, string> = {
        apartment: "Departamento", house: "Casa", ground_floor: "Planta baja",
        stairs: "Escaleras", elevator: "Elevador", restricted_hours: "Horarios restringidos"
      };

      // Build rich description
      const parts = [
        `📋 ${formData.description}`,
        `\n🔧 Tipo: ${formData.workType ? workTypeLabels[formData.workType] : "N/A"}`,
        `📏 Tamaño: ${formData.jobSize ? jobSizeLabels[formData.jobSize] : "N/A"}`,
        `🧱 Materiales: ${formData.materialsProvider ? materialsLabels[formData.materialsProvider] : "N/A"}`,
        `🛠️ Herramientas: ${formData.toolsAvailable ? toolsLabels[formData.toolsAvailable] : "N/A"}`,
      ];

      if (formData.importantDetails.length > 0) {
        parts.push(`\n⚠️ Detalles importantes:\n${formData.importantDetails.map(d => `  • ${detailLabels[d]}`).join('\n')}`);
      }
      if (formData.accessTypes.length > 0) {
        parts.push(`\n🏠 Acceso:\n${formData.accessTypes.map(a => `  • ${accessLabels[a]}`).join('\n')}`);
      }
      if (formData.additionalNotes.trim()) {
        parts.push(`\n📝 Notas adicionales: ${formData.additionalNotes}`);
      }

      const richDescription = parts.join('\n');

      // Compute scheduled_at from scheduling step
      const timeWindowLabels: Record<TimeWindow, string> = {
        morning: "Mañana (8–12)", midday: "Mediodía (12–15)", afternoon: "Tarde (15–19)", night: "Noche (19–21)"
      };
      let scheduledAt: string;
      if (formData.scheduleMode === 'asap') {
        scheduledAt = new Date().toISOString();
      } else if (formData.scheduleMode === 'today') {
        scheduledAt = new Date().toISOString();
      } else if (formData.scheduledDate) {
        scheduledAt = formData.scheduledDate.toISOString();
      } else {
        scheduledAt = new Date().toISOString();
      }

      const timePreference = formData.timeWindow ? timeWindowLabels[formData.timeWindow] : (formData.scheduleMode === 'asap' ? 'Lo antes posible' : '');

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          client_id: user.id,
          provider_id: null,
          title: intentText || formData.description,
          description: richDescription,
          category: 'Handyman',
          service_type: formData.workType || 'general',
          problem: richDescription,
          location: formData.serviceAddress || '',
          photos: formData.photos.filter(f => f.uploaded).map(f => f.url),
          rate: 1,
          status: 'active',
          scheduled_at: scheduledAt,
          time_preference: timePreference,
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
    saveFormData({ handymanFormData: { ...formData, photos: [] }, currentStep });
    const returnPath = '/book-job?category=Handyman';
    sessionStorage.setItem('auth_return_to', returnPath);
    localStorage.setItem('auth_return_to', returnPath);
    localStorage.setItem('booking_category', 'Handyman');
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
      <HandymanSummary
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
      <HandymanStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      {/* Step Content */}
      <div className="mt-8 space-y-6 animate-fade-in" key={currentStep}>
        {/* ---- STEP 1: Description ---- */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Describe brevemente lo que necesitas</h1>
              <p className="text-muted-foreground mt-2">Sé específico para recibir mejores propuestas</p>
            </div>
            <div className="relative">
              <Input
                value={formData.description}
                onChange={(e) => update("description", e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                placeholder={placeholders[placeholderIndex]}
                className="h-14 text-base"
                maxLength={200}
              />
              <p className={cn("text-xs mt-1", formData.description.length < 15 ? "text-muted-foreground" : "text-primary")}>
                {formData.description.length}/200 — mínimo 15 caracteres
              </p>

              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute z-[100] w-full mt-1 bg-popover border-2 border-primary/20 rounded-xl shadow-xl max-h-64 overflow-y-auto">
                  <div className="p-2 bg-primary/5 border-b border-border">
                    <p className="text-xs text-muted-foreground font-medium">Sugerencias para Handyman</p>
                  </div>
                  {filteredSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => { update("description", s); setShowSuggestions(false); }}
                      className="w-full text-left px-4 py-3 hover:bg-accent/80 active:bg-accent transition-colors border-b last:border-b-0 border-border/30 text-sm"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---- STEP 2: Work Type ---- */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Tipo de trabajo</h1>
              <p className="text-muted-foreground mt-2">¿Qué tipo de trabajo necesitas?</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Chip selected={formData.workType === 'reparacion'} onClick={() => update("workType", "reparacion")} icon={Wrench}>Reparación</Chip>
              <Chip selected={formData.workType === 'instalacion'} onClick={() => update("workType", "instalacion")} icon={Hammer}>Instalación</Chip>
              <Chip selected={formData.workType === 'armado'} onClick={() => update("workType", "armado")} icon={PackageOpen}>Armado</Chip>
              <Chip selected={formData.workType === 'ajuste'} onClick={() => update("workType", "ajuste")} icon={Settings}>Ajuste / Mantenimiento</Chip>
            </div>
          </div>
        )}

        {/* ---- STEP 3: Ubicación ---- */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Ubicación del servicio</h1>
              <p className="text-muted-foreground mt-2">¿Dónde necesitas que vaya el proveedor?</p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                      const lat = pos.coords.latitude;
                      const lng = pos.coords.longitude;
                      setFormData(prev => ({ ...prev, serviceLatitude: lat, serviceLongitude: lng }));
                      try {
                        const res = await fetch(
                          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
                          { headers: { 'User-Agent': 'Chamby.mx/1.0' }, signal: AbortSignal.timeout(5000) }
                        );
                        const data = await res.json();
                        if (data.display_name) {
                          setFormData(prev => ({ ...prev, serviceAddress: data.display_name }));
                        }
                      } catch { /* keep coords only */ }
                    },
                    () => { toast({ title: "No se pudo obtener ubicación", variant: "destructive" }); },
                    { enableHighAccuracy: true, timeout: 10000 }
                  );
                }}
                className="w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-medium hover:bg-primary/10 transition-colors"
              >
                <Navigation className="w-4 h-4" />
                Usar mi ubicación actual
              </button>

              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  value={formData.serviceAddress}
                  onChange={(e) => update("serviceAddress", e.target.value)}
                  placeholder="Escribe la dirección completa"
                  className="h-14 text-base pl-10"
                  maxLength={300}
                />
              </div>
              <p className={cn("text-xs", formData.serviceAddress.length < 5 ? "text-muted-foreground" : "text-primary")}>
                Mínimo 5 caracteres
              </p>

              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Notas de acceso (opcional)</Label>
                <Input
                  value={formData.addressNotes}
                  onChange={(e) => update("addressNotes", e.target.value)}
                  placeholder="Ej: Puerta azul, timbre 3, dejar en portería…"
                  className="h-12"
                  maxLength={200}
                />
              </div>
            </div>
          </div>
        )}

        {/* ---- STEP 4: Scheduling ---- */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Cuándo lo necesitas?</h1>
              <p className="text-muted-foreground mt-2">Elige la opción que mejor te funcione</p>
            </div>

            {/* Schedule mode radio cards */}
            <div className="space-y-3">
              {([
                { value: "asap" as ScheduleMode, label: "Lo antes posible", sub: "Te asignamos al primer proveedor disponible", icon: Zap },
                { value: "today" as ScheduleMode, label: "Hoy", sub: "Agendamos para hoy mismo", icon: Clock },
                { value: "date" as ScheduleMode, label: "Elegir fecha", sub: "Selecciona un día específico", icon: CalendarIcon },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    update("scheduleMode", opt.value);
                    if (opt.value === 'today') {
                      update("scheduledDate", new Date());
                    } else if (opt.value === 'asap') {
                      update("scheduledDate", null);
                    }
                  }}
                  className={cn(
                    "w-full flex items-center gap-4 px-5 py-4 rounded-2xl border-2 transition-all active:scale-[0.98] text-left",
                    formData.scheduleMode === opt.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0",
                    formData.scheduleMode === opt.value ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  )}>
                    <opt.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <span className={cn("font-semibold block", formData.scheduleMode === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                    <span className="text-sm text-muted-foreground">{opt.sub}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Calendar for "Elegir fecha" */}
            {formData.scheduleMode === 'date' && (
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">Selecciona la fecha</Label>
                <Popover defaultOpen>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className={cn(
                        "w-full flex items-center gap-3 h-14 px-4 rounded-xl border-2 text-left font-medium transition-colors",
                        formData.scheduledDate
                          ? "border-primary bg-primary/5 text-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40"
                      )}
                    >
                      <CalendarIcon className="w-5 h-5 text-primary" />
                      {formData.scheduledDate
                        ? format(formData.scheduledDate, "EEEE d 'de' MMMM", { locale: es })
                        : "Toca para elegir fecha"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.scheduledDate || undefined}
                      onSelect={(date) => update("scheduledDate", date || null)}
                      disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      initialFocus
                      locale={es}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Time window pills — shown for today or specific date */}
            {(formData.scheduleMode === 'today' || formData.scheduleMode === 'date') && (
              <div className="space-y-3">
                <Label className="text-base font-medium text-foreground">Horario preferido</Label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: "morning" as TimeWindow, label: "Mañana", sub: "8:00 – 12:00", icon: Sun },
                    { value: "midday" as TimeWindow, label: "Mediodía", sub: "12:00 – 15:00", icon: Sun },
                    { value: "afternoon" as TimeWindow, label: "Tarde", sub: "15:00 – 19:00", icon: Sunset },
                    { value: "night" as TimeWindow, label: "Noche", sub: "19:00 – 21:00", icon: Moon },
                  ]).map(tw => (
                    <button
                      key={tw.value}
                      type="button"
                      onClick={() => update("timeWindow", tw.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-4 rounded-xl border-2 transition-all active:scale-95",
                        formData.timeWindow === tw.value
                          ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                          : "border-border bg-card text-foreground hover:border-primary/40"
                      )}
                    >
                      <tw.icon className={cn("w-5 h-5", formData.timeWindow === tw.value ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-semibold text-sm">{tw.label}</span>
                      <span className="text-xs text-muted-foreground">{tw.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ---- STEP 5: Job Size ---- */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Qué tan grande es el trabajo?</h1>
              <p className="text-muted-foreground mt-2">Esto ayuda al proveedor a decidir rápido</p>
            </div>
            <div className="space-y-3">
              {([
                { value: "small" as JobSize, label: "Pequeño", sub: "≤ 1 hora" },
                { value: "medium" as JobSize, label: "Mediano", sub: "1–3 horas" },
                { value: "large" as JobSize, label: "Grande", sub: "3+ horas" },
              ]).map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => update("jobSize", opt.value)}
                  className={cn(
                    "w-full flex items-center justify-between px-5 py-4 rounded-2xl border-2 transition-all active:scale-[0.98]",
                    formData.jobSize === opt.value
                      ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-md"
                      : "border-border bg-card hover:border-primary/40"
                  )}
                >
                  <span className={cn("font-semibold", formData.jobSize === opt.value ? "text-primary" : "text-foreground")}>{opt.label}</span>
                  <span className="text-sm text-muted-foreground">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- STEP 6: Materials & Tools ---- */}
        {currentStep === 6 && (
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Materiales y herramientas</h1>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">¿Quién provee los materiales?</Label>
              <div className="flex flex-wrap gap-3">
                <Chip selected={formData.materialsProvider === 'client'} onClick={() => update("materialsProvider", "client")}>Yo ya tengo todo</Chip>
                <Chip selected={formData.materialsProvider === 'provider'} onClick={() => update("materialsProvider", "provider")}>Necesito que el proveedor los traiga</Chip>
                <Chip selected={formData.materialsProvider === 'unsure'} onClick={() => update("materialsProvider", "unsure")} icon={HelpCircle}>No estoy seguro</Chip>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-lg font-semibold text-foreground">¿Cuentas con herramientas básicas?</Label>
              <div className="flex flex-wrap gap-3">
                <Chip selected={formData.toolsAvailable === 'yes'} onClick={() => update("toolsAvailable", "yes")}>Sí</Chip>
                <Chip selected={formData.toolsAvailable === 'no'} onClick={() => update("toolsAvailable", "no")}>No</Chip>
                <Chip selected={formData.toolsAvailable === 'unsure'} onClick={() => update("toolsAvailable", "unsure")} icon={HelpCircle}>No sé cuáles se necesitan</Chip>
              </div>
              {(formData.toolsAvailable === 'no' || formData.toolsAvailable === 'unsure') && (
                <p className="text-sm text-primary bg-primary/5 px-4 py-3 rounded-xl border border-primary/20">
                  🛠️ El proveedor llevará lo necesario.
                </p>
              )}
            </div>
          </div>
        )}

        {/* ---- STEP 7: Important Details ---- */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Detalles importantes</h1>
              <p className="text-muted-foreground mt-2">Selecciona todo lo que aplique (opcional)</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.importantDetails.includes('perforate')} onClick={() => toggleDetail('perforate')}>Requiere perforar pared</CheckChip>
              <CheckChip selected={formData.importantDetails.includes('measure')} onClick={() => toggleDetail('measure')}>Requiere medir / nivelar</CheckChip>
              <CheckChip selected={formData.importantDetails.includes('height')} onClick={() => toggleDetail('height')}>Trabajo en altura</CheckChip>
              <CheckChip selected={formData.importantDetails.includes('tight_space')} onClick={() => toggleDetail('tight_space')}>Espacio reducido</CheckChip>
              <CheckChip selected={formData.importantDetails.includes('move_furniture')} onClick={() => toggleDetail('move_furniture')}>Requiere mover muebles</CheckChip>
            </div>
          </div>
        )}

        {/* ---- STEP 8: Photos ---- */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Fotos</h1>
              <p className="text-muted-foreground mt-2">Sube fotos del área u objeto — ayuda a recibir mejores propuestas</p>
            </div>

            <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
              <Input type="file" multiple accept="image/*" onChange={handleFileChange} className="hidden" id="handyman-photo-upload" disabled={isUploading} />
              <div onClick={() => document.getElementById('handyman-photo-upload')?.click()} className="cursor-pointer flex flex-col items-center gap-3">
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
              <CheckChip selected={formData.accessTypes.includes('apartment')} onClick={() => toggleAccess('apartment')}>Departamento</CheckChip>
              <CheckChip selected={formData.accessTypes.includes('house')} onClick={() => toggleAccess('house')}>Casa</CheckChip>
              <CheckChip selected={formData.accessTypes.includes('ground_floor')} onClick={() => toggleAccess('ground_floor')}>Planta baja</CheckChip>
              <CheckChip selected={formData.accessTypes.includes('stairs')} onClick={() => toggleAccess('stairs')}>Escaleras</CheckChip>
              <CheckChip selected={formData.accessTypes.includes('elevator')} onClick={() => toggleAccess('elevator')}>Elevador</CheckChip>
              <CheckChip selected={formData.accessTypes.includes('restricted_hours')} onClick={() => toggleAccess('restricted_hours')}>Horarios restringidos</CheckChip>
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium text-foreground">Algo más que el proveedor deba saber</Label>
              <Textarea
                value={formData.additionalNotes}
                onChange={(e) => update("additionalNotes", e.target.value)}
                placeholder="Instrucciones especiales, acceso al estacionamiento, etc."
                className="min-h-[100px] resize-none"
                maxLength={500}
              />
            </div>
          </div>
        )}
      </div>

      {/* Navigation — unified full-width stacked buttons */}
      <div className="mt-10 pt-6 border-t border-border space-y-3">
        <button
          type="button"
          onClick={handleNext}
          disabled={!canProceed()}
          className={cn(
            "w-full h-14 rounded-xl bg-primary text-primary-foreground font-jakarta font-semibold text-base transition-all",
            "hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
          )}
        >
          {currentStep === TOTAL_STEPS ? "Ver resumen" : "Continuar"}
        </button>

        {currentStep > 1 && (
          <button
            type="button"
            onClick={handleBack}
            className="w-full text-center text-primary font-jakarta font-medium text-sm py-2 hover:underline"
          >
            Volver
          </button>
        )}
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
