import { useState, useEffect } from "react";
import { VISIT_BASE_FEE } from "@/utils/pricingConfig";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CalendarIcon, Upload, Check, Sunrise, Sun, Sunset, Moon, MapPin, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { GoogleMapPicker } from './GoogleMapPicker';
import { z } from 'zod';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthModal } from './AuthModal';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { BookingConfirmation } from './BookingConfirmation';
import { JobSuccessScreen } from './JobSuccessScreen';
// DEPRECATED: Authorization flow disabled in favor of Checkout flow. See Phase 4 S5.
// import { VisitFeeAuthorizationSection } from './payments/VisitFeeAuthorizationSection';
import { useVisitFeeCheckout } from '@/hooks/useVisitFeeCheckout';

// Input validation schema
const jobRequestSchema = z.object({
  service: z.string().trim().min(1, "Servicio requerido").max(200, "Máximo 200 caracteres"),
  date: z.string().trim().max(50, "Máximo 50 caracteres"),
  location: z.string().trim().min(5, "Ubicación debe tener al menos 5 caracteres").max(500, "Máximo 500 caracteres"),
  details: z.string().trim().max(2000, "Máximo 2000 caracteres"),
  photo_count: z.number().int().min(0).max(10, "Máximo 10 fotos"),
  time_preference: z.string().optional(),
  exact_time: z.string().optional(),
  budget: z.string().optional()
});

interface UploadedFile {
  file: File | null;
  url: string;
  uploaded: boolean;
}

type TimeOfDayOption = 'morning' | 'midday' | 'afternoon' | 'evening';
type DatePreference = 'specific' | 'before' | 'flexible';

interface JobBookingFormProps {
  initialService?: string;
  initialDescription?: string;
}

// Common jobs by category
const commonJobsByCategory: Record<string, string[]> = {
  "Handyman": [
    "Colgar cuadros y repisas",
    "Arreglar muebles",
    "Instalación de cortinas",
    "Reparación de puertas",
    "Reparación de cerraduras",
    "Instalación de lámparas",
    "Pintar paredes",
    "Reparación de ventanas",
    "Instalación de persianas",
    "Armar muebles",
    "Reparar sillas",
    "Instalar mosquiteros",
    "Parchear agujeros en pared",
    "Cambiar chapas",
    "Reparar closets",
    "Instalar espejos",
    "Arreglar cajones",
    "Reparar bisagras",
    "Instalar barras de cortina",
    "Reparar puertas de alacena",
    "Ajustar puertas",
    "Instalar repisas flotantes",
    "Reparar molduras",
    "Cambiar manijas",
    "Instalar ganchos y organizadores"
  ],
  "Electricidad": [
    "Instalación de contactos",
    "Cambio de interruptores",
    "Instalación de lámparas",
    "Reparación de cableado",
    "Instalación de ventilador de techo",
    "Revisión de instalación eléctrica",
    "Cambio de focos",
    "Instalación de timbre",
    "Reparación de apagadores",
    "Instalación de reflectores",
    "Cambio de breakers",
    "Instalación de centro de carga",
    "Reparación de cortos circuitos",
    "Instalación de contactos USB",
    "Cableado para minisplit",
    "Instalación de luces LED",
    "Reparación de extensiones",
    "Instalación de lámpara exterior",
    "Cambio de tomacorrientes",
    "Instalación de sensor de movimiento",
    "Reparación de sistema eléctrico",
    "Instalación de contactos 220V",
    "Cableado de cocina",
    "Instalación de tira LED",
    "Revisión de tablero eléctrico"
  ],
  "Plomería": [
    "Reparación de fugas",
    "Destape de drenaje",
    "Instalación de lavabo",
    "Reparación de WC",
    "Cambio de llaves",
    "Instalación de regadera",
    "Reparación de tinaco",
    "Cambio de mangueras",
    "Instalación de boiler",
    "Reparación de tubería",
    "Cambio de flotador",
    "Instalación de lavadora",
    "Reparación de coladera",
    "Cambio de válvulas",
    "Instalación de mingitorio",
    "Reparación de hidroneumático",
    "Instalación de filtro de agua",
    "Cambio de empaque",
    "Reparación de calentador",
    "Instalación de bomba de agua",
    "Cambio de tubos",
    "Instalación de fregadero",
    "Reparación de cisterna",
    "Destape de baño",
    "Instalación de llave de paso"
  ],
  "Auto y lavado": [
    "Lavado completo de auto",
    "Lavado y encerado",
    "Detallado interior",
    "Limpieza de motor",
    "Pulido de faros",
    "Lavado de tapicería",
    "Lavado a presión",
    "Limpieza de rines",
    "Aspirado profundo",
    "Limpieza de vestiduras",
    "Pulido de carrocería",
    "Lavado de motor completo",
    "Shampoo de tapicería",
    "Limpieza de tablero",
    "Encerado profesional",
    "Limpieza de cajuela",
    "Descontaminación de pintura",
    "Limpieza de molduras",
    "Restauración de plásticos",
    "Limpieza de vidrios",
    "Aplicación de cera",
    "Lavado de chasis",
    "Limpieza de alfombras",
    "Sellado de pintura",
    "Limpieza express"
  ]
};

export const JobBookingForm = ({ initialService, initialDescription }: JobBookingFormProps = {}) => {
  const { user } = useAuth();
  const routeLocation = useLocation();
  const navigate = useNavigate();
  const locationState = routeLocation.state as { category?: string; service?: string; description?: string; forceNew?: boolean } | null;
  const [currentStep, setCurrentStep] = useState(1);
  const [taskDescription, setTaskDescription] = useState(initialService || "");
  const [datePreference, setDatePreference] = useState<DatePreference>('specific');
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [specificDate, setSpecificDate] = useState<Date>();
  const [needsSpecificTime, setNeedsSpecificTime] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeOfDayOption[]>([]);
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState(initialDescription || "");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 19.4326, lng: -99.1332 });
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  // DEPRECATED: showVisitFeeAuth removed — now using Checkout redirect. See Phase 4 S5.
  const [createdJobId, setCreatedJobId] = useState<string | null>(null);
  const { redirectToCheckout } = useVisitFeeCheckout();
  const [isLoadingForm, setIsLoadingForm] = useState(true);
  const { toast } = useToast();
  const { saveFormData, loadFormData, clearFormData } = useFormPersistence('job-booking');

  // Get category from route state
  const category = locationState?.category;

  // Load saved form data on mount
  useEffect(() => {
    // Check if this is a forced new form (from service button click)
    const isForceNew = locationState?.forceNew === true;
    
    if (isForceNew) {
      // Clear any saved data for force-new requests
      clearFormData();
      console.log('🆕 Force new form - cleared saved data');
      setIsLoadingForm(false);
      return;
    }
    
    const savedData = loadFormData();
    if (savedData) {
      setTaskDescription(savedData.taskDescription || "");
      if (savedData.datePreference) setDatePreference(savedData.datePreference);
      if (savedData.specificDate) {
        const parsed = new Date(savedData.specificDate);
        if (!isNaN(parsed.getTime())) setSpecificDate(parsed);
      }
      if (savedData.needsSpecificTime !== undefined) setNeedsSpecificTime(savedData.needsSpecificTime);
      setSelectedTimeSlots(savedData.selectedTimeSlots || []);
      setLocation(savedData.location || "");
      setDetails(savedData.details || "");
      setCurrentStep(savedData.currentStep || 1);
      
      if (savedData.coordinates) {
        setCoordinates(savedData.coordinates);
      }
      
      if (savedData.uploadedFileUrls) {
        const restoredFiles = savedData.uploadedFileUrls.map((url: string, index: number) => ({
          file: null,
          url: url,
          uploaded: true
        }));
        setUploadedFiles(restoredFiles);
      }
      
      // Show toast if not auto-submitting
      if (!savedData.showConfirmationOnReturn) {
        toast({
          title: "Progreso restaurado",
          description: "Hemos recuperado tu trabajo anterior",
        });
      }
    }
    setIsLoadingForm(false);
  }, []);

  // Show toast when user returns after authentication
  useEffect(() => {
    const savedData = loadFormData();
    if (user && savedData && !isSubmitting) {
      console.log('✅ User authenticated, form data restored to step:', savedData.currentStep);
      // Just show a toast, don't auto-submit
      toast({
        title: "Sesión iniciada",
        description: "Puedes continuar con tu solicitud",
      });
    }
  }, [user]);

  // Update form when initialService or initialDescription changes
  useEffect(() => {
    if (initialService && initialService !== taskDescription) {
      setTaskDescription(initialService);
    }
    if (initialDescription && initialDescription !== details) {
      setDetails(initialDescription);
    }
  }, [initialService, initialDescription]);

  // Auto-save form data when it changes
  useEffect(() => {
    const formData = {
      taskDescription,
      datePreference,
      specificDate: specificDate?.toISOString(),
      needsSpecificTime,
      selectedTimeSlots,
      location,
      details,
      currentStep,
      coordinates
    };
    
    // Only save if there's meaningful data
    if (taskDescription || location || details) {
      saveFormData(formData);
    }
  }, [taskDescription, datePreference, specificDate, needsSpecificTime, selectedTimeSlots, location, details, currentStep, coordinates]);

  // Auto-open date picker when user has filled the service and reaches the date section
  useEffect(() => {
    if (currentStep === 1 && taskDescription.trim().length > 0 && !specificDate && datePreference === 'specific') {
      const timer = setTimeout(() => setDatePopoverOpen(true), 400);
      return () => clearTimeout(timer);
    }
  }, [currentStep, taskDescription, specificDate, datePreference]);

  // Update suggestions based on category and user input
  useEffect(() => {
    // Get all jobs from the category, or all jobs if no category
    let availableJobs: string[] = [];
    
    if (category) {
      // Try to find category case-insensitive
      const categoryKey = Object.keys(commonJobsByCategory).find(
        key => key.toLowerCase() === category.toLowerCase()
      );
      availableJobs = categoryKey ? commonJobsByCategory[categoryKey] : [];
    } else {
      // Show all jobs from all categories if no category selected
      availableJobs = Object.values(commonJobsByCategory).flat();
    }

    // Filter based on user input, or show all if input is empty
    const filtered = taskDescription.trim() === '' 
      ? availableJobs.slice(0, 15) // Show first 15 when empty
      : availableJobs.filter(job => 
          job.toLowerCase().includes(taskDescription.toLowerCase())
        ).slice(0, 15); // Limit to 15 results

    setSuggestions(filtered);
  }, [taskDescription, category]);

  const steps = [
    { number: 1, label: "Título y Fecha" },
    { number: 2, label: "Ubicación" },
    { number: 3, label: "Detalles" },
    { number: 4, label: "Fotos" }
  ];

  const timeSlots = [
    { id: 'morning' as TimeOfDayOption, icon: Sunrise, label: 'Mañana', time: 'Antes de 10am' },
    { id: 'midday' as TimeOfDayOption, icon: Sun, label: 'Mediodía', time: '10am - 2pm' },
    { id: 'afternoon' as TimeOfDayOption, icon: Sunset, label: 'Tarde', time: '2pm - 6pm' },
    { id: 'evening' as TimeOfDayOption, icon: Moon, label: 'Noche', time: 'Después de 6pm' },
  ];

  const toggleTimeSlot = (slotId: TimeOfDayOption) => {
    setSelectedTimeSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleMapLocationSelect = (lat: number, lng: number, address: string) => {
    setCoordinates({ lat, lng });
    setLocation(address);
  };

  const handleUploadClick = () => {
    // Trigger file input click - auth check moved to final submit
    document.getElementById('photo-upload')?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setIsUploading(true);

    const newFiles: UploadedFile[] = files.map(file => ({
      file,
      url: URL.createObjectURL(file),
      uploaded: false,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Upload files to Supabase
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      if (!user) { toast({ title: "Inicia sesión para subir fotos", variant: "destructive" }); return; }
      const filePath = `${user.id}/${fileName}`;

      try {
        const { error } = await supabase.storage
          .from('job-photos')
          .upload(filePath, file);

        if (error) throw error;

        // Get signed URL (valid for 1 year)
        const { data: signedUrlData, error: urlError } = await supabase.storage
          .from('job-photos')
          .createSignedUrl(filePath, 31536000); // 1 year in seconds

        if (urlError) throw urlError;

        setUploadedFiles(prev => 
          prev.map((f, idx) => 
            idx === prev.length - files.length + i 
              ? { ...f, url: signedUrlData.signedUrl, uploaded: true }
              : f
          )
        );
      } catch (error: any) {
        console.error('Error uploading file:', error);
        console.error('Error details:', {
          message: error?.message,
          statusCode: error?.statusCode,
          error: error?.error,
        });
        toast({
          title: "Error al subir imagen",
          description: error?.message || "Por favor intenta de nuevo",
          variant: "destructive",
        });
      }
    }

    setIsUploading(false);
    e.target.value = '';
  };

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return taskDescription.trim() !== "" && 
               (datePreference !== 'specific' || specificDate !== undefined);
      case 2:
        return location.trim() !== "";
      case 3:
        return details.trim() !== "";
      case 4:
        return uploadedFiles.length === 0 || uploadedFiles.every(f => f.uploaded);
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canProceedToNextStep() && currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };


  // Show confirmation screen first (step before actual submission)
  const handleShowConfirmation = () => {
    if (!canProceedToNextStep()) return;

    // Check authentication before showing confirmation
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setShowConfirmation(true);
  };

  // Actually submit the job (called from confirmation screen)
  const handleSubmit = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsSubmitting(true);

    try {
      // Format date
      let dateText = "Flexible";
      if (datePreference === 'specific' && specificDate) {
        dateText = format(specificDate, "dd/MM/yyyy");
      } else if (datePreference === 'before') {
        dateText = "Inmediatamente";
      }

      // Validate input before submission
      const validationResult = jobRequestSchema.safeParse({
        service: taskDescription,
        date: dateText,
        location: location,
        details: details,
        photo_count: uploadedFiles.length
      });

      if (!validationResult.success) {
        const firstError = validationResult.error.issues[0];
        toast({
          title: "Error de validación",
          description: firstError.message,
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Create job entry in jobs table
      const scheduledDate = specificDate || new Date(Date.now() + 24 * 60 * 60 * 1000);

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
        title: taskDescription,
        description: details,
        category: category || 'General',
        service_type: taskDescription,
        problem: details,
        location: location,
        photos: uploadedFiles.filter(f => f.uploaded).map(f => f.url),
        rate: VISIT_BASE_FEE,
        status: 'pending' as const,
        scheduled_at: scheduledDate instanceof Date ? scheduledDate.toISOString() : typeof scheduledDate === 'string' ? scheduledDate : new Date().toISOString(),
        time_preference: selectedTimeSlots.join(', '),
        exact_time: needsSpecificTime ? selectedTimeSlots.join(', ') : '',
        budget: '',
        photo_count: uploadedFiles.filter(f => f.uploaded).length
      };

      let newJob: { id: string } | null = null;
      const { data: insertedJob, error: jobError } = await supabase
        .from('jobs')
        .insert(jobInsertData)
        .select('id')
        .single();

      if (jobError) {
        console.error('Error creating job:', jobError);
        if (jobError.message?.includes('row-level security')) {
          // Session mismatch — try refreshing and retrying once
          const { data: { session: refreshed } } = await supabase.auth.refreshSession();
          if (refreshed?.user?.id) {
            const { data: retryJob, error: retryError } = await supabase
              .from('jobs')
              .insert({ ...jobInsertData, client_id: refreshed.user.id })
              .select('id')
              .single();
            if (!retryError && retryJob) {
              newJob = retryJob;
            } else {
              toast({ title: "Error de sesión", description: "Por favor cierra sesión, vuelve a entrar, e intenta de nuevo.", variant: "destructive" });
              setIsSubmitting(false);
              return;
            }
          } else {
            toast({ title: "Error de sesión", description: "Por favor cierra sesión, vuelve a entrar, e intenta de nuevo.", variant: "destructive" });
            setIsSubmitting(false);
            return;
          }
        } else {
          throw jobError;
        }
      } else {
        newJob = insertedJob;
      }

      if (!newJob) {
        throw new Error('No se pudo crear el trabajo');
      }

      console.log('✅ Job created successfully:', newJob.id);

      // Send WhatsApp notification to company
      try {
        await supabase.functions.invoke('send-whatsapp-notification', {
          body: { 
            job_id: newJob.id,
            type: 'new_job_request' 
          }
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }
      
      // Clear saved form data
      clearFormData();
      
      // Store job ID and redirect to Stripe Checkout
      setCreatedJobId(newJob.id);
      setShowConfirmation(false);
      await redirectToCheckout(newJob.id);

    } catch (error: any) {
      console.error('Error submitting task:', error);
      toast({
        title: 'Error al enviar la solicitud',
        description: error?.message || 'Inténtalo nuevamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthModalLogin = () => {
    // Force client login context for booking flow
    localStorage.setItem('login_context', 'client');
    
    // Save form data before redirect - DON'T auto-submit, let user continue
    const formData = {
      taskDescription,
      datePreference,
      specificDate: specificDate?.toISOString(),
      needsSpecificTime,
      selectedTimeSlots,
      location,
      details,
      currentStep, // Save current step (usually 4 - photo upload)
      coordinates,
      uploadedFileUrls: uploadedFiles.filter(f => f.uploaded).map(f => f.url),
      showConfirmationOnReturn: false // DON'T auto-submit
    };
    saveFormData(formData);
    
    // Store return path for auth callback (works for email + OAuth)
    const RETURN_PATH = '/book-job';
    sessionStorage.setItem('auth_return_to', RETURN_PATH);
    localStorage.setItem('auth_return_to', RETURN_PATH); // Backup for OAuth
    localStorage.setItem('auth_source', 'book_job_form'); // Flag for debugging
    
    console.log('💾 Saved form data with step:', currentStep);
    
    // Navigate to login with returnTo in state
    navigate('/login', { state: { returnTo: RETURN_PATH } });
  };

  const handleSuccessNavigate = () => {
    // Reset form state
    setCurrentStep(1);
    setTaskDescription("");
    setDatePreference('specific');
    setSpecificDate(undefined);
    setNeedsSpecificTime(false);
    setSelectedTimeSlots([]);
    setLocation("");
    setDetails("");
    setUploadedFiles([]);
    setShowSuccess(false);
    
    // Navigate to waiting page (Checkout handles payment)
    navigate(`/esperando-proveedor?job_id=${createdJobId}`);
  };

  // DEPRECATED: Authorization handlers removed in favor of Checkout flow. See Phase 4 S5.

  const handleGoBack = () => {
    setShowConfirmation(false);
  };

  // Format display values for confirmation screen
  const getFormattedDate = () => {
    if (datePreference === 'specific' && specificDate) {
      return format(specificDate, "dd/MM/yyyy");
    } else if (datePreference === 'before') {
      return "Inmediatamente";
    }
    return "Flexible";
  };

  const getFormattedTimePreference = () => {
    if (needsSpecificTime && selectedTimeSlots.length > 0) {
      const slotLabels = selectedTimeSlots.map(slotId => {
        const slot = timeSlots.find(s => s.id === slotId);
        return slot ? `${slot.label} (${slot.time})` : '';
      }).filter(Boolean);
      return slotLabels.join(', ');
    }
    return "Sin preferencia";
  };

  // Show loading skeleton while form data is being loaded
  if (isLoadingForm) {
    return (
      <div className="w-full flex gap-8">
        <div className="hidden lg:block w-56 flex-shrink-0">
          <div className="sticky top-32">
            <Skeleton className="h-8 w-48 mb-6" />
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-3xl">
          <Skeleton className="h-12 w-3/4 mb-8" />
          <div className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/4" />
              <Skeleton className="h-14 w-full" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/3" />
              <Skeleton className="h-32 w-full" />
            </div>
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex gap-8">
      {/* Auth Modal */}
      <AuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        onLogin={handleAuthModalLogin}
        onGuest={() => {}}
        showGuestOption={false}
      />

      {/* Sidebar Navigation */}
      <div className="hidden lg:block w-56 flex-shrink-0">
        <div className="sticky top-32">
          <h2 className="text-xl font-bold mb-6">Publicar un trabajo</h2>
          <div className="space-y-1">
            {steps.map((step) => (
              <button
                key={step.number}
                onClick={() => step.number < currentStep && setCurrentStep(step.number)}
                disabled={step.number > currentStep}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg transition-colors",
                  currentStep === step.number 
                    ? "bg-primary text-primary-foreground font-semibold border-l-4 border-primary" 
                    : step.number < currentStep
                    ? "text-muted-foreground hover:bg-accent cursor-pointer"
                    : "text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                {step.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-3xl">
        {/* Show success screen */}
        {showSuccess && createdJobId ? (
          <JobSuccessScreen
            jobId={createdJobId}
            onNavigate={handleSuccessNavigate}
            visitFeeAuthorized={true}
          />
        ) : showConfirmation ? (
          <BookingConfirmation
            service={taskDescription}
            date={getFormattedDate()}
            timePreference={getFormattedTimePreference()}
            location={location}
            details={details}
            photoCount={uploadedFiles.length}
            onConfirm={handleSubmit}
            onGoBack={handleGoBack}
            isSubmitting={isSubmitting}
          />
        ) : (
          <>
        {/* Step 1: Title & Date */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <h1 className="text-4xl font-jakarta font-medium text-foreground mb-8">Empecemos con lo básico</h1>
              
              <div className="space-y-3 relative">
                <Label className="text-lg font-semibold text-foreground">
                  En pocas palabras, ¿qué necesitas que se haga?
                  {category && <span className="text-sm font-normal text-muted-foreground ml-2">({category})</span>}
                </Label>
                <Input
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  onFocus={() => {
                    console.log('Input focused, suggestions:', suggestions.length);
                    setShowSuggestions(suggestions.length > 0);
                  }}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Ej: Lavado completo de auto, Pulido de faros..."
                  className="h-14 text-base"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-[100] w-full mt-1 bg-popover border-2 border-primary/20 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    <div className="p-2 bg-primary/5 border-b border-border">
                      <p className="text-xs text-muted-foreground font-medium">
                        {category ? `Sugerencias para ${category}` : 'Sugerencias populares'}
                      </p>
                    </div>
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          console.log('Suggestion clicked:', suggestion);
                          setTaskDescription(suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-accent/80 active:bg-accent transition-colors border-b last:border-b-0 border-border/30 text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold text-foreground">
                  ¿Cuándo necesitas que se haga?
                </Label>
                <div className="flex gap-3 flex-wrap">
                  <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
                    <PopoverTrigger asChild>
                  <Button
                    variant={datePreference === 'specific' ? "default" : "outline"}
                    className={cn(
                      "h-12 px-6 rounded-full transition-all active:scale-95",
                      datePreference === 'specific' && "ring-2 ring-primary/50 shadow-lg"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {specificDate ? format(specificDate, "MMM dd") : "En una fecha"}
                  </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background z-50" align="start">
                      <Calendar
                        mode="single"
                        selected={specificDate}
                        onSelect={(date) => {
                          setSpecificDate(date);
                          setDatePreference('specific');
                          setDatePopoverOpen(false);
                        }}
                        initialFocus
                        disabled={(date) => date < new Date()}
                        className="pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  
                  <Button
                    variant={datePreference === 'before' ? "default" : "outline"}
                    onClick={() => setDatePreference('before')}
                    className={cn(
                      "h-12 px-6 rounded-full transition-all active:scale-95",
                      datePreference === 'before' && "ring-2 ring-primary/50 shadow-lg"
                    )}
                  >
                    Inmediatamente
                  </Button>
                  
                  <Button
                    variant={datePreference === 'flexible' ? "default" : "outline"}
                    onClick={() => setDatePreference('flexible')}
                    className={cn(
                      "h-12 px-6 rounded-full transition-all active:scale-95",
                      datePreference === 'flexible' && "ring-2 ring-primary/50 shadow-lg"
                    )}
                  >
                    Soy flexible
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="specific-time"
                    checked={needsSpecificTime}
                    onCheckedChange={(checked) => setNeedsSpecificTime(checked as boolean)}
                  />
                  <Label htmlFor="specific-time" className="text-base font-medium cursor-pointer">
                    Necesito una hora específica del día
                  </Label>
                </div>

                {needsSpecificTime && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {timeSlots.map((slot) => {
                      const Icon = slot.icon;
                      const isSelected = selectedTimeSlots.includes(slot.id);
                      
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => toggleTimeSlot(slot.id)}
                          className={cn(
                            "p-4 rounded-xl border-2 transition-all hover:border-primary active:scale-95",
                            "flex flex-col items-center gap-2 text-center",
                            isSelected 
                              ? "border-primary bg-primary/10 ring-2 ring-primary/30 shadow-lg" 
                              : "border-border bg-background hover:bg-accent/50"
                          )}
                        >
                          <Icon className={cn(
                            "h-8 w-8",
                            isSelected ? "text-primary" : "text-muted-foreground"
                          )} />
                          <div>
                            <div className={cn(
                              "font-semibold",
                              isSelected ? "text-primary" : "text-foreground"
                            )}>
                              {slot.label}
                            </div>
                            <div className="text-xs text-muted-foreground">{slot.time}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 2: Location */}
          {currentStep === 2 && (
            <div className="space-y-6 pb-28 md:pb-0">
              {/* Sticky title on mobile */}
              <div className="sticky top-0 z-20 bg-background pt-2 pb-4 -mx-4 px-4 md:static md:mx-0 md:px-0 md:pt-0 md:pb-0">
                <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">¿Dónde necesitas que se haga?</h1>
                <p className="text-sm text-muted-foreground mt-1">Busca tu dirección o arrastra el mapa para ubicar el pin.</p>
              </div>
              
              <GoogleMapPicker 
                onLocationSelect={handleMapLocationSelect}
                initialLocation={location}
              />

              {/* Sticky bottom CTA bar - mobile only */}
              <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t border-border px-4 pt-3 shadow-floating" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}>
                <ModernButton
                  variant="primary"
                  onClick={handleNext}
                  disabled={!canProceedToNextStep()}
                  className="w-full h-12 rounded-full text-base font-semibold"
                >
                  Continuar
                </ModernButton>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <h1 className="text-4xl font-jakarta font-medium text-foreground mb-8">Cuéntanos más sobre tu trabajo</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  ¿Cuáles son los detalles?
                </Label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Sé lo más específico posible sobre lo que necesitas. ¡Los proveedores aman los detalles!"
                  className="min-h-[200px] text-base resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {details.length} caracteres
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Photos */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <h1 className="text-4xl font-jakarta font-medium text-foreground mb-8">Casi terminamos</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  Agregar fotos (opcional)
                </Label>
                <div className="border-2 border-dashed border-border rounded-xl p-6 text-center hover:border-primary transition-colors">
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    id="photo-upload"
                    disabled={isUploading}
                  />
                  <div
                    onClick={handleUploadClick}
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        {isUploading ? "Subiendo..." : "Subir fotos"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Selecciona una o más imágenes
                      </p>
                    </div>
                  </div>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className={cn(
                          "relative rounded-lg overflow-hidden border border-border aspect-square transition-all",
                          file.uploaded && "animate-scale-in"
                        )}
                      >
                        <img
                          src={file.url}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {file.uploaded && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center animate-scale-in">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                        {!file.uploaded && (
                          <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                            <div className="animate-spin w-6 h-6 border-4 border-primary border-t-transparent rounded-full" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {uploadedFiles.length === 0 && (
                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground text-center">
                      Las fotos ayudan a los profesionales a entender mejor tu solicitud, pero no son obligatorias.
                    </p>
                  </div>
                )}
               </div>
             </div>
           )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-12 pt-8 border-t">
            {currentStep > 1 && (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="h-12 px-6"
              >
                Atrás
              </Button>
            )}
            
            <div className="flex-1" />
            
            {currentStep < 4 ? (
              <ModernButton
                variant="primary"
                onClick={handleNext}
                disabled={!canProceedToNextStep()}
                className="h-12 px-8 rounded-full"
              >
                Siguiente
              </ModernButton>
            ) : (
              <ModernButton
                variant="primary"
                size="xl"
                onClick={handleShowConfirmation}
                disabled={!canProceedToNextStep() || isSubmitting}
                className="h-16 px-12 text-lg rounded-full transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl shadow-lg"
              >
                Confirmar servicio
              </ModernButton>
            )}
          </div>

        {/* Mobile Step Indicator */}
        <div className="lg:hidden mt-6 flex justify-center gap-2">
          {steps.map((step) => (
            <div
              key={step.number}
              className={cn(
                "h-2 rounded-full transition-all",
                currentStep === step.number 
                  ? "w-8 bg-primary" 
                  : "w-2 bg-muted"
              )}
            />
          ))}
        </div>
        </>
        )}
        </div>
    </div>
  );
};
