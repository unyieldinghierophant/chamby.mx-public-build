import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Upload, ArrowLeft, Clock, XCircle, Eye, RefreshCw, CalendarCheck, ExternalLink } from "lucide-react";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { DocumentUploadDialog } from "@/components/provider-portal/DocumentUploadDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface DocRequirement {
  key: string;
  rawTypes: string[];
  title: string;
  description: string;
  uploadDocType: string;
}

const DOC_REQUIREMENTS: DocRequirement[] = [
  {
    key: 'ine_front',
    rawTypes: ['ine_front', 'id_front', 'id_card', 'INE', 'ine'],
    title: 'INE Frente',
    description: 'Foto clara del frente de tu INE',
    uploadDocType: 'ine_front',
  },
  {
    key: 'ine_back',
    rawTypes: ['ine_back', 'id_back'],
    title: 'INE Reverso',
    description: 'Foto clara del reverso de tu INE',
    uploadDocType: 'ine_back',
  },
  {
    key: 'selfie',
    rawTypes: ['selfie', 'face_photo', 'face'],
    title: 'Selfie',
    description: 'Una foto clara de tu rostro para identificación',
    uploadDocType: 'selfie',
  },
  {
    key: 'selfie_with_id',
    rawTypes: ['selfie_with_id', 'selfie_with_ine'],
    title: 'Selfie con INE',
    description: 'Foto tuya sosteniendo tu INE junto a tu rostro',
    uploadDocType: 'selfie_with_id',
  },
  {
    key: 'proof_of_address',
    rawTypes: ['proof_of_address', 'comprobante_domicilio'],
    title: 'Comprobante de Domicilio',
    description: 'Recibo de luz, agua o estado de cuenta reciente',
    uploadDocType: 'proof_of_address',
  },
  {
    key: 'criminal_record',
    rawTypes: ['criminal_record', 'antecedentes_penales'],
    title: 'Antecedentes No Penales',
    description: 'Carta de antecedentes no penales vigente',
    uploadDocType: 'criminal_record',
  },
];

const ProviderVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile: providerProfile } = useProviderProfile(user?.id);
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
    interview_completed: boolean;
    interview_scheduled: boolean;
  }>({ status: 'pending', admin_notes: null, interview_completed: false, interview_scheduled: false });
  const [markingScheduled, setMarkingScheduled] = useState(false);
  const [markingCompleted, setMarkingCompleted] = useState(false);

  const isVerified = verificationDetails.status === 'verified';

  useEffect(() => {
    if (user) {
      fetchVerificationData();
    }
  }, [user]);

  const fetchVerificationData = async () => {
    if (!user) return;

    try {
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("provider_id", user.id);

      setDocuments(docs || []);

      const { data: jobs } = await supabase
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("provider_id", user.id)
        .eq("status", "completed");

      setCompletedJobs(jobs?.length || 0);

      const { data: details } = await supabase
        .from("provider_details")
        .select("verification_status, admin_notes, interview_completed, interview_scheduled")
        .eq("user_id", user.id)
        .maybeSingle();

      if (details) {
        setVerificationDetails({
          status: details.verification_status || 'pending',
          admin_notes: details.admin_notes,
          interview_completed: details.interview_completed ?? false,
          interview_scheduled: details.interview_scheduled ?? false,
        });
      }
    } catch (error) {
      console.error("Error fetching verification data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Find the best document for a requirement (most recent, preferring non-rejected)
  const getDocForRequirement = (req: DocRequirement) => {
    const matching = documents.filter(d => req.rawTypes.includes(d.doc_type));
    if (matching.length === 0) return null;
    // Prefer approved/verified > pending > rejected
    const sorted = [...matching].sort((a, b) => {
      const priority = (s: string) => {
        if (s === 'verified' || s === 'approved') return 0;
        if (s === 'pending') return 1;
        return 2; // rejected
      };
      return priority(a.verification_status) - priority(b.verification_status);
    });
    return sorted[0];
  };

  const getSignedUrl = useCallback(async (fileUrl: string): Promise<string | null> => {
    if (!fileUrl) return null;
    try {
      // If it's already a full URL (signed URL from old uploads), open directly
      if (fileUrl.startsWith('http')) {
        return fileUrl;
      }
      // Otherwise treat as storage path
      const { data, error } = await supabase.storage
        .from("user-documents")
        .createSignedUrl(fileUrl, 3600);
      if (error) throw error;
      return data.signedUrl;
    } catch (err) {
      console.error("Error creating signed URL:", err);
      return null;
    }
  }, []);

  const handleViewDocument = async (doc: any) => {
    if (!doc.file_url) {
      toast.error("No se encontró el archivo del documento.");
      return;
    }
    const url = await getSignedUrl(doc.file_url);
    if (url) {
      window.open(url, "_blank");
    } else {
      toast.error("No se pudo acceder al archivo. Es posible que haya expirado o no exista.");
    }
  };


  const calculateProgress = () => {
    if (isVerified) return 100;
    // 5 docs + interview = 6 items
    const totalItems = DOC_REQUIREMENTS.length + 1; // +1 for interview
    let completed = 0;
    for (const req of DOC_REQUIREMENTS) {
      const doc = getDocForRequirement(req);
      if (doc && (doc.verification_status === 'verified' || doc.verification_status === 'approved' || doc.verification_status === 'pending')) {
        completed++;
      }
    }
    // Interview counts as completed if admin confirmed, or half-credit if provider self-reported scheduled
    if (verificationDetails.interview_completed) completed++;
    else if (verificationDetails.interview_scheduled) completed += 0.5;
    return Math.round((completed / totalItems) * 100);
  };

  const progress = calculateProgress();

  const CALENDLY_URL = "https://calendly.com/hola-chamby/30min";

  const handleMarkScheduled = async () => {
    if (!user) return;
    setMarkingScheduled(true);
    try {
      const { error } = await supabase
        .from("provider_details")
        .update({ interview_scheduled: true })
        .eq("user_id", user.id);
      if (error) throw error;
      setVerificationDetails(prev => ({ ...prev, interview_scheduled: true }));
      toast.success("¡Entrevista marcada como agendada! El equipo de Chamby confirmará tu cita.");
    } catch (err) {
      toast.error("Error al actualizar. Intenta de nuevo.");
    } finally {
      setMarkingScheduled(false);
    }
  };

  const handleMarkCompleted = async () => {
    if (!user) return;
    setMarkingCompleted(true);
    try {
      const { error } = await supabase
        .from("provider_details")
        .update({ interview_completed: true })
        .eq("user_id", user.id);
      if (error) throw error;
      setVerificationDetails(prev => ({ ...prev, interview_completed: true }));
      toast.success("¡Entrevista marcada como completada!");
    } catch (err) {
      toast.error("Error al actualizar. Intenta de nuevo.");
    } finally {
      setMarkingCompleted(false);
    }
  };

  const handleUploadClick = (docType: string, title: string, description: string) => {
    setUploadDialog({ open: true, docType, title, description });
  };

  // Render a single requirement step with proper status
  const renderRequirementStep = (req: DocRequirement) => {
    const doc = getDocForRequirement(req);
    // If overall provider is verified, treat all docs as verified
    const status = isVerified ? 'verified' : (doc?.verification_status || null);

    let icon: React.ReactNode;
    let badge: React.ReactNode = null;
    let actions: React.ReactNode = null;

    if (status === 'verified' || status === 'approved') {
      icon = <CheckCircle className="h-6 w-6 text-green-600" />;
      badge = (
        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
          Documento verificado
        </Badge>
      );
      actions = doc?.file_url ? (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleViewDocument(doc)} title="Ver documento">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ) : null;
    } else if (status === 'pending') {
      icon = <Clock className="h-6 w-6 text-amber-500" />;
      badge = (
        <Badge variant="secondary" className="bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">
          En revisión
        </Badge>
      );
      actions = doc?.file_url ? (
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleViewDocument(doc)} title="Ver documento">
            <Eye className="h-4 w-4" />
          </Button>
        </div>
      ) : null;
    } else if (status === 'rejected') {
      icon = <XCircle className="h-6 w-6 text-destructive" />;
      badge = (
        <Badge variant="destructive">
          Rechazado
        </Badge>
      );
      if (doc?.rejection_reason) {
        badge = (
          <div className="space-y-1">
            <Badge variant="destructive">Rechazado</Badge>
            <p className="text-xs text-destructive/80">{doc.rejection_reason}</p>
          </div>
        );
      }
      actions = (
        <div className="flex items-center gap-1">
          {doc?.file_url && (
            <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => handleViewDocument(doc)} title="Ver documento">
              <Eye className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={() => handleUploadClick(req.uploadDocType, req.title, "Vuelve a subir este documento")}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Re-subir
          </Button>
        </div>
      );
    } else {
      // No document uploaded
      icon = <Circle className="h-6 w-6 text-muted-foreground" />;
      badge = (
        <Badge variant="outline" className="text-muted-foreground">
          Pendiente
        </Badge>
      );
      actions = !isVerified ? (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleUploadClick(req.uploadDocType, req.title, req.description)}
        >
          <Upload className="h-4 w-4 mr-1" />
          Subir
        </Button>
      ) : null;
    }

    return (
      <div key={req.key} className="flex items-start gap-4 p-4 border rounded-lg">
        <div className="mt-1">{icon}</div>
        <div className="flex-1 space-y-1 min-w-0">
          <h3 className="font-medium">{req.title}</h3>
          <p className="text-sm text-muted-foreground">{req.description}</p>
          {badge}
        </div>
        {actions}
      </div>
    );
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

      {/* Interview reminder banner — shown until interview is scheduled */}
      {!isVerified && !verificationDetails.interview_scheduled && !verificationDetails.interview_completed && (
        <Card className="border-blue-500/50 bg-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400 text-base">
              <CalendarCheck className="h-5 w-5" />
              Agenda tu entrevista con Chamby
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para completar tu verificación necesitas agendar una entrevista breve con nuestro equipo. Es rápida y te ayudamos a empezar.
            </p>
            <Button
              onClick={() => window.open(CALENDLY_URL, "_blank")}
              className="gap-2"
            >
              <CalendarCheck className="h-4 w-4" />
              Agendar Entrevista
              <ExternalLink className="h-3 w-3" />
            </Button>
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


      {/* Compact approved line when verified */}
      {isVerified && (
        <Card>
          <CardContent className="py-4 flex items-center gap-2 text-green-700 dark:text-green-400">
            <CheckCircle className="h-5 w-5" />
            <span className="text-sm font-medium">Todos los documentos aprobados</span>
          </CardContent>
        </Card>
      )}

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
            {/* Document requirement steps — driven by per-document status */}
            {DOC_REQUIREMENTS.map(renderRequirementStep)}

            {/* Step: Interview */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="mt-1">
                {isVerified || verificationDetails.interview_completed ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : verificationDetails.interview_scheduled ? (
                  <Clock className="h-6 w-6 text-blue-500" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <h3 className="font-medium">Entrevista con Chamby</h3>

                {isVerified || verificationDetails.interview_completed ? (
                  <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20">
                    Entrevista completada ✓
                  </Badge>
                ) : verificationDetails.interview_scheduled ? (
                  <div className="space-y-2">
                    <Badge className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20">
                      Entrevista agendada ✓
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      ¿Ya tuviste tu entrevista? Márcala como completada para avanzar tu verificación.
                    </p>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleMarkCompleted}
                      disabled={markingCompleted}
                      className="gap-2"
                    >
                      {markingCompleted ? (
                        <Clock className="h-4 w-4 animate-spin" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                      Marcar entrevista como completada
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Agenda una llamada breve con nuestro equipo para completar tu verificación.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        onClick={() => window.open(CALENDLY_URL, "_blank")}
                        className="gap-2"
                      >
                        <CalendarCheck className="h-4 w-4" />
                        Agendar Entrevista
                        <ExternalLink className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleMarkScheduled}
                        disabled={markingScheduled}
                        className="gap-2"
                      >
                        {markingScheduled ? (
                          <Clock className="h-4 w-4 animate-spin" />
                        ) : (
                          <CheckCircle className="h-4 w-4" />
                        )}
                        Marcar entrevista como agendada
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Una vez que agendes en Calendly, haz clic en "Marcar entrevista como agendada" para notificarnos.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Separate "Pro" tier section */}
      <Card className="border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏆 Conviértete en Proveedor Pro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Completa estos objetivos para desbloquear beneficios premium. No bloquean tu verificación básica.
          </p>
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
                <Badge className="bg-green-500/10 text-green-700">
                  Completado
                </Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
        onOpenChange={(open) =>
          setUploadDialog({ ...uploadDialog, open })
        }
        docType={uploadDialog.docType}
        title={uploadDialog.title}
        description={uploadDialog.description}
        onUploadComplete={fetchVerificationData}
      />
    </div>
  );
};

export default ProviderVerification;
