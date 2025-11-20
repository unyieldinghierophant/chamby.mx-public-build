import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Upload, UserCheck, Award } from "lucide-react";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { DocumentUploadDialog } from "@/components/provider-portal/DocumentUploadDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const verificationSteps = [
  {
    id: 1,
    title: "Subir foto de rostro",
    description: "Una foto clara de tu rostro para identificación",
    icon: Upload,
  },
  {
    id: 2,
    title: "Subir INE y carta de antecedentes",
    description: "Documentos oficiales para verificación de identidad",
    icon: Upload,
  },
  {
    id: 3,
    title: "Completar entrevista presencial",
    description: "Una breve entrevista con nuestro equipo",
    icon: UserCheck,
  },
  {
    id: 4,
    title: "Completar 5 trabajos con calificación positiva",
    description: "Demuestra tu calidad de servicio",
    icon: Award,
  },
];

const ProviderVerification = () => {
  const { user } = useAuth();
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

  const isVerified = providerProfile?.verification_status === "verified";

  useEffect(() => {
    if (user) {
      fetchVerificationData();
    }
  }, [user]);

  const fetchVerificationData = async () => {
    if (!user) return;

    try {
      // Fetch documents using user.id
      const { data: docs } = await supabase
        .from("documents")
        .select("*")
        .eq("client_id", user.id);

      setDocuments(docs || []);

      // Fetch completed jobs count
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id", { count: "exact" })
        .eq("provider_id", user.id)
        .eq("status", "completed");

      setCompletedJobs(jobs?.length || 0);
    } catch (error) {
      console.error("Error fetching verification data:", error);
    } finally {
      setLoading(false);
    }
  };

  const hasDocument = (docType: string) => {
    return documents.some((doc) => doc.doc_type === docType);
  };

  const calculateProgress = () => {
    if (isVerified) return 100;
    let progress = 0;
    if (hasDocument("face_photo")) progress += 25;
    if (hasDocument("id_card")) progress += 25;
    if (hasDocument("criminal_record")) progress += 25;
    if (completedJobs >= 5) progress += 25;
    return progress;
  };

  const progress = calculateProgress();

  const handleUploadClick = (docType: string, title: string, description: string) => {
    setUploadDialog({ open: true, docType, title, description });
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Verificación</h1>
        <p className="text-muted-foreground">
          Completa tu proceso de verificación para desbloquear beneficios
        </p>
      </div>

      {isVerified && (
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
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
            {/* Step 1: Face Photo */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="mt-1">
                {hasDocument("face_photo") ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium">Subir foto de rostro</h3>
                <p className="text-sm text-muted-foreground">
                  Una foto clara de tu rostro para identificación
                </p>
                {hasDocument("face_photo") && (
                  <Badge className="bg-green-500/10 text-green-700">
                    Completado
                  </Badge>
                )}
              </div>
              {!hasDocument("face_photo") && !isVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleUploadClick(
                      "face_photo",
                      "Foto de Rostro",
                      "Sube una foto clara de tu rostro"
                    )
                  }
                >
                  Subir
                </Button>
              )}
            </div>

            {/* Step 2: ID Card */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="mt-1">
                {hasDocument("id_card") ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium">Subir INE</h3>
                <p className="text-sm text-muted-foreground">
                  Identificación oficial para verificación
                </p>
                {hasDocument("id_card") && (
                  <Badge className="bg-green-500/10 text-green-700">
                    Completado
                  </Badge>
                )}
              </div>
              {!hasDocument("id_card") && !isVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleUploadClick(
                      "id_card",
                      "INE/IFE",
                      "Sube tu identificación oficial por ambos lados"
                    )
                  }
                >
                  Subir
                </Button>
              )}
            </div>

            {/* Step 3: Criminal Record */}
            <div className="flex items-start gap-4 p-4 border rounded-lg">
              <div className="mt-1">
                {hasDocument("criminal_record") ? (
                  <CheckCircle className="h-6 w-6 text-green-600" />
                ) : (
                  <Circle className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 space-y-1">
                <h3 className="font-medium">Carta de antecedentes no penales</h3>
                <p className="text-sm text-muted-foreground">
                  Documento de antecedentes no penales actualizado
                </p>
                {hasDocument("criminal_record") && (
                  <Badge className="bg-green-500/10 text-green-700">
                    Completado
                  </Badge>
                )}
              </div>
              {!hasDocument("criminal_record") && !isVerified && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    handleUploadClick(
                      "criminal_record",
                      "Antecedentes No Penales",
                      "Sube tu carta de antecedentes no penales"
                    )
                  }
                >
                  Subir
                </Button>
              )}
            </div>

            {/* Step 4: Interview (Admin controlled) */}
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

            {/* Step 5: Complete 5 jobs */}
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
