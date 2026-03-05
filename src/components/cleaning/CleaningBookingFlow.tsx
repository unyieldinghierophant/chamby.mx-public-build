import { useState, useEffect } from "react";
import { VISIT_BASE_FEE } from "@/utils/pricingConfig";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Check, Camera, ArrowLeft, Sparkles, Home, BedDouble, Bath, MapPin, Layers, Package, AlertTriangle, CalendarClock, Loader2 } from "lucide-react";
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
import { CleaningSummary } from "./CleaningSummary";
import { CleaningStepIndicator } from "./CleaningStepIndicator";

// ---- Types ----
type CleaningType = "general" | "profunda" | "mudanza" | "post_obra" | "oficina" | "otro";
type BuildingType = "apartment" | "house" | "office";
type Size = "studio" | "two" | "three" | "four_plus";
type Bathrooms = "1" | "2" | "3+";
type IncludesKitchen = "yes" | "no";
type PriorityZone = "cocina_profunda" | "banos_profundos" | "ventanas_int" | "ventanas_ext" | "refrigerador" | "horno" | "closets" | "balcones";
type Surface = "ceramico" | "madera" | "alfombra" | "marmol" | "vidrio";
type SuppliesProvider = "client" | "provider";
type HasVacuum = "yes" | "no";
type SpecialCondition = "mascotas" | "polvo" | "grasa" | "moho" | "humo" | "alergias";
type Frequency = "once" | "weekly" | "biweekly" | "monthly";

interface UploadedFile {
  file: File | null;
  url: string;
  uploaded: boolean;
}

interface CleaningFormData {
  cleaningType: CleaningType | null;
  otherCleaningType: string;
  buildingType: BuildingType | null;
  size: Size | null;
  bathrooms: Bathrooms | null;
  includesKitchen: IncludesKitchen | null;
  priorityZones: PriorityZone[];
  surfaces: Surface[];
  suppliesProvider: SuppliesProvider | null;
  hasVacuum: HasVacuum | null;
  specialConditions: SpecialCondition[];
  allergyDetail: string;
  photos: UploadedFile[];
  frequency: Frequency | null;
}

const TOTAL_STEPS = 10;

export const CleaningBookingFlow = ({ intentText = "" }: { intentText?: string }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveFormData, loadFormData, clearFormData } = useFormPersistence('cleaning-booking');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CleaningFormData>({
    cleaningType: null,
    otherCleaningType: "",
    buildingType: null,
    size: null,
    bathrooms: null,
    includesKitchen: null,
    priorityZones: [],
    surfaces: [],
    suppliesProvider: null,
    hasVacuum: null,
    specialConditions: [],
    allergyDetail: "",
    photos: [],
    frequency: null,
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
    if (saved?.cleaningFormData) {
      setFormData(prev => ({ ...prev, ...saved.cleaningFormData, photos: [] }));
      setCurrentStep(saved.currentStep || 1);
    } else if (intentText) {
      const norm = intentText.toLowerCase();
      let matched: CleaningFormData["cleaningType"] = null;
      if (norm.includes("profunda") || norm.includes("detalle")) matched = "profunda";
      else if (norm.includes("mudanza")) matched = "mudanza";
      else if (norm.includes("obra") || norm.includes("construcción") || norm.includes("construccion")) matched = "post_obra";
      else if (norm.includes("oficina") || norm.includes("local")) matched = "oficina";
      else if (norm.includes("general") || norm.includes("casa") || norm.includes("hogar") || norm.includes("limpi")) matched = "general";
      else matched = "otro";
      setFormData(prev => ({
        ...prev,
        cleaningType: matched,
        otherCleaningType: matched === "otro" ? intentText : prev.otherCleaningType,
      }));
      if (matched) setCurrentStep(2);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (formData.cleaningType) {
      saveFormData({ cleaningFormData: { ...formData, photos: [] }, currentStep });
    }
  }, [formData, currentStep]);

  const update = <K extends keyof CleaningFormData>(key: K, value: CleaningFormData[K]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const toggleArray = <T extends string>(key: keyof CleaningFormData, value: T) => {
    setFormData(prev => {
      const arr = prev[key] as T[];
      return { ...prev, [key]: arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value] };
    });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1: return formData.cleaningType !== null && (formData.cleaningType !== 'otro' || formData.otherCleaningType.trim().length > 0);
      case 2: return formData.buildingType !== null;
      case 3: return formData.size !== null;
      case 4: return formData.bathrooms !== null && formData.includesKitchen !== null;
      case 5: return true; // optional
      case 6: return true; // optional
      case 7: return formData.suppliesProvider !== null && formData.hasVacuum !== null;
      case 8: return true; // optional
      case 9: return true; // photos optional
      case 10: return formData.frequency !== null;
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
      const typeLabels: Record<string, string> = {
        general: "General", profunda: "Profunda", mudanza: "Mudanza (entrada/salida)",
        post_obra: "Post-obra", oficina: "Oficina",
      };
      const buildLabels: Record<string, string> = { apartment: "Departamento", house: "Casa", office: "Oficina / local" };
      const szLabels: Record<string, string> = { studio: "Estudio / 1 recámara", two: "2 recámaras", three: "3 recámaras", four_plus: "4+ recámaras" };
      const zoneLabels: Record<string, string> = {
        cocina_profunda: "Cocina profunda", banos_profundos: "Baños profundos",
        ventanas_int: "Ventanas interiores", ventanas_ext: "Ventanas exteriores",
        refrigerador: "Refrigerador", horno: "Horno", closets: "Closets", balcones: "Balcones / terrazas",
      };
      const surfLabels: Record<string, string> = {
        ceramico: "Piso cerámico", madera: "Madera / laminado", alfombra: "Alfombra",
        marmol: "Mármol / piedra", vidrio: "Vidrio",
      };
      const condLabels: Record<string, string> = {
        mascotas: "Mascotas", polvo: "Polvo excesivo", grasa: "Grasa",
        moho: "Moho", humo: "Humo", alergias: "Alergias",
      };
      const freqLabels: Record<string, string> = { once: "Una sola vez", weekly: "Semanal", biweekly: "Quincenal", monthly: "Mensual" };

      const typeText = formData.cleaningType === 'otro'
        ? (formData.otherCleaningType || 'Otro')
        : (formData.cleaningType ? typeLabels[formData.cleaningType] || formData.cleaningType : 'N/A');

      const isDeep = formData.cleaningType === 'profunda' || formData.cleaningType === 'post_obra';

      const parts = [
        `✨ Tipo de limpieza: ${typeText}${isDeep ? ' 🧹' : ''}`,
        `\n🏠 Inmueble: ${formData.buildingType ? buildLabels[formData.buildingType] : 'N/A'}`,
        `📐 Tamaño: ${formData.size ? szLabels[formData.size] : 'N/A'}`,
        `🚿 Baños: ${formData.bathrooms || 'N/A'}`,
        `🍳 Incluye cocina: ${formData.includesKitchen === 'yes' ? 'Sí' : 'No'}`,
      ];

      if (formData.priorityZones.length > 0) {
        parts.push(`\n🎯 Zonas prioritarias: ${formData.priorityZones.map(z => zoneLabels[z]).join(', ')}`);
      }
      if (formData.surfaces.length > 0) {
        parts.push(`🏗️ Superficies: ${formData.surfaces.map(s => surfLabels[s]).join(', ')}`);
      }

      parts.push(`\n🧴 Productos: ${formData.suppliesProvider === 'client' ? 'Cliente' : 'Proveedor'}`);
      parts.push(`🧹 Aspiradora: ${formData.hasVacuum === 'yes' ? 'Sí' : 'No'}`);

      if (formData.specialConditions.length > 0) {
        const condText = formData.specialConditions.map(c =>
          c === 'alergias' ? `Alergias: ${formData.allergyDetail || 'sí'}` : condLabels[c]
        ).join(', ');
        parts.push(`\n⚠️ Condiciones: ${condText}`);
      }

      parts.push(`📅 Frecuencia: ${formData.frequency ? freqLabels[formData.frequency] : 'N/A'}`);

      const richDescription = parts.join('\n');
      const scheduledDate = new Date(Date.now() + 24 * 60 * 60 * 1000);

      // Ensure auth session is fresh before DB insert
      const { data: { session: freshSession } } = await supabase.auth.getSession();
      if (!freshSession?.user?.id) {
        toast({ title: "Tu sesión expiró", description: "Por favor inicia sesión de nuevo.", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }
      const authenticatedUserId = freshSession.user.id;

      const jobInsertData = {
        client_id: authenticatedUserId,
        provider_id: null,
        title: `Limpieza: ${typeText.substring(0, 80)}`,
        description: richDescription,
        category: 'Limpieza',
        service_type: formData.cleaningType || 'general',
        problem: richDescription,
        location: '',
        photos: formData.photos.filter(f => f.uploaded).map(f => f.url),
        rate: VISIT_BASE_FEE,
        status: 'pending' as const,
        scheduled_at: scheduledDate.toISOString(),
        time_preference: '',
        exact_time: '',
        budget: '',
        urgent: false,
        photo_count: formData.photos.filter(f => f.uploaded).length,
      };

      let newJob: { id: string } | null = null;
      const { data: insertedJob, error } = await supabase
        .from('jobs')
        .insert(jobInsertData)
        .select('id')
        .single();

      if (error) {
        if (error.message?.includes('row-level security')) {
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          if (refreshed?.user?.id) {
            const { data: retryJob, error: retryError } = await supabase
              .from('jobs')
              .insert({ ...jobInsertData, client_id: refreshed.user.id })
              .select('id')
              .single();
            if (!retryError && retryJob) { newJob = retryJob; }
            else { toast({ title: "Error de sesión", description: "Por favor cierra sesión, vuelve a entrar, e intenta de nuevo.", variant: "destructive" }); setIsSubmitting(false); return; }
          } else { toast({ title: "Error de sesión", description: "Por favor cierra sesión, vuelve a entrar, e intenta de nuevo.", variant: "destructive" }); setIsSubmitting(false); return; }
        } else { throw error; }
      } else { newJob = insertedJob; }

      if (!newJob) throw new Error('No se pudo crear el trabajo');

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
    localStorage.setItem('login_context', 'client');
    saveFormData({ cleaningFormData: { ...formData, photos: [] }, currentStep });
    const returnPath = '/book-job?category=Limpieza';
    sessionStorage.setItem('auth_return_to', returnPath);
    localStorage.setItem('auth_return_to', returnPath);
    localStorage.setItem('booking_category', 'Limpieza');
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
    return <CleaningSummary formData={formData} onConfirm={handleSubmit} onGoBack={handleBack} isSubmitting={isSubmitting} />;
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

      <CleaningStepIndicator currentStep={currentStep} totalSteps={TOTAL_STEPS} />

      <div className="mt-8 space-y-6 animate-fade-in" key={currentStep}>

        {/* STEP 1: Cleaning type */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Qué tipo de limpieza necesitas?</h1>
              <p className="text-muted-foreground mt-2">Selecciona la opción que mejor describa tu necesidad</p>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.cleaningType === 'general'} onClick={() => update("cleaningType", "general")} icon={Sparkles}>🧹 General</Chip>
              <Chip selected={formData.cleaningType === 'profunda'} onClick={() => update("cleaningType", "profunda")}>🧽 Profunda</Chip>
              <Chip selected={formData.cleaningType === 'mudanza'} onClick={() => update("cleaningType", "mudanza")}>📦 Mudanza (entrada/salida)</Chip>
              <Chip selected={formData.cleaningType === 'post_obra'} onClick={() => update("cleaningType", "post_obra")}>🏗️ Post-obra</Chip>
              <Chip selected={formData.cleaningType === 'oficina'} onClick={() => update("cleaningType", "oficina")}>🏢 Oficina</Chip>
              <Chip selected={formData.cleaningType === 'otro'} onClick={() => update("cleaningType", "otro")}>📝 Otro</Chip>
            </div>
            {formData.cleaningType === 'otro' && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Describe el tipo de limpieza</Label>
                <Input
                  value={formData.otherCleaningType}
                  onChange={(e) => update("otherCleaningType", e.target.value)}
                  placeholder="Ej: Limpieza de vidrios exteriores"
                  className="h-12"
                  maxLength={200}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Building type */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Tipo de inmueble</h1>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.buildingType === 'apartment'} onClick={() => update("buildingType", "apartment")} icon={Home}>🏢 Departamento</Chip>
              <Chip selected={formData.buildingType === 'house'} onClick={() => update("buildingType", "house")}>🏡 Casa</Chip>
              <Chip selected={formData.buildingType === 'office'} onClick={() => update("buildingType", "office")}>🏪 Oficina / local</Chip>
            </div>
          </div>
        )}

        {/* STEP 3: Size */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Tamaño del espacio</h1>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.size === 'studio'} onClick={() => update("size", "studio")}>🏠 Estudio / 1 recámara</Chip>
              <Chip selected={formData.size === 'two'} onClick={() => update("size", "two")} icon={BedDouble}>🛏️ 2 recámaras</Chip>
              <Chip selected={formData.size === 'three'} onClick={() => update("size", "three")}>🏘️ 3 recámaras</Chip>
              <Chip selected={formData.size === 'four_plus'} onClick={() => update("size", "four_plus")}>🏰 4+ recámaras</Chip>
            </div>
          </div>
        )}

        {/* STEP 4: Bathrooms & kitchen */}
        {currentStep === 4 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Baños y cocina</h1>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Cuántos baños?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.bathrooms === '1'} onClick={() => update("bathrooms", "1")}>🚿 1</Chip>
                  <Chip selected={formData.bathrooms === '2'} onClick={() => update("bathrooms", "2")}>🚿 2</Chip>
                  <Chip selected={formData.bathrooms === '3+'} onClick={() => update("bathrooms", "3+")}>🚿 3+</Chip>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Incluye cocina?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.includesKitchen === 'yes'} onClick={() => update("includesKitchen", "yes")}>✅ Sí</Chip>
                  <Chip selected={formData.includesKitchen === 'no'} onClick={() => update("includesKitchen", "no")}>❌ No</Chip>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Priority zones */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Zonas prioritarias</h1>
              <p className="text-muted-foreground mt-2">Selecciona las áreas que necesitan atención especial (opcional)</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.priorityZones.includes('cocina_profunda')} onClick={() => toggleArray('priorityZones', 'cocina_profunda')}>🍳 Cocina profunda</CheckChip>
              <CheckChip selected={formData.priorityZones.includes('banos_profundos')} onClick={() => toggleArray('priorityZones', 'banos_profundos')}>🚿 Baños profundos</CheckChip>
              <CheckChip selected={formData.priorityZones.includes('ventanas_int')} onClick={() => toggleArray('priorityZones', 'ventanas_int')}>🪟 Ventanas interiores</CheckChip>
              <CheckChip selected={formData.priorityZones.includes('ventanas_ext')} onClick={() => toggleArray('priorityZones', 'ventanas_ext')}>🪟 Ventanas exteriores</CheckChip>
              <CheckChip selected={formData.priorityZones.includes('refrigerador')} onClick={() => toggleArray('priorityZones', 'refrigerador')}>🧊 Refrigerador (interior)</CheckChip>
              <CheckChip selected={formData.priorityZones.includes('horno')} onClick={() => toggleArray('priorityZones', 'horno')}>🔥 Horno (interior)</CheckChip>
              <CheckChip selected={formData.priorityZones.includes('closets')} onClick={() => toggleArray('priorityZones', 'closets')}>👕 Closets</CheckChip>
              <CheckChip selected={formData.priorityZones.includes('balcones')} onClick={() => toggleArray('priorityZones', 'balcones')}>🌅 Balcones / terrazas</CheckChip>
            </div>
          </div>
        )}

        {/* STEP 6: Surfaces */}
        {currentStep === 6 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Tipo de superficies</h1>
              <p className="text-muted-foreground mt-2">Selecciona las que apliquen (opcional)</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.surfaces.includes('ceramico')} onClick={() => toggleArray('surfaces', 'ceramico')}>🏗️ Piso cerámico</CheckChip>
              <CheckChip selected={formData.surfaces.includes('madera')} onClick={() => toggleArray('surfaces', 'madera')}>🪵 Madera / laminado</CheckChip>
              <CheckChip selected={formData.surfaces.includes('alfombra')} onClick={() => toggleArray('surfaces', 'alfombra')}>🧶 Alfombra</CheckChip>
              <CheckChip selected={formData.surfaces.includes('marmol')} onClick={() => toggleArray('surfaces', 'marmol')}>💎 Mármol / piedra</CheckChip>
              <CheckChip selected={formData.surfaces.includes('vidrio')} onClick={() => toggleArray('surfaces', 'vidrio')}>🪟 Vidrio</CheckChip>
            </div>
          </div>
        )}

        {/* STEP 7: Supplies */}
        {currentStep === 7 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Suministros</h1>
            </div>
            <div className="space-y-4">
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Quién provee productos de limpieza?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.suppliesProvider === 'client'} onClick={() => update("suppliesProvider", "client")}>🙋 Yo</Chip>
                  <Chip selected={formData.suppliesProvider === 'provider'} onClick={() => update("suppliesProvider", "provider")}>👷 El proveedor</Chip>
                </div>
              </div>
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">¿Cuentas con aspiradora?</p>
                <div className="flex flex-wrap gap-2">
                  <Chip selected={formData.hasVacuum === 'yes'} onClick={() => update("hasVacuum", "yes")}>✅ Sí</Chip>
                  <Chip selected={formData.hasVacuum === 'no'} onClick={() => update("hasVacuum", "no")}>❌ No</Chip>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 8: Special conditions */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Condiciones especiales</h1>
              <p className="text-muted-foreground mt-2">Selecciona lo que aplique (opcional)</p>
            </div>
            <div className="space-y-3">
              <CheckChip selected={formData.specialConditions.includes('mascotas')} onClick={() => toggleArray('specialConditions', 'mascotas')}>🐾 Mascotas</CheckChip>
              <CheckChip selected={formData.specialConditions.includes('polvo')} onClick={() => toggleArray('specialConditions', 'polvo')}>💨 Polvo excesivo</CheckChip>
              <CheckChip selected={formData.specialConditions.includes('grasa')} onClick={() => toggleArray('specialConditions', 'grasa')}>🍳 Grasa</CheckChip>
              <CheckChip selected={formData.specialConditions.includes('moho')} onClick={() => toggleArray('specialConditions', 'moho')}>🦠 Moho</CheckChip>
              <CheckChip selected={formData.specialConditions.includes('humo')} onClick={() => toggleArray('specialConditions', 'humo')}>💨 Humo</CheckChip>
              <CheckChip selected={formData.specialConditions.includes('alergias')} onClick={() => toggleArray('specialConditions', 'alergias')}>🤧 Alergias</CheckChip>
            </div>
            {formData.specialConditions.includes('alergias') && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-foreground">Especifica las alergias</Label>
                <Input
                  value={formData.allergyDetail}
                  onChange={(e) => update("allergyDetail", e.target.value)}
                  placeholder="Ej: Alergia al cloro"
                  className="h-12"
                  maxLength={200}
                />
              </div>
            )}
          </div>
        )}

        {/* STEP 9: Photos */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">Fotos del espacio</h1>
              <p className="text-muted-foreground mt-2">Sube fotos del espacio para recibir una mejor estimación</p>
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

        {/* STEP 10: Frequency */}
        {currentStep === 10 && (
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Con qué frecuencia?</h1>
            </div>
            <div className="space-y-3">
              <Chip selected={formData.frequency === 'once'} onClick={() => update("frequency", "once")} icon={CalendarClock}>📅 Una sola vez</Chip>
              <Chip selected={formData.frequency === 'weekly'} onClick={() => update("frequency", "weekly")}>📆 Semanal</Chip>
              <Chip selected={formData.frequency === 'biweekly'} onClick={() => update("frequency", "biweekly")}>🗓️ Quincenal</Chip>
              <Chip selected={formData.frequency === 'monthly'} onClick={() => update("frequency", "monthly")}>📅 Mensual</Chip>
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
