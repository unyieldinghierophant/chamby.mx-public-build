import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Circle, Upload, UserCheck, Award } from "lucide-react";
import { useProfile } from "@/hooks/useProfile";

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
  const { profile } = useProfile();
  const isVerified = profile?.verification_status === "verified";
  const progress = isVerified ? 100 : 0;

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
            {verificationSteps.map((step) => (
              <div
                key={step.id}
                className="flex items-start gap-4 p-4 border rounded-lg"
              >
                <div className="mt-1">
                  {isVerified ? (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="font-medium">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {step.description}
                  </p>
                </div>
                {!isVerified && (
                  <Button variant="outline" size="sm">
                    Iniciar
                  </Button>
                )}
              </div>
            ))}
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
    </div>
  );
};

export default ProviderVerification;
