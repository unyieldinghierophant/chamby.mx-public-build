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
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface UploadedFile {
  file: File;
  url: string;
  uploaded: boolean;
}

type TimeOfDayOption = 'morning' | 'midday' | 'afternoon' | 'evening';
type DatePreference = 'specific' | 'before' | 'flexible';

export const JobBookingForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [taskDescription, setTaskDescription] = useState("");
  const [datePreference, setDatePreference] = useState<DatePreference>('specific');
  const [specificDate, setSpecificDate] = useState<Date>();
  const [needsSpecificTime, setNeedsSpecificTime] = useState(false);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<TimeOfDayOption[]>([]);
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [budget, setBudget] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [coordinates, setCoordinates] = useState<[number, number]>([19.4326, -99.1332]); // Default to Mexico City
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const { toast } = useToast();

  const steps = [
    { number: 1, label: "Título y Fecha" },
    { number: 2, label: "Ubicación" },
    { number: 3, label: "Detalles" },
    { number: 4, label: "Presupuesto" }
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

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=mx&limit=5`
      );
      const data = await response.json();
      setAddressSuggestions(data);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error searching address:', error);
    }
  };

  const handleAddressSelect = (suggestion: any) => {
    setLocation(suggestion.display_name);
    setCoordinates([parseFloat(suggestion.lat), parseFloat(suggestion.lon)]);
    setShowSuggestions(false);
    setAddressSuggestions([]);
  };

  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setCoordinates([lat, lng]);
        
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
          );
          const data = await response.json();
          setLocation(data.display_name);
        } catch (error) {
          console.error('Error reverse geocoding:', error);
        }
      },
    });
    return null;
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

        const { data: { publicUrl } } = supabase.storage
          .from('job-photos')
          .getPublicUrl(filePath);

        setUploadedFiles(prev => 
          prev.map((f, idx) => 
            idx === prev.length - files.length + i 
              ? { ...f, url: publicUrl, uploaded: true }
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
        return budget.trim() !== "" && uploadedFiles.length > 0 && uploadedFiles.every(f => f.uploaded);
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
        budget: budget,
        photo_count: uploadedFiles.length,
      };

      // Save to Supabase
      const { error: saveError } = await supabase
        .from('job_requests')
        .insert([jobData]);

      if (saveError) {
        throw saveError;
      }

      // Show success message
      toast({
        title: "✅ Solicitud guardada correctamente",
        description: "Redirigiendo a WhatsApp...",
      });

      // Wait a moment for the user to see the message
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Build WhatsApp message
      const message = `📋 Nueva solicitud de trabajo
🔧 Servicio: ${taskDescription}
📅 Fecha: ${dateText}
🕒 Preferencia: ${timeSlotText}
⏰ Hora exacta: ${needsSpecificTime ? timeSlotText : 'No especificada'}
📍 Ubicación: ${location}
💬 Detalles: ${details}
💰 Presupuesto: $${budget}`;

      const encodedMessage = encodeURIComponent(message);
      const whatsappURL = `https://wa.me/5213325438136?text=${encodedMessage}`;
      
      // Open WhatsApp
      window.open(whatsappURL, "_blank");

      // Reset form
      setCurrentStep(1);
      setTaskDescription("");
      setDatePreference('specific');
      setSpecificDate(undefined);
      setNeedsSpecificTime(false);
      setSelectedTimeSlots([]);
      setLocation("");
      setDetails("");
      setBudget("");
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: "❌ Error al guardar la solicitud",
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
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  Ubicación del trabajo
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                  <Input
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      searchAddress(e.target.value);
                    }}
                    onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                    placeholder="Ingresa dirección o colonia"
                    className="h-14 text-base pl-12"
                  />
                  {showSuggestions && addressSuggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-2 bg-background border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleAddressSelect(suggestion)}
                          className="w-full text-left px-4 py-3 hover:bg-accent transition-colors border-b border-border last:border-b-0"
                        >
                          <p className="text-sm text-foreground">{suggestion.display_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Comienza a escribir o marca en el mapa
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  Marca tu ubicación exacta
                </Label>
                <div className="h-[400px] rounded-lg overflow-hidden border border-border">
                  <MapContainer
                    center={coordinates}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                    key={coordinates.join(',')}
                  >
                    <MapClickHandler />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    {coordinates && <Marker position={coordinates} />}
                  </MapContainer>
                </div>
                <p className="text-sm text-muted-foreground">
                  Haz clic en el mapa para ajustar la ubicación exacta
                </p>
              </div>
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

          {/* Step 4: Budget */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <h1 className="text-4xl font-bold text-foreground mb-8 font-['Made_Dillan']">Sugiere tu presupuesto</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  ¿Cuál es tu presupuesto?
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-semibold text-foreground">
                    $
                  </span>
                  <Input
                    type="number"
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    placeholder="0"
                    className="h-14 text-base pl-10"
                  />
                </div>
              </div>

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
                onClick={handleSubmit}
                disabled={!canProceedToNextStep() || isSubmitting}
                className="h-12 px-8 rounded-full transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
              >
                {isSubmitting ? "Publicando..." : "Publicar trabajo"}
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
