import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin } from "lucide-react";

const ProviderMap = () => {
  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mapa en Tiempo Real</h1>
        <p className="text-muted-foreground">
          Visualiza tus trabajos activos en el mapa
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Ubicación de Trabajos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <p className="text-muted-foreground">
              El mapa se integrará próximamente
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderMap;
