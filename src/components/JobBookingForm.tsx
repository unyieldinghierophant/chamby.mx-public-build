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
  const { toast } = useToast();

  const steps = [
    { number: 1, label: "Title & Date" },
    { number: 2, label: "Location" },
    { number: 3, label: "Details" },
    { number: 4, label: "Budget" }
  ];

  const timeSlots = [
    { id: 'morning' as TimeOfDayOption, icon: Sunrise, label: 'Morning', time: 'Before 10am' },
    { id: 'midday' as TimeOfDayOption, icon: Sun, label: 'Midday', time: '10am - 2pm' },
    { id: 'afternoon' as TimeOfDayOption, icon: Sunset, label: 'Afternoon', time: '2pm - 6pm' },
    { id: 'evening' as TimeOfDayOption, icon: Moon, label: 'Evening', time: 'After 6pm' },
  ];

  const toggleTimeSlot = (slotId: TimeOfDayOption) => {
    setSelectedTimeSlots(prev => 
      prev.includes(slotId) 
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
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
      // Here you would submit the booking data to your backend
      toast({
        title: "¡Trabajo publicado!",
        description: "Los taskers comenzarán a enviar ofertas pronto.",
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
      setBudget("");
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting task:', error);
      toast({
        title: "Error",
        description: "No se pudo publicar el trabajo",
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
          <h2 className="text-xl font-bold mb-6">Post a task</h2>
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
        <div className="bg-card border border-border rounded-2xl p-8 shadow-lg">
          {/* Step 1: Title & Date */}
          {currentStep === 1 && (
            <div className="space-y-8">
              <h1 className="text-4xl font-bold text-foreground mb-8">Let's start with the basics</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  In a few words, what do you need done?
                </Label>
                <Input
                  value={taskDescription}
                  onChange={(e) => setTaskDescription(e.target.value)}
                  placeholder="help move my sofa"
                  className="h-14 text-base"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-lg font-semibold text-foreground">
                  When do you need this done?
                </Label>
                <div className="flex gap-3 flex-wrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={datePreference === 'specific' ? "default" : "outline"}
                        className="h-12 px-6 rounded-full"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {specificDate ? format(specificDate, "MMM dd") : "On a date"}
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
                    className="h-12 px-6 rounded-full"
                  >
                    Before date
                  </Button>
                  
                  <Button
                    variant={datePreference === 'flexible' ? "default" : "outline"}
                    onClick={() => setDatePreference('flexible')}
                    className="h-12 px-6 rounded-full"
                  >
                    I'm flexible
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
                    I need a certain time of day
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
                            "p-4 rounded-xl border-2 transition-all hover:border-primary",
                            "flex flex-col items-center gap-2 text-center",
                            isSelected 
                              ? "border-primary bg-primary/5" 
                              : "border-border bg-background"
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
              <h1 className="text-4xl font-bold text-foreground mb-8">Where do you need this done?</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  Task location
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Enter address or suburb"
                    className="h-14 text-base pl-12"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Start typing and select from the dropdown
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Details */}
          {currentStep === 3 && (
            <div className="space-y-8">
              <h1 className="text-4xl font-bold text-foreground mb-8">Tell us more about your task</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  What are the details?
                </Label>
                <Textarea
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Be as specific as you can about what needs doing. Taskers love detail!"
                  className="min-h-[200px] text-base resize-none"
                />
                <p className="text-sm text-muted-foreground">
                  {details.length} characters
                </p>
              </div>
            </div>
          )}

          {/* Step 4: Budget */}
          {currentStep === 4 && (
            <div className="space-y-8">
              <h1 className="text-4xl font-bold text-foreground mb-8">Suggest your budget</h1>
              
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-foreground">
                  What's your budget?
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
                  Add photos (optional)
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
                        {isUploading ? "Uploading..." : "Upload photos"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Select one or more images
                      </p>
                    </div>
                  </label>
                </div>

                {uploadedFiles.length > 0 && (
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg overflow-hidden border border-border aspect-square"
                      >
                        <img
                          src={file.url}
                          alt={`Upload ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {file.uploaded && (
                          <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-success flex items-center justify-center">
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
                Back
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
                Next
              </ModernButton>
            ) : (
              <ModernButton
                variant="primary"
                onClick={handleSubmit}
                disabled={!canProceedToNextStep() || isSubmitting}
                className="h-12 px-8 rounded-full"
              >
                {isSubmitting ? "Publishing..." : "Post task"}
              </ModernButton>
            )}
          </div>
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
