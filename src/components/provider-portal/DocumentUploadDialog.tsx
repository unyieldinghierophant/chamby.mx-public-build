import { useState } from "react";
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
import { Upload, Loader2 } from "lucide-react";

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !user) return;

    setUploading(true);
    try {
      // Use user.id directly as client_id
      const clientId = user.id;

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/verification/${docType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("user-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("user-documents")
        .getPublicUrl(fileName);

      // Create document record
      const { error: dbError } = await supabase
        .from("documents")
        .insert({
          client_id: clientData.id,
          doc_type: docType,
          file_url: publicUrl,
          verification_status: "pending",
        });

      if (dbError) throw dbError;

      toast.success("Documento subido exitosamente");
      setFile(null);
      onUploadComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error("Error al subir documento");
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
          <div>
            <Label htmlFor="document">Seleccionar archivo</Label>
            <Input
              id="document"
              type="file"
              accept="image/*,.pdf"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </div>
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
