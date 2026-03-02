import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Upload, ArrowLeft, Clock, XCircle, FileText, Eye, Download, RefreshCw, AlertTriangle } from "lucide-react";
import { DocumentUploadDialog } from "@/components/provider-portal/DocumentUploadDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

/**
 * Maps the canonical document requirements to ALL possible doc_type values
 * that could exist in the documents table from different upload flows.
 * 
 * Onboarding flow (DocumentCaptureDialog) uses: ine_front, ine_back, selfie, selfie_with_id
 * Verification page (DocumentUploadDialog) uses: face_photo, id_card, id_front, criminal_record
 * Admin trigger (enforce_verified_has_docs) checks: face_photo, id_card/id_front, criminal_record
 */
const DOC_REQUIREMENT_MAP: {
  key: string;
  label: string;
  description: string;
  matchTypes: string[];
  uploadDocType: string;
}[] = [
  {
    key: 'face_photo',
    label: 'Foto de rostro',
    description: 'Una foto clara de tu rostro para identificación',
    matchTypes: ['face_photo', 'selfie', 'selfie_with_id'],
    uploadDocType: 'face_photo',
  },
  {
    key: 'id_card',
    label: 'INE / Identificación oficial',
    description: 'Identificación oficial por ambos lados',
    matchTypes: ['id_card', 'id_front', 'ine_front', 'ine_back'],
    uploadDocType: 'id_card',
  },
  {
    key: 'criminal_record',
    label: 'Carta de antecedentes no penales',
    description: 'Documento de antecedentes no penales actualizado',
    matchTypes: ['criminal_record'],
    uploadDocType: 'criminal_record',
  },
];

const DOCUMENT_LABELS: Record<string, string> = {
  id_card: 'INE/ID',
  id_front: 'INE Frente',
  id_back: 'INE Reverso',
  ine_front: 'INE Frente',
  ine_back: 'INE Reverso',
  criminal_record: 'Carta de Antecedentes',
  face_photo: 'Foto del Rostro',
  selfie: 'Selfie',
  selfie_with_id: 'Selfie con INE',
  proof_of_address: 'Comprobante de Domicilio',
};

const ProviderVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [uploadDialog, setUploadDialog] = useState<{
    open: boolean;
    docType: string;
    title: string;
    description: string;
  }>({ open: false, docType: "", title: "", description: "" });
  const [documents, setDocuments] = useState<any[]>([]);
  const [completedJobs, setCompletedJobs] = useState(0);
  const [loading, setLoading] = useState(true);
  const [verificationDetails, setVerificationDetails] = useState<{
    status: string;
    admin_notes: string | null;
  }>({ status: 'pending', admin_notes: null });

  const isVerified = verificationDetails.status === 'verified';

  useEffect(() => {
    if (user) {
      fetchVerificationData();
    }
  }, [user]);

  const fetchVerificationData = async () => {
    if (!user) return;

    try {
      // Fetch documents using user.id as provider_id
      const { data: docs, error: docsError } = await supabase
        .from("documents")
        .select("*")
        .eq("provider_id", user.id);

      if (docsError) {
        console.error("Error fetching documents:", docsError);
      }
      setDocuments(docs || []);

      // Fetch completed jobs count
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("provider_id", user.id)
        .eq("status", "completed");

      setCompletedJobs(jobs?.length || 0);

      // Fetch provider_details for verification status and notes
      const { data: details } = await supabase
        .from("provider_details")
        .select("verification_status, admin_notes")
        .eq("user_id", user.id)
        .maybeSingle();

      if (details) {
        setVerificationDetails({
          status: details.verification_status || 'pending',
          admin_notes: details.admin_notes
        });
      }
    } catch (error) {
      console.error("Error fetching verification data:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Find matching documents for a requirement.
   * Returns all docs whose doc_type matches any of the requirement's matchTypes.
   */
  const getMatchingDocs = (matchTypes: string[]) => {
    return documents.filter((doc) => matchTypes.includes(doc.doc_type));
  };

  /**
   * Get the best status for a requirement from its matching documents.
   * Priority: verified/approved > pending > rejected > missing
   */
  const getRequirementStatus = (matchTypes: string[]): 'verified' | 'pending' | 'rejected' | 'missing' => {
    const docs = getMatchingDocs(matchTypes);
    if (docs.length === 0) return 'missing';

    const statuses = docs.map(d => d.verification_status);
    if (statuses.some(s => s === 'verified' || s === 'approved')) return 'verified';
    if (statuses.some(s => s === 'pending')) return 'pending';
    if (statuses.some(s => s === 'rejected')) return 'rejected';
    return 'pending'; // fallback for unknown status
  };

  const handleViewDocument = async (doc: any) => {
    if (!doc.file_url) {
      toast.error("No se encontró el archivo del documento.");
      return;
    }

    // file_url might be a signed URL (full https URL) or a storage path
    if (doc.file_url.startsWith('http')) {
      // Already a full URL (signed URL stored at upload time)
      window.open(doc.file_url, "_blank");
    } else {
      // Storage path — generate a fresh signed URL
      const { data, error } = await supabase.storage
        .from("user-documents")
        .createSignedUrl(doc.file_url, 3600);
      if (error || !data?.signedUrl) {
        toast.error("No se pudo acceder al archivo.");
        return;
      }
      window.open(data.signedUrl, "_blank");
    }
  };

  const handleDownloadDocument = async (doc: any) => {
    if (!doc.file_url) {
      toast.error("No se encontró el archivo del documento.");
      return;
    }
    try {
      if (doc.file_url.startsWith('http')) {
        // For signed URLs, open in new tab (browser will handle download)
        window.open(doc.file_url, "_blank");
        return;
      }
      const { data, error } = await supabase.storage
        .from("user-documents")
        .download(doc.file_url);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${DOCUMENT_LABELS[doc.doc_type] || doc.doc_type}.${doc.file_url.split('.').pop() || 'jpg'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      toast.error("Error al descargar el archivo.");
    }
  };

  const calculateProgress = () => {
    if (isVerified) return 100;
    let progress = 0;
    for (const req of DOC_REQUIREMENT_MAP) {
      const status = getRequirementStatus(req.matchTypes);
      if (status === 'verified') progress += 25;
      else if (status === 'pending') progress += 15; // partial credit for pending
    }
    if (completedJobs >= 5) progress += 25;
    return Math.min(progress, 100);
  };

  const handleUploadClick = (docType: string, title: string, description: string) => {
    setUploadDialog({ open: true, docType, title, description });
  };

  const progress = calculateProgress();

  const renderStatusIcon = (status: 'verified' | 'pending' | 'rejected' | 'missing') => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'pending': return <Clock className="h-6 w-6 text-amber-500" />;
      case 'rejected': return <XCircle className="h-6 w-6 text-destructive" />;
      default: return <Circle className="h-6 w-6 text-muted-foreground" />;
    }
  };

  const renderStatusBadge = (status: 'verified' | 'pending' | 'rejected' | 'missing') => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-500/10 text-green-700 border-green-200">Aprobado</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200">En Revisión</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rechazado</Badge>;
      default:
        return <Badge variant="outline" className="text-muted-foreground">Pendiente</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-4xl">
      {/* Header with Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/provider-portal')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-foreground">Verificación</h1>
          <p className="text-muted-foreground text-sm">
            Completa tu proceso de verificación para desbloquear beneficios
          </p>
        </div>
      </div>

      {/* Status Banner */}
      {verificationDetails.status === 'rejected' && verificationDetails.admin_notes && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-destructive text-base">
              <XCircle className="h-5 w-5" />
              Verificación Rechazada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive/80">
              <strong>Razón:</strong> {verificationDetails.admin_notes}
            </p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => navigate('/provider/onboarding')}
            >
              Actualizar Documentos
            </Button>
          </CardContent>
        </Card>
      )}

      {verificationDetails.status === 'pending' && documents.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400 text-base">
              <Clock className="h-5 w-5" />
              Verificación en Revisión
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Tu perfil está siendo revisado por el equipo de Chamby. Te notificaremos cuando tengamos una respuesta.
            </p>
          </CardContent>
        </Card>
      )}

      {isVerified && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
              <CheckCircle className="h-5 w-5" />
              ¡Proveedor Verificado!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Has completado exitosamente el proceso de verificación.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Uploaded Documents Detail — show all docs with view/download/re-upload */}
      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Mis Documentos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium block">
                        {DOCUMENT_LABELS[doc.doc_type] || doc.doc_type}
                      </span>
                      {doc.uploaded_at && (
                        <span className="text-xs text-muted-foreground">
                          Subido: {new Date(doc.uploaded_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={doc.verification_status === 'verified' || doc.verification_status === 'approved' ? 'default' :
                               doc.verification_status === 'rejected' ? 'destructive' : 'secondary'}
                    >
                      {doc.verification_status === 'verified' || doc.verification_status === 'approved' ? 'Verificado' :
                       doc.verification_status === 'rejected' ? 'Rechazado' : 'En Revisión'}
                    </Badge>
                    {doc.file_url && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleViewDocument(doc)}
                          title="Ver documento"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => handleDownloadDocument(doc)}
                          title="Descargar documento"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {!doc.file_url && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        Archivo no disponible
                      </span>
                    )}
                    {doc.verification_status === 'rejected' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-xs"
                        onClick={() => handleUploadClick(
                          doc.doc_type,
                          DOCUMENT_LABELS[doc.doc_type] || doc.doc_type,
                          "Vuelve a subir este documento"
                        )}
                      >
                        <RefreshCw className="h-3 w-3 mr-1" />
                        Re-subir
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification Requirements Checklist */}
      <Card>
        <CardHeader>
          <CardTitle>Progreso de Verificación</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Completado</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>

          <div className="space-y-4 mt-6">
            {/* Document requirements */}
            {DOC_REQUIREMENT_MAP.map((req) => {
              const status = getRequirementStatus(req.matchTypes);
              const matchingDocs = getMatchingDocs(req.matchTypes);

              return (
                <div key={req.key} className="flex items-start gap-4 p-4 border rounded-lg">
                  <div className="mt-1">
                    {renderStatusIcon(status)}
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-medium">{req.label}</h3>
                    <p className="text-sm text-muted-foreground">{req.description}</p>
                    {renderStatusBadge(status)}
                    {status === 'rejected' && matchingDocs.length > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        {matchingDocs.find(d => d.rejection_reason)?.rejection_reason || 'Revisa y vuelve a subir este documento'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* View button for docs that exist */}
                    {matchingDocs.length > 0 && matchingDocs[0].file_url && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDocument(matchingDocs[0])}
                        title="Ver documento"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {/* Upload / Re-upload button */}
                    {(status === 'missing' || status === 'rejected') && !isVerified && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUploadClick(req.uploadDocType, req.label, req.description)}
                      >
                        {status === 'rejected' ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Re-subir
                          </>
                        ) : (
                          <>
                            <Upload className="h-4 w-4 mr-1" />
                            Subir
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Interview step (admin controlled) */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="mt-1">
                {isVerified ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium">Completar entrevista presencial</h3>
                <p className="text-sm text-muted-foreground">
                  Contacta al equipo de Chamby para agendar tu entrevista
                </p>
                <p className="text-sm text-muted-foreground">
                  Email: armando@chamby.mx | Tel: 223 543 8136
                </p>
              </div>
            </div>

            {/* Completed jobs */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="mt-1">
                {completedJobs >= 5 ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium">
                  Completar 5 trabajos con calificación positiva
                </h3>
                <p className="text-sm text-muted-foreground">
                  Demuestra tu calidad de servicio ({completedJobs}/5 completados)
                </p>
                {completedJobs >= 5 && (
                  <Badge className="bg-green-500/10 text-green-700">Completado</Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card>
        <CardHeader>
          <CardTitle>Ventajas de la Verificación</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Acceso a trabajos grandes (&gt; $4,000 MXN)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Prioridad en asignaciones de trabajos
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Pagos express (24-48 horas)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Badge de "Proveedor Verificado" visible para clientes
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              Mayor confianza y credibilidad
            </li>
          </ul>
        </CardContent>
      </Card>

      <DocumentUploadDialog
        open={uploadDialog.open}
        onOpenChange={(open) => setUploadDialog({ ...uploadDialog, open })}
        docType={uploadDialog.docType}
        title={uploadDialog.title}
        description={uploadDialog.description}
        onUploadComplete={fetchVerificationData}
      />
    </div>
  );
};

export default ProviderVerification;
