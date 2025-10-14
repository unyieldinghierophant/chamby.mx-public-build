import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Upload, Check } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface UploadedFile {
  file: File;
  url: string;
  uploaded: boolean;
}

export const JobBookingForm = () => {
  const [serviceType, setServiceType] = useState("");
  const [date, setDate] = useState<Date>();
  const [timeOfDay, setTimeOfDay] = useState("");
  const [exactTime, setExactTime] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

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

  const isFormValid = () => {
    return (
      serviceType.trim() !== "" &&
      date !== undefined &&
      timeOfDay !== "" &&
      exactTime !== "" &&
      uploadedFiles.length > 0 &&
      uploadedFiles.every(f => f.uploaded)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid()) return;

    setIsSubmitting(true);

    try {
      // Here you would submit the booking data to your backend
      // For now, just show a success message
      toast({
        title: "¡Trabajo agendado!",
        description: "Recibirás una confirmación pronto.",
      });

      // Reset form
      setServiceType("");
      setDate(undefined);
      setTimeOfDay("");
      setExactTime("");
      setUploadedFiles([]);
    } catch (error) {
      console.error('Error submitting booking:', error);
      toast({
        title: "Error",
        description: "No se pudo agendar el trabajo",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-6 bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg">
        <h2 className="text-3xl font-bold text-center mb-8">Agendar Trabajo</h2>

        {/* Service Type */}
        <div className="space-y-2">
          <Label htmlFor="serviceType" className="text-base font-semibold">
            Tipo de servicio *
          </Label>
          <Input
            id="serviceType"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
            placeholder="Ej: Limpieza, Reparación, Jardinería..."
            className="h-12 text-base"
            required
          />
        </div>

        {/* Date Picker */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Fecha *</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-normal text-base",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-5 w-5" />
                {date ? format(date, "PPP") : <span>Seleccionar fecha</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 bg-background" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
                className="pointer-events-auto"
                disabled={(date) => date < new Date()}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Time of Day Select */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Momento del día *</Label>
          <Select value={timeOfDay} onValueChange={setTimeOfDay}>
            <SelectTrigger className="h-12 text-base">
              <SelectValue placeholder="Seleccionar momento" />
            </SelectTrigger>
            <SelectContent className="bg-background">
              <SelectItem value="mañana">Mañana</SelectItem>
              <SelectItem value="tarde">Tarde</SelectItem>
              <SelectItem value="noche">Noche</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Exact Time */}
        <div className="space-y-2">
          <Label htmlFor="exactTime" className="text-base font-semibold">
            Hora exacta *
          </Label>
          <Input
            id="exactTime"
            type="time"
            value={exactTime}
            onChange={(e) => setExactTime(e.target.value)}
            className="h-12 text-base"
            required
          />
        </div>

        {/* Photo Upload */}
        <div className="space-y-2">
          <Label className="text-base font-semibold">Fotos del trabajo *</Label>
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

          {/* Uploaded Files Preview */}
          {uploadedFiles.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-4">
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
                    <div className="absolute inset-0 bg-success/90 flex items-center justify-center animate-in fade-in zoom-in duration-300">
                      <div className="w-12 h-12 rounded-full bg-background flex items-center justify-center">
                        <Check className="w-8 h-8 text-success" />
                      </div>
                    </div>
                  )}
                  {!file.uploaded && (
                    <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={!isFormValid() || isSubmitting}
          className="w-full h-14 text-lg font-bold rounded-full"
          size="lg"
        >
          {isSubmitting ? "Agendando..." : "Agendar trabajo"}
        </Button>
      </form>
    </div>
  );
};
