import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { ModernButton } from "@/components/ui/modern-button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarIcon, Upload, Check, Sunrise, Sun, Sunset, Moon, MapPin } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { GoogleMapPicker } from './GoogleMapPicker';
import { z } from 'zod';

// Input validation schema
const jobRequestSchema = z.object({
  service: z.string().trim().min(1, "Servicio requerido").max(200, "Máximo 200 caracteres"),
  date: z.string().trim().max(50, "Máximo 50 caracteres"),
  location: z.string().trim().min(5, "Ubicación debe tener al menos 5 caracteres").max(500, "Máximo 500 caracteres"),
  details: z.string().trim().max(2000, "Máximo 2000 caracteres"),
  photo_count: z.number().int().min(0).max(10, "Máximo 10 fotos")
});

interface UploadedFile {
  file: File;
  url: string;
  uploaded: boolean;
}

type TimeOfDayOption = 'morning' | 'midday' | 'afternoon' | 'evening';
type DatePreference = 'specific' | 'before' | 'flexible';

interface JobBookingFormProps {
  initialService?: string;
  initialDescription?: string;
}

export const JobBookingForm = ({ initialService, initialDescription }: JobBookingFormProps = {}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [taskDescription, setTaskDescription] = useState(initialService || "");
  const [datePreference, setDatePreference] = useState<DatePreference>('specific');
  const [specificDate, setSpecificDate] = useState<Date>();
  const [needsSpecificTime, setNeedsSpecificTime] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeOfDayOption[]>([]);
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState(initialDescription || "");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 19.4326, lng: -99.1332 });
  const { toast } = useToast();

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
      const filePath = `${fileName}`;

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
      } catch (error) {
        console.error('Error uploading file:', error);
        toast({
          title: "Error al subir imagen",
          description: "Por favor intenta de nuevo",
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
        return uploadedFiles.length > 0 && uploadedFiles.every(f => f.uploaded);
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


  const handleSubmit = async () => {
    if (!canProceedToNextStep()) return;

    setIsSubmitting(true);

    try {
      // Format date
      let dateText = "Flexible";
      if (datePreference === 'specific' && specificDate) {
        dateText = format(specificDate, "dd/MM/yyyy");
      } else if (datePreference === 'before') {
        dateText = "Inmediatamente";
      }

      // Format time slots
      let timeSlotText = "Sin preferencia";
      if (needsSpecificTime && selectedTimeSlots.length > 0) {
        const slotLabels = selectedTimeSlots.map(slotId => {
          const slot = timeSlots.find(s => s.id === slotId);
          return slot ? `${slot.label} (${slot.time})` : '';
        }).filter(Boolean);
        timeSlotText = slotLabels.join(', ');
      }

      // Prepare job data
      const jobData = {
        user_id: (await supabase.auth.getUser()).data.user?.id || null,
        service: taskDescription,
        date: dateText,
        time_preference: timeSlotText,
        exact_time: needsSpecificTime ? timeSlotText : null,
        location: location,
        details: details,
        photo_count: uploadedFiles.length,
      };

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
        return;
      }

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('job_requests')
        .insert([jobData]);

      if (saveError) {
        throw saveError;
      }

      // Open WhatsApp with form data
      const message = `📋 Nueva solicitud de trabajo
🔧 Servicio: ${taskDescription}
📅 Fecha: ${dateText}
📍 Ubicación: ${location}
💬 Detalles: ${details}`;
      
      const encodedMessage = encodeURIComponent(message);
      const phoneNumber = "523325438136";
      const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
      
      // Use direct navigation instead of window.open to avoid browser blocking
      window.location.href = whatsappUrl;

      // Show success toast
      toast({
        title: "✅ Solicitud enviada",
        description: "Abriendo WhatsApp...",
      });

      // Reset form
      setCurrentStep(1);
      setTaskDescription("");
      setDatePreference('specific');
      setSpecificDate(undefined);
      setNeedsSpecificTime(false);
      setSelectedTimeSlots([]);
      setLocation("");
      setDetails("");
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: "❌ Error al enviar la solicitud",
        description: "Inténtalo nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full flex gap-8">
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
        {/* Step 1: Title & Date */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <h1 className="text-4xl font-bold text-foreground mb-8 font-['Made_Dillan']">Empecemos con lo básico</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  En pocas palabras, ¿qué necesitas que se haga?
                </Label>
                <Input
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="ayuda para mover mi sofá"
                  className="h-14 text-base"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold text-foreground">
                  ¿Cuándo necesitas que se haga?
                </Label>
                <div className="flex gap-3 flex-wrap">
                  <Popover>
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
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={specificDate}
                        onSelect={(date) => {
                          setSpecificDate(date);
                          setDatePreference('specific');
                        }}
                        initialFocus
                        disabled={(date) => date < new Date()}
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
            <div className="space-y-8">
              <h1 className="text-4xl font-bold text-foreground mb-8 font-['Made_Dillan']">¿Dónde necesitas que se haga?</h1>
              
              <GoogleMapPicker 
                onLocationSelect={handleMapLocationSelect}
                initialLocation={location}
              />
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <h1 className="text-4xl font-bold text-foreground mb-8 font-['Made_Dillan']">Cuéntanos más sobre tu trabajo</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  ¿Cuáles son los detalles?
                </Label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Sé lo más específico posible sobre lo que necesitas. ¡Los taskers aman los detalles!"
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
              <h1 className="text-4xl font-bold text-foreground mb-8 font-['Made_Dillan']">Casi terminamos</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  Agregar fotos
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
                  <label
                    htmlFor="photo-upload"
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
                  </label>
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
                onClick={handleSubmit}
                disabled={!canProceedToNextStep() || isSubmitting}
                className="h-16 px-12 text-lg rounded-full transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-xl shadow-lg"
              >
                {isSubmitting ? "Enviando..." : "Solicitar servicio"}
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
        </div>
    </div>
  );
};
