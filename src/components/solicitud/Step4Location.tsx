import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Step4LocationProps {
  location: string;
  onLocationChange: (location: string) => void;
}

const Step4Location = ({
  location,
  onLocationChange,
}: Step4LocationProps) => {
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Tu navegador no soporta geolocalización");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Use reverse geocoding to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
          );
          const data = await response.json();
          onLocationChange(data.display_name);
        } catch (error) {
          console.error("Error getting address:", error);
          onLocationChange(`${latitude}, ${longitude}`);
        } finally {
          setIsLoadingLocation(false);
        }
      },
      (error) => {
        console.error("Error getting location:", error);
        alert("No se pudo obtener tu ubicación");
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold mb-2">¿Dónde se realizará el servicio?</h3>
        <p className="text-muted-foreground text-sm">
          Ingresa la dirección donde necesitas el servicio
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="location">Dirección completa</Label>
          <div className="relative mt-2">
            <MapPin className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
            <Input
              id="location"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              placeholder="Calle, número, colonia, código postal"
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="h-px bg-border flex-1" />
          <span className="text-xs text-muted-foreground">o</span>
          <div className="h-px bg-border flex-1" />
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="w-full"
        >
          <Navigation className="mr-2 h-4 w-4" />
          {isLoadingLocation ? "Obteniendo ubicación..." : "Usar mi ubicación actual"}
        </Button>
      </div>

      {location && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Dirección confirmada
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {location}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-xs text-amber-700 dark:text-amber-300">
          <strong>Nota:</strong> Asegúrate de incluir referencias o detalles adicionales que ayuden al profesional a encontrar la ubicación fácilmente.
        </p>
      </div>
    </div>
  );
};

export default Step4Location;
