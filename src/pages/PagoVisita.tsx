import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, Shield, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const PagoVisita = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-main py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>

        <div className="space-y-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">Pago de visita</h1>
            <p className="text-muted-foreground">
              Confirma tu solicitud con el pago de visita
            </p>
          </div>

          <Card className="bg-gradient-card border-0 shadow-raised">
            <CardContent className="p-6">
              <div className="text-center mb-6">
                <div className="text-4xl font-bold text-primary mb-2">$150 MXN</div>
                <p className="text-sm text-muted-foreground">Pago único de visita</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Pago seguro</p>
                    <p className="text-xs text-muted-foreground">
                      Tu pago está protegido con encriptación de nivel bancario
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Confirmación inmediata</p>
                    <p className="text-xs text-muted-foreground">
                      Recibe presupuestos de profesionales verificados en minutos
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <CreditCard className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Múltiples métodos de pago</p>
                    <p className="text-xs text-muted-foreground">
                      Acepta tarjetas de crédito, débito y transferencias
                    </p>
                  </div>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-button"
                size="lg"
                onClick={() => {
                  // TODO: Integrate with payment gateway (Stripe)
                  alert("Integración de pago próximamente");
                }}
              >
                <CreditCard className="mr-2 h-5 w-5" />
                Pagar y confirmar solicitud
              </Button>

              <p className="text-xs text-center text-muted-foreground mt-4">
                Al continuar, aceptas nuestros términos y condiciones
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-glass border-0">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-2">¿Qué incluye el pago de visita?</h3>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Publicación de tu solicitud a profesionales verificados</li>
                <li>• Hasta 5 presupuestos de diferentes profesionales</li>
                <li>• Protección de garantía Chamby</li>
                <li>• Soporte al cliente 24/7</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PagoVisita;
