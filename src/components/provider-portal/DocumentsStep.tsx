import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  User, 
  UserCheck, 
  FileText, 
  CheckCircle2, 
  Camera,
  AlertCircle,
  Shield
} from "lucide-react";
import { cn } from "@/lib/utils";
import { DocumentCaptureDialog } from "./DocumentCaptureDialog";

type DocumentType = 'ine_front' | 'ine_back' | 'selfie' | 'selfie_with_id' | 'proof_of_address';

interface DocumentItem {
  type: DocumentType;
  name: string;
  description: string;
  icon: typeof CreditCard;
  required: boolean;
}

const REQUIRED_DOCUMENTS: DocumentItem[] = [
  {
    type: 'ine_front',
    name: 'INE/IFE (Frente)',
    description: 'Foto clara del frente de tu identificación',
    icon: CreditCard,
    required: true
  },
  {
    type: 'ine_back',
    name: 'INE/IFE (Reverso)',
    description: 'Foto clara del reverso de tu identificación',
    icon: CreditCard,
    required: true
  },
  {
    type: 'selfie',
    name: 'Foto de Perfil',
    description: 'Una foto tuya para tu perfil profesional',
    icon: User,
    required: true
  },
  {
    type: 'selfie_with_id',
    name: 'Selfie con INE',
    description: 'Foto sosteniendo tu INE junto a tu rostro',
    icon: UserCheck,
    required: true
  },
  {
    type: 'proof_of_address',
    name: 'Comprobante de Domicilio',
    description: 'Recibo de luz, agua o estado de cuenta (max 3 meses)',
    icon: FileText,
    required: false
  }
];

interface DocumentsStepProps {
  onComplete?: () => void;
  isOptional?: boolean;
}

export const DocumentsStep = ({ onComplete, isOptional = true }: DocumentsStepProps) => {
  const { user } = useAuth();
  const [uploadedDocs, setUploadedDocs] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [captureDialog, setCaptureDialog] = useState<{
    open: boolean;
    docType: DocumentType;
    title: string;
    description: string;
  } | null>(null);

  const fetchUploadedDocuments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('documents')
        .select('doc_type')
        .eq('provider_id', user.id);

      if (error) throw error;

      const docTypes = new Set(data?.map(d => d.doc_type) || []);
      setUploadedDocs(docTypes);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploadedDocuments();
  }, [user]);

  const openCaptureDialog = (doc: DocumentItem) => {
    setCaptureDialog({
      open: true,
      docType: doc.type,
      title: doc.name,
      description: doc.description
    });
  };

  const handleUploadComplete = () => {
    fetchUploadedDocuments();
    setCaptureDialog(null);
  };

  const requiredDocsUploaded = REQUIRED_DOCUMENTS
    .filter(d => d.required)
    .every(d => uploadedDocs.has(d.type));

  const uploadedCount = REQUIRED_DOCUMENTS.filter(d => uploadedDocs.has(d.type)).length;
  const progress = (uploadedCount / REQUIRED_DOCUMENTS.length) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Verificación de Identidad
        </h2>
        <p className="text-muted-foreground">
          {isOptional 
            ? 'Sube tus documentos para verificar tu cuenta y recibir más trabajos'
            : 'Sube tus documentos para completar la verificación'
          }
        </p>
      </div>

      {/* Progress */}
      <div className="bg-muted/50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progreso de verificación</span>
          <span className="text-sm text-muted-foreground">
            {uploadedCount}/{REQUIRED_DOCUMENTS.length} documentos
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Benefits Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
        <div>
          <p className="font-medium text-foreground text-sm">Beneficios de verificarte</p>
          <ul className="text-sm text-muted-foreground mt-1 space-y-0.5">
            <li>• Acceso a todos los trabajos disponibles</li>
            <li>• Badge de verificado visible para clientes</li>
            <li>• Mayor confianza y más solicitudes</li>
          </ul>
        </div>
      </div>

      {/* Document List */}
      <div className="space-y-3">
        {REQUIRED_DOCUMENTS.map((doc) => {
          const isUploaded = uploadedDocs.has(doc.type);
          const Icon = doc.icon;

          return (
            <button
              key={doc.type}
              onClick={() => !isUploaded && openCaptureDialog(doc)}
              disabled={isUploaded || loading}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left",
                isUploaded 
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-900/20" 
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
                loading && "opacity-50"
              )}
            >
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center shrink-0",
                isUploaded ? "bg-emerald-100 dark:bg-emerald-900/50" : "bg-muted"
              )}>
                {isUploaded ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Icon className="w-6 h-6 text-muted-foreground" />
                )}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={cn(
                    "font-medium",
                    isUploaded ? "text-emerald-700 dark:text-emerald-400" : "text-foreground"
                  )}>
                    {doc.name}
                  </p>
                  {doc.required && !isUploaded && (
                    <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary font-semibold">
                      Requerido
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {isUploaded ? 'Documento subido' : doc.description}
                </p>
              </div>

              {!isUploaded && (
                <Camera className="w-5 h-5 text-muted-foreground shrink-0" />
              )}
            </button>
          );
        })}
      </div>

      {/* Optional Skip Note */}
      {isOptional && !requiredDocsUploaded && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <p>
            Puedes omitir este paso y completar la verificación después desde tu perfil. 
            Sin embargo, no podrás aceptar trabajos hasta verificarte.
          </p>
        </div>
      )}

      {/* Capture Dialog */}
      {captureDialog && (
        <DocumentCaptureDialog
          open={captureDialog.open}
          onOpenChange={(open) => !open && setCaptureDialog(null)}
          docType={captureDialog.docType}
          title={captureDialog.title}
          description={captureDialog.description}
          onUploadComplete={handleUploadComplete}
        />
      )}
    </div>
  );
};