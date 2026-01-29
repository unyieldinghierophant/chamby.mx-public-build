import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Upload, Loader2, Camera, ImageIcon } from "lucide-react";

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType: string;
  title: string;
  description: string;
  onUploadComplete: () => void;
}

export const DocumentUploadDialog = ({
  open,
  onOpenChange,
  docType,
  title,
  description,
  onUploadComplete,
}: DocumentUploadDialogProps) => {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) {
      toast.error("Error de sesión", {
        description: "Por favor inicia sesión nuevamente"
      });
      return;
    }

    setUploading(true);
    try {
      // Verify we have a valid session before uploading
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Sesión expirada", {
          description: "Por favor recarga la página e inicia sesión nuevamente"
        });
        setUploading(false);
        return;
      }

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/verification/${docType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create signed URL since bucket is private (valid for 1 year)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from("user-documents")
        .createSignedUrl(fileName, 60 * 60 * 24 * 365); // 1 year

      if (signedUrlError) throw signedUrlError;

      const fileUrl = signedUrlData?.signedUrl;
      if (!fileUrl) throw new Error('No se pudo generar la URL del documento');

      // Create document record - use provider_id (which is user.id)
      const { error: dbError } = await supabase
        .from("documents")
        .insert({
          provider_id: user.id,
          doc_type: docType,
          file_url: fileUrl,
          verification_status: "pending",
        });

      if (dbError) throw dbError;

      // Update provider_details verification_status to pending if it was 'none'
      await supabase
        .from("provider_details")
        .update({ verification_status: 'pending' })
        .eq('user_id', user.id)
        .eq('verification_status', 'none');

      toast.success("Documento subido exitosamente");
      setFile(null);
      onUploadComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      
      // Provide specific error messages based on error type
      let errorMessage = "Ocurrió un error inesperado";
      
      if (error?.message?.includes('Unauthorized') || error?.message?.includes('JWT') || error?.message?.includes('expired')) {
        errorMessage = "Tu sesión ha expirado. Por favor recarga la página e inicia sesión nuevamente.";
      } else if (error?.message?.includes('exceeded') || error?.message?.includes('size') || error?.message?.includes('too large')) {
        errorMessage = "El archivo es demasiado grande. Máximo 5MB permitido.";
      } else if (error?.message?.includes('policy') || error?.statusCode === 403 || error?.status === 403) {
        errorMessage = "No tienes permiso para subir este archivo. Intenta cerrar sesión y volver a iniciar.";
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error("Error al subir documento", {
        description: errorMessage
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Option buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => cameraInputRef.current?.click()}
              disabled={uploading}
            >
              <Camera className="w-6 h-6" />
              <span className="text-sm">Tomar Foto</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <ImageIcon className="w-6 h-6" />
              <span className="text-sm">Galería</span>
            </Button>
          </div>

          {/* Hidden inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />

          {/* Selected file preview */}
          {file && (
            <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Subir
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};