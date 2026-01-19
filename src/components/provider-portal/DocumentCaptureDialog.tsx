import { useState, useRef, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Camera, RotateCcw, Check, X, Upload, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type DocumentType = 'ine_front' | 'ine_back' | 'selfie' | 'selfie_with_id' | 'proof_of_address';

interface DocumentCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType: DocumentType;
  title: string;
  description: string;
  onUploadComplete: () => void;
}

const DOCUMENT_GUIDES: Record<DocumentType, {
  overlayType: 'card' | 'face' | 'face_with_card' | 'document';
  instructions: string;
  tips: string[];
}> = {
  ine_front: {
    overlayType: 'card',
    instructions: 'Coloca el frente de tu INE/IFE dentro del marco',
    tips: ['Asegúrate de que la foto sea clara', 'Evita reflejos y sombras', 'El texto debe ser legible']
  },
  ine_back: {
    overlayType: 'card',
    instructions: 'Coloca el reverso de tu INE/IFE dentro del marco',
    tips: ['Incluye el código de barras', 'Toda la información debe verse', 'Mantén el documento recto']
  },
  selfie: {
    overlayType: 'face',
    instructions: 'Centra tu rostro en el óvalo',
    tips: ['Buena iluminación frontal', 'Sin lentes de sol o gorras', 'Expresión neutral']
  },
  selfie_with_id: {
    overlayType: 'face_with_card',
    instructions: 'Sostén tu INE junto a tu rostro',
    tips: ['Tu rostro y el ID deben verse claramente', 'El ID debe estar a la altura del rostro', 'La foto del ID debe coincidir contigo']
  },
  proof_of_address: {
    overlayType: 'document',
    instructions: 'Captura tu comprobante de domicilio',
    tips: ['Recibo de luz, agua, teléfono o estado de cuenta', 'No mayor a 3 meses', 'Debe mostrar tu nombre y dirección']
  }
};

export const DocumentCaptureDialog = ({
  open,
  onOpenChange,
  docType,
  title,
  description,
  onUploadComplete,
}: DocumentCaptureDialogProps) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<'select' | 'camera' | 'preview'>('select');
  const [uploading, setUploading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const guide = DOCUMENT_GUIDES[docType];

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setMode('camera');
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      // Mensaje más claro y accionable según el tipo de error
      if (error.name === 'NotAllowedError') {
        setCameraError('Permiso de cámara denegado. Por favor permite el acceso en la configuración de tu navegador, o usa el botón "Subir Imagen" para continuar.');
      } else if (error.name === 'NotFoundError') {
        setCameraError('No se detectó ninguna cámara. Por favor usa el botón "Subir Imagen" para subir una foto desde tu galería.');
      } else if (error.name === 'NotReadableError') {
        setCameraError('La cámara está siendo usada por otra aplicación. Ciérrala e intenta de nuevo, o sube una imagen.');
      } else {
        setCameraError('No se pudo acceder a la cámara. Usa el botón "Subir Imagen" para continuar.');
      }
      // Toast adicional para mayor visibilidad
      toast.error('No se pudo acceder a la cámara', {
        description: 'Usa el botón "Subir Imagen" para continuar'
      });
    }
  }, [facingMode]);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  }, []);

  const capturePhoto = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      setMode('preview');
      stopCamera();
    }
  }, [stopCamera]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Archivo inválido', {
        description: 'Por favor selecciona una imagen (JPG, PNG, HEIC, etc.)'
      });
      return;
    }
    
    // Validar tamaño (máx 15MB para acomodar fotos de alta resolución)
    const maxSizeMB = 15;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error('Imagen muy grande', {
        description: `El archivo debe ser menor a ${maxSizeMB}MB. Intenta con otra imagen.`
      });
      return;
    }
    
    const reader = new FileReader();
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      toast.error('Error al leer imagen', {
        description: 'No se pudo cargar la imagen. Intenta con otra foto o usa la cámara.'
      });
    };
    reader.onload = (event) => {
      setCapturedImage(event.target?.result as string);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  };

  const retake = () => {
    setCapturedImage(null);
    setMode('select');
  };

  const switchCamera = async () => {
    stopCamera();
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  useEffect(() => {
    if (mode === 'camera' && facingMode) {
      startCamera();
    }
  }, [facingMode]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  useEffect(() => {
    if (!open) {
      stopCamera();
      setCapturedImage(null);
      setMode('select');
      setCameraError(null);
    }
  }, [open, stopCamera]);

  const handleUpload = async () => {
    if (!capturedImage || !user) return;

    setUploading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      
      const fileName = `${user.id}/verification/${docType}_${Date.now()}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from("user-documents")
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("user-documents")
        .getPublicUrl(fileName);

      // Create document record
      const { error: dbError } = await supabase
        .from("documents")
        .insert({
          provider_id: user.id,
          doc_type: docType,
          file_url: publicUrl,
          verification_status: "pending",
        });

      if (dbError) throw dbError;

      // Update provider_details verification_status to pending if it was 'none'
      await supabase
        .from("provider_details")
        .update({ verification_status: 'pending' })
        .eq('user_id', user.id)
        .eq('verification_status', 'none');

      toast.success("Documento capturado exitosamente");
      onUploadComplete();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error("Error al subir documento");
    } finally {
      setUploading(false);
    }
  };

  const renderOverlay = () => {
    switch (guide.overlayType) {
      case 'card':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[85%] aspect-[1.586/1] border-4 border-dashed border-white/80 rounded-xl">
              <div className="absolute -top-8 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-lg">
                {guide.instructions}
              </div>
              {/* Corner markers */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br-lg" />
            </div>
          </div>
        );
      case 'face':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-48 h-64 border-4 border-dashed border-white/80 rounded-[50%]">
              <div className="absolute -top-8 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-lg">
                {guide.instructions}
              </div>
            </div>
          </div>
        );
      case 'face_with_card':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative flex items-center gap-4">
              {/* Face oval */}
              <div className="w-32 h-44 border-4 border-dashed border-white/80 rounded-[50%]" />
              {/* Plus sign */}
              <div className="text-white text-3xl font-bold">+</div>
              {/* ID card */}
              <div className="w-28 h-20 border-4 border-dashed border-white/80 rounded-lg" />
            </div>
            <div className="absolute top-8 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-lg">
              {guide.instructions}
            </div>
          </div>
        );
      case 'document':
        return (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative w-[80%] aspect-[1/1.414] border-4 border-dashed border-white/80 rounded-lg">
              <div className="absolute -top-8 left-0 right-0 text-center text-white text-sm font-medium drop-shadow-lg">
                {guide.instructions}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="relative">
          {/* Mode: Select */}
          {mode === 'select' && (
            <div className="p-4 space-y-4">
              {/* Tips */}
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Consejos</p>
                <ul className="space-y-1">
                  {guide.tips.map((tip, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {cameraError && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg">
                  {cameraError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={startCamera}
                >
                  <Camera className="w-8 h-8" />
                  <span className="text-sm">Usar Cámara</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-24 flex-col gap-2"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageIcon className="w-8 h-8" />
                  <span className="text-sm">Subir Imagen</span>
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              <Button
                variant="ghost"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
            </div>
          )}

          {/* Mode: Camera */}
          {mode === 'camera' && (
            <div className="relative bg-black aspect-[3/4]">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
              
              {/* Overlay Guide */}
              {renderOverlay()}

              {/* Camera Controls */}
              <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                  onClick={() => {
                    stopCamera();
                    setMode('select');
                  }}
                >
                  <X className="w-6 h-6" />
                </Button>
                
                <Button
                  size="icon"
                  className="w-16 h-16 rounded-full bg-white hover:bg-white/90"
                  onClick={capturePhoto}
                >
                  <div className="w-12 h-12 rounded-full border-4 border-primary" />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="w-12 h-12 rounded-full bg-white/20 text-white hover:bg-white/30"
                  onClick={switchCamera}
                >
                  <RotateCcw className="w-6 h-6" />
                </Button>
              </div>
            </div>
          )}

          {/* Mode: Preview */}
          {mode === 'preview' && capturedImage && (
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured"
                className="w-full aspect-[3/4] object-cover"
              />
              
              <div className="p-4 space-y-3">
                <p className="text-sm text-muted-foreground text-center">
                  ¿La imagen se ve clara y completa?
                </p>
                
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={retake}
                    disabled={uploading}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retomar
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Confirmar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden canvas for capture */}
        <canvas ref={canvasRef} className="hidden" />
      </DialogContent>
    </Dialog>
  );
};