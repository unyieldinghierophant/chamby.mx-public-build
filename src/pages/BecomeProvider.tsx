import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsProvider } from "@/hooks/useIsProvider";

const benefits = [
  "Trabaja cuando quieras y establece tus propios horarios",
  "Gana dinero extra ofreciendo tus servicios",
  "Accede a miles de clientes potenciales",
  "Recibe pagos seguros directamente en tu cuenta",
  "Construye tu reputación con reseñas de clientes",
  "Soporte 24/7 del equipo de Chamby",
];

const BecomeProvider = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isProvider } = useIsProvider();

  // If already a provider, redirect to portal
  if (isProvider) {
    setTimeout(() => navigate("/provider-portal", { replace: true }), 0);
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Conviértete en Chambynauta
            </h1>
            <p className="text-xl text-muted-foreground">
              Únete a nuestra comunidad de proveedores de servicios profesionales
            </p>
          </div>

          {/* Benefits */}
          <Card>
            <CardHeader>
              <CardTitle>¿Por qué ser un Chambynauta?</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <span className="text-lg">{benefit}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <CardTitle>Requisitos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start gap-3">
                  <span className="text-primary">•</span>
                  <span>Ser mayor de 18 años</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">•</span>
                  <span>Contar con INE o identificación oficial</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">•</span>
                  <span>Tener experiencia en servicios profesionales</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">•</span>
                  <span>Carta de antecedentes no penales</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary">•</span>
                  <span>Contar con herramientas propias (según el servicio)</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* CTA */}
          <div className="text-center space-y-4">
            <Button 
              size="lg" 
              className="gap-2"
              onClick={() => {
                // Set context so callback knows this is provider signup
                sessionStorage.setItem('login_context', 'provider');
                navigate("/auth/provider?tab=signup");
              }}
            >
              Comenzar Registro
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="text-sm text-muted-foreground">
              ¿Ya eres proveedor? <button onClick={() => {
                sessionStorage.setItem('login_context', 'provider');
                navigate("/auth/provider?tab=login");
              }} className="text-primary hover:underline">Inicia sesión aquí</button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BecomeProvider;
