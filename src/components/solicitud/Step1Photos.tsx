import { useState } from "react";
import { Upload, X, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface Step1PhotosProps {
  photos: string[];
  onPhotosChange: (photos: string[]) => void;
}

const Step1Photos = ({ photos, onPhotosChange }: Step1PhotosProps) => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;

    setUploading(true);

    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}_${Math.random()}.${fileExt}`;

        const { error: uploadError, data } = await supabase.storage
          .from("job-photos")
          .upload(fileName, file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("job-photos").getPublicUrl(fileName);

        return publicUrl;
      });

      const uploadedUrls = await Promise.all(uploadPromises);
      onPhotosChange([...photos, ...uploadedUrls]);
      toast.success(`${uploadedUrls.length} foto${uploadedUrls.length > 1 ? 's' : ''} subida${uploadedUrls.length > 1 ? 's' : ''} exitosamente`);
    } catch (error: any) {
      console.error("Error uploading photos:", error);
      toast.error(error?.message || "Error al subir las fotos. Por favor intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">Sube fotos o videos del problema</h3>
        <p className="text-muted-foreground text-sm">
          Esto ayuda a los profesionales a entender mejor tu necesidad
        </p>
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          {photos.map((photo, index) => (
            <div key={index} className="relative group">
              <img
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg border-2 border-green-500"
              />
              {/* Success Checkmark */}
              <div className="absolute top-2 left-2 bg-green-500 rounded-full p-1">
                <CheckCircle2 className="h-4 w-4 text-white" />
              </div>
              {/* Remove Button */}
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removePhoto(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <label
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 cursor-pointer transition-colors ${
          uploading
            ? "border-muted bg-muted/20"
            : photos.length > 0
            ? "border-green-500 bg-green-50 dark:bg-green-950/20 hover:border-green-600"
            : "border-muted-foreground/30 hover:border-primary hover:bg-primary/5"
        }`}
      >
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={handleFileUpload}
          disabled={uploading}
          className="hidden"
        />
        {uploading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">Subiendo...</p>
          </div>
        ) : photos.length > 0 ? (
          <>
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400 mb-4" />
            <p className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">Fotos subidas exitosamente</p>
            <p className="text-xs text-green-600 dark:text-green-400">
              Haz clic para agregar más
            </p>
          </>
        ) : (
          <>
            <Upload className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm font-medium mb-1">Haz clic para subir fotos</p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, MP4 hasta 10MB
            </p>
          </>
        )}
      </label>

      {/* Success and Tips Messages */}
      {photos.length > 0 ? (
        <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                ¡Listo!
              </p>
              <p className="text-sm text-green-700 dark:text-green-300">
                {photos.length} foto{photos.length > 1 ? 's' : ''} subida{photos.length > 1 ? 's' : ''}. Puedes continuar al siguiente paso.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <ImageIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Consejo
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Subir fotos claras del problema ayuda a recibir presupuestos más precisos
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step1Photos;
