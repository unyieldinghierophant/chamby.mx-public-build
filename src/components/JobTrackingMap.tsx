import { MapPin, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";

interface JobTrackingMapProps {
  clientLat: number;
  clientLng: number;
  providerLat?: number | null;
  providerLng?: number | null;
  providerName?: string;
}

export const JobTrackingMap = ({
  clientLat,
  clientLng,
  providerLat,
  providerLng,
}: JobTrackingMapProps) => {
  const destination = `${clientLat},${clientLng}`;
  const origin = providerLat && providerLng ? `${providerLat},${providerLng}` : null;

  return (
    <div className="w-full rounded-lg border border-border bg-muted/30 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <MapPin className="w-4 h-4" />
        Ubicación del servicio
      </div>
      <p className="text-xs text-muted-foreground">
        {clientLat.toFixed(4)}, {clientLng.toFixed(4)}
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            window.open(
              origin
                ? `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`
                : `https://www.google.com/maps/dir/?api=1&destination=${destination}`,
              "_blank"
            )
          }
        >
          <Navigation className="w-3.5 h-3.5" />
          Iniciar ruta
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={() =>
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${destination}`,
              "_blank"
            )
          }
        >
          <MapPin className="w-3.5 h-3.5" />
          Abrir en Maps
        </Button>
      </div>
    </div>
  );
};
