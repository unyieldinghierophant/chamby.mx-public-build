import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Camera, ArrowLeft, Car, Droplets, MapPin, Package, Key, CalendarClock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AuthModal } from "@/components/AuthModal";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { JobSuccessScreen } from "@/components/JobSuccessScreen";
import { VisitFeeAuthorizationSection } from "@/components/payments/VisitFeeAuthorizationSection";
import { AutoWashSummary } from "./AutoWashSummary";
import { AutoWashStepIndicator } from "./AutoWashStepIndicator";

// ---- Types ----
type ServiceType = "exterior" | "interior" | "completo" | "detallado" | "encerado" | "otro";
type VehicleType = "auto" | "suv" | "camioneta" | "van";
type DirtLevel = "light" | "medium" | "heavy";
type Stain = "asientos" | "alfombras" | "cajuela" | "techo" | "rines" | "motor" | "pelo_mascotas" | "manchas_dificiles";
type SiteCondition = "espacio" | "sombra" | "agua" | "electricidad" | "estacionamiento";
type SuppliesProvider = "client" | "provider";
type PressureWasher = "yes" | "no" | "unsure";
type VehicleAccess = "keys" | "open" | "present" | "chat";
type Schedule = "today" | "specific" | "flexible";

interface UploadedFile {
  file: File | null;
  url: string;
  uploaded: boolean;
}

interface AutoWashFormData {
  serviceType: ServiceType | null;
  otherService: string;
  vehicleType: VehicleType | null;
  dirtLevel: DirtLevel | null;
  stains: Stain[];
  stainDetail: string;
  siteConditions: SiteCondition[];
  suppliesProvider: SuppliesProvider | null;
  needsPressureWasher: PressureWasher | null;
  vehicleAccess: VehicleAccess | null;
  photos: UploadedFile[];
  schedule: Schedule | null;
}

const TOTAL_STEPS = 9;

export const AutoWashBookingFlow = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveFormData, loadFormData, clearFormData } = useFormPersistence('auto-wash-booking');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<AutoWashFormData>({
    serviceType: null,
    otherService: "",
    vehicleType: null,
    dirtLevel: null,
    stains: [],
    stainDetail: "",
    siteConditions: [],
    suppliesProvider: null,
    needsPressureWasher: null,
    vehicleAccess: null,
    photos: [],
    schedule: null,
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

  useEffect(() => {
    const saved = loadFormData();
    if (saved?.autoWashFormData) {
      setFormData(prev => ({ ...prev, ...saved.autoWashFormData, photos: [] }));
      setCurrentStep(saved.currentStep || 1);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (formData.serviceType) {
      saveFormData({ autoWashFormData: { ...formData, photos: [] }, currentStep });
    }
  }, [formData, currentStep]);

  const update = <K extends keyof AutoWashFormData>(key: K, value: AutoWashFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArray = <T extends string>(key: keyof AutoWashFormData, value: T) => {
    setFormData(prev => {
      const arr = prev[key] as T[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return formData.serviceType !== null && (formData.serviceType !== 'otro' || formData.otherService.trim().length > 0);
      case 2: return formData.vehicleType !== null;
      case 3: return formData.dirtLevel !== null;
      case 4: return true; // optional
      case 5: return true; // optional
      case 6: return formData.suppliesProvider !== null && formData.needsPressureWasher !== null;
      case 7: return formData.vehicleAccess !== null;
      case 8: return true; // photos optional
      case 9: return formData.schedule !== null;
      default: return false;
    }
  };

  const handleNext = () => {
    if (canProceed() && currentStep < TOTAL_STEPS) setCurrentStep(currentStep + 1);
    else if (currentStep === TOTAL_STEPS) handleShowSummary();
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
      const svcLabels: Record<string, string> = {
        exterior: "Lavado exterior", interior: "Lavado interior", completo: "Lavado completo",
        detallado: "Detallado (interior/exterior)", encerado: "Encerado / pulido",
      };
      const vehLabels: Record<string, string> = { auto: "Auto", suv: "SUV", camioneta: "Camioneta", van: "Van" };
      const drtLabels: Record<string, string> = { light: "Ligera", medium: "Media", heavy: "Alta (lodo, arena, pelo)" };
      const stnLabels: Record<string, string> = {
        asientos: "Asientos", alfombras: "Alfombras", cajuela: "Cajuela", techo: "Techo",
        rines: "Rines", motor: "Motor", pelo_mascotas: "Pelo de mascotas", manchas_dificiles: "Manchas difíciles",
      };
      const condLabels: Record<string, string> = {
        espacio: "Espacio", sombra: "Sombra", agua: "Agua", electricidad: "Electricidad", estacionamiento: "Estacionamiento",
      };
      const accLabels: Record<string, string> = {
        keys: "Llaves disponibles", open: "Vehículo abierto", present: "Estaré presente", chat: "Coordinar por chat",
      };
      const schLabels: Record<string, string> = { today: "Hoy", specific: "Fecha específica", flexible: "Flexible" };

      const serviceText = formData.serviceType === 'otro'
        ? (formData.otherService || 'Otro')
        : (formData.serviceType ? svcLabels[formData.serviceType] || formData.serviceType : 'N/A');

      const isDetailed = formData.serviceType === 'detallado';
      const isHeavy = formData.dirtLevel === 'heavy';
      const noWater = !formData.siteConditions.includes('agua');

      const parts = [
        `🚗 Servicio: ${serviceText}${isDetailed ? ' ✨' : ''}${isHeavy ? ' ⚠️ SUCIEDAD ALTA' : ''}`,
        `\n🚙 Vehículo: ${formData.vehicleType ? vehLabels[formData.vehicleType] : 'N/A'}`,
        `💧 Suciedad: ${formData.dirtLevel ? drtLabels[formData.dirtLevel] : 'N/A'}`,
      ];

      if (formData.stains.length > 0) {
        const stainText = formData.stains.map(s =>
          s === 'manchas_dificiles' ? `Manchas: ${formData.stainDetail || 'sí'}` : stnLabels[s]
        ).join(', ');
        parts.push(`\n🧽 Trabajos especiales: ${stainText}`);
      }

      if (formData.siteConditions.length > 0) {
        parts.push(`\n📍 Condiciones: ${formData.siteConditions.map(c => condLabels[c]).join(', ')}`);
      }
      if (noWater) parts.push(`⚠️ Sin toma de agua`);

      parts.push(`\n🧴 Productos: ${formData.suppliesProvider === 'client' ? 'Cliente' : 'Proveedor'}`);
      parts.push(`💦 Hidrolavadora: ${formData.needsPressureWasher === 'yes' ? 'Sí' : formData.needsPressureWasher === 'no' ? 'No' : 'No sé'}`);
      parts.push(`🔑 Acceso: ${formData.vehicleAccess ? accLabels[formData.vehicleAccess] : 'N/A'}`);
      parts.push(`⏰ Horario: ${formData.schedule ? schLabels[formData.schedule] : 'N/A'}`);

      const richDescription = parts.join('\n');
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const { data: newJob, error } = await supabase
        .from('jobs')
        .insert({
          client_id: user.id,
          provider_id: null,
          title: `Auto & Lavado: ${serviceText.substring(0, 80)}`,
          description: richDescription,
          category: 'Auto & Lavado',
          service_type: formData.serviceType || 'general',
          problem: richDescription,
          location: '',
          photos: formData.photos.filter(f => f.uploaded).map(f => f.url),
          rate: 1,
          status: 'active',
          scheduled_at: scheduledDate.toISOString(),
          time_preference: formData.schedule || '',
          exact_time: '',
          budget: '',
          urgent: false,
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
    saveFormData({ autoWashFormData: { ...formData, photos: [] }, currentStep });
    sessionStorage.setItem('auth_return_to', '/book-job');
    localStorage.setItem('auth_return_to', '/book-job');
    navigate('/login', { state: { returnTo: '/book-job' } });
  };

  const handleVisitFeeAuthorized = () => { setVisitFeeAuthorized(true); setShowVisitFeeAuth(false); setShowSuccess(true); };
  const handleSkipVisitFee = () => { setShowVisitFeeAuth(false); setShowSuccess(true); };
  const handleSuccessNavigate = () => {
    if (visitFeeAuthorized) navigate(`/esperando-proveedor?job_id=${createdJobId}`);
    else navigate(`/job/${createdJobId}/payment`);
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

  if (showSummary) {
    return <AutoWashSummary formData={formData} onConfirm={handleSubmit} onGoBack={handleBack} isSubmitting={isSubmitting} />;
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

      <AutoWashStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div className="mt-8 space-y-6 animate-fade-in" key={currentStep}>

        {/* STEP 1: Service type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Qué servicio necesitas?</h1>
              <p className="text-muted-foreground mt-2">Selecciona el tipo de lavado o servicio</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.serviceType === 'exterior'} onClick={() => update("serviceType", "exterior")} icon={Droplets}>💧 Lavado exterior</Chip>
              <Chip selected={formData.serviceType === 'interior'} onClick={() => update("serviceType", "interior")}>🧹 Lavado interior</Chip>
              <Chip selected={formData.serviceType === 'completo'} onClick={() => update("serviceType", "completo")} icon={Car}>🚗 Lavado completo</Chip>
              <Chip selected={formData.serviceType === 'detallado'} onClick={() => update("serviceType", "detallado")}>✨ Detallado (interior/exterior)</Chip>
              <Chip selected={formData.serviceType === 'encerado'} onClick={() => update("serviceType", "encerado")}>💎 Encerado / pulido</Chip>
              <Chip selected={formData.serviceType === 'otro'} onClick={() => update("serviceType", "otro")}>📝 Otro</Chip>
            </div>
            {formData.serviceType === 'otro' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Describe el servicio</Label>
                <Input
                  value={formData.otherService}
                  onChange={(e) => update("otherService", e.target.value)}
                  placeholder="Ej: Limpieza de tapicería"
                  className="h-12"
                  maxLength={200}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Vehicle type */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Tipo de vehículo</h1>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.vehicleType === 'auto'} onClick={() => update("vehicleType", "auto")} icon={Car}>🚗 Auto</Chip>
              <Chip selected={formData.vehicleType === 'suv'} onClick={() => update("vehicleType", "suv")}>🚙 SUV</Chip>
              <Chip selected={formData.vehicleType === 'camioneta'} onClick={() => update("vehicleType", "camioneta")}>🛻 Camioneta</Chip>
              <Chip selected={formData.vehicleType === 'van'} onClick={() => update("vehicleType", "van")}>🚐 Van</Chip>
            </div>
          </div>
        )}

        {/* STEP 3: Dirt level */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Nivel de suciedad</h1>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.dirtLevel === 'light'} onClick={() => update("dirtLevel", "light")}>✅ Ligera</Chip>
              <Chip selected={formData.dirtLevel === 'medium'} onClick={() => update("dirtLevel", "medium")}>🟡 Media</Chip>
              <Chip selected={formData.dirtLevel === 'heavy'} onClick={() => update("dirtLevel", "heavy")}>🔴 Alta (lodo, arena, pelo de mascota)</Chip>
            </div>
          </div>
        )}

        {/* STEP 4: Stains & special work */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Manchas o trabajos especiales</h1>
              <p className="text-muted-foreground mt-2">Selecciona lo que aplique (opcional)</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.stains.includes('asientos')} onClick={() => toggleArray('stains', 'asientos')}>💺 Asientos</CheckChip>
              <CheckChip selected={formData.stains.includes('alfombras')} onClick={() => toggleArray('stains', 'alfombras')}>🧶 Alfombras</CheckChip>
              <CheckChip selected={formData.stains.includes('cajuela')} onClick={() => toggleArray('stains', 'cajuela')}>📦 Cajuela</CheckChip>
              <CheckChip selected={formData.stains.includes('techo')} onClick={() => toggleArray('stains', 'techo')}>☁️ Techo</CheckChip>
              <CheckChip selected={formData.stains.includes('rines')} onClick={() => toggleArray('stains', 'rines')}>⚙️ Rines</CheckChip>
              <CheckChip selected={formData.stains.includes('motor')} onClick={() => toggleArray('stains', 'motor')}>🔧 Motor (solo si aplica)</CheckChip>
              <CheckChip selected={formData.stains.includes('pelo_mascotas')} onClick={() => toggleArray('stains', 'pelo_mascotas')}>🐾 Pelo de mascotas</CheckChip>
              <CheckChip selected={formData.stains.includes('manchas_dificiles')} onClick={() => toggleArray('stains', 'manchas_dificiles')}>🎨 Manchas difíciles</CheckChip>
            </div>
            {formData.stains.includes('manchas_dificiles') && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Especifica las manchas</Label>
                <Input
                  value={formData.stainDetail}
                  onChange={(e) => update("stainDetail", e.target.value)}
                  placeholder="Ej: Mancha de café en asiento trasero"
                  className="h-12"
                  maxLength={200}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 5: Site conditions */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Ubicación y condiciones</h1>
              <p className="text-muted-foreground mt-2">Selecciona lo que tengas disponible</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.siteConditions.includes('espacio')} onClick={() => toggleArray('siteConditions', 'espacio')}>📐 Espacio para trabajar</CheckChip>
              <CheckChip selected={formData.siteConditions.includes('sombra')} onClick={() => toggleArray('siteConditions', 'sombra')}>☂️ Sombra disponible</CheckChip>
              <CheckChip selected={formData.siteConditions.includes('agua')} onClick={() => toggleArray('siteConditions', 'agua')}>💧 Toma de agua</CheckChip>
              <CheckChip selected={formData.siteConditions.includes('electricidad')} onClick={() => toggleArray('siteConditions', 'electricidad')}>⚡ Conexión eléctrica</CheckChip>
              <CheckChip selected={formData.siteConditions.includes('estacionamiento')} onClick={() => toggleArray('siteConditions', 'estacionamiento')}>🅿️ Estacionamiento permitido</CheckChip>
            </div>
            {(!formData.siteConditions.includes('agua') || !formData.siteConditions.includes('electricidad')) && formData.siteConditions.length > 0 && (
              <div className="px-4 py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                  ⚠️ {!formData.siteConditions.includes('agua') && !formData.siteConditions.includes('electricidad')
                    ? 'Sin agua ni electricidad — el proveedor necesitará traer su propio equipo.'
                    : !formData.siteConditions.includes('agua')
                    ? 'Sin toma de agua — el proveedor necesitará traer agua.'
                    : 'Sin conexión eléctrica — el proveedor lo tendrá en cuenta.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 6: Equipment & supplies */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Equipo y productos</h1>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Quién provee productos/equipo?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.suppliesProvider === 'client'} onClick={() => update("suppliesProvider", "client")}>🙋 Yo</Chip>
                  <Chip selected={formData.suppliesProvider === 'provider'} onClick={() => update("suppliesProvider", "provider")}>👷 El proveedor</Chip>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Requieres hidrolavadora?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.needsPressureWasher === 'yes'} onClick={() => update("needsPressureWasher", "yes")}>✅ Sí</Chip>
                  <Chip selected={formData.needsPressureWasher === 'no'} onClick={() => update("needsPressureWasher", "no")}>❌ No</Chip>
                  <Chip selected={formData.needsPressureWasher === 'unsure'} onClick={() => update("needsPressureWasher", "unsure")}>🤷 No sé</Chip>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Vehicle access */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Acceso al vehículo</h1>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.vehicleAccess === 'keys'} onClick={() => update("vehicleAccess", "keys")} icon={Key}>🔑 Llaves disponibles</Chip>
              <Chip selected={formData.vehicleAccess === 'open'} onClick={() => update("vehicleAccess", "open")}>🔓 Vehículo abierto</Chip>
              <Chip selected={formData.vehicleAccess === 'present'} onClick={() => update("vehicleAccess", "present")}>👤 Estaré presente</Chip>
              <Chip selected={formData.vehicleAccess === 'chat'} onClick={() => update("vehicleAccess", "chat")}>💬 Coordinar por chat</Chip>
            </div>
          </div>
        )}

        {/* STEP 8: Photos */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Fotos del vehículo</h1>
              <p className="text-muted-foreground mt-2">Sube fotos del vehículo para una mejor estimación</p>
            </div>
            <label className={cn(
              "flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-2xl cursor-pointer transition-all",
              isUploading ? "border-primary bg-primary/5" : "border-border hover:border-primary/40 hover:bg-accent/30"
            )}>
              <input type="file" multiple accept="image/*" className="hidden" onChange={handleFileChange} disabled={isUploading} />
              {isUploading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-sm text-muted-foreground">Subiendo...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Toca para subir fotos</span>
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

        {/* STEP 9: Schedule */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Cuándo lo necesitas?</h1>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.schedule === 'today'} onClick={() => update("schedule", "today")} icon={CalendarClock}>📅 Hoy</Chip>
              <Chip selected={formData.schedule === 'specific'} onClick={() => update("schedule", "specific")}>🗓️ Fecha específica</Chip>
              <Chip selected={formData.schedule === 'flexible'} onClick={() => update("schedule", "flexible")}>🤝 Flexible</Chip>
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
