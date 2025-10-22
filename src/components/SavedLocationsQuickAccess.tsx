import { useSavedLocations } from "@/hooks/useSavedLocations";
import { Button } from "@/components/ui/button";
import { MapPin, Plus, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

interface SavedLocationsQuickAccessProps {
  onLocationSelect?: (location: { label: string; address: string; id: string }) => void;
}

export const SavedLocationsQuickAccess = ({ onLocationSelect }: SavedLocationsQuickAccessProps) => {
  const { locations, loading } = useSavedLocations();
  const navigate = useNavigate();
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  if (loading) {
    return null;
  }

  const handleLocationClick = (location: any) => {
    setSelectedLocationId(location.id);
    if (onLocationSelect) {
      onLocationSelect({
        label: location.label,
        address: location.address,
        id: location.id
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 mb-6">
      {locations.length > 0 ? (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>Tus ubicaciones:</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {locations.map((location) => (
              <Button
                key={location.id}
                variant={selectedLocationId === location.id ? "default" : "outline"}
                size="sm"
                onClick={() => handleLocationClick(location)}
                className="gap-2"
              >
                {location.is_default && <Star className="w-3 h-3 fill-current" />}
                <span className="font-medium">{location.label}</span>
                <span className="text-xs opacity-70 hidden sm:inline">
                  · {location.address.length > 30 
                    ? location.address.substring(0, 30) + '...' 
                    : location.address}
                </span>
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/profile/locations")}
              className="gap-1"
            >
              <Plus className="w-3 h-3" />
              <span className="text-xs">Agregar</span>
            </Button>
          </div>
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/profile/locations")}
          className="gap-2"
        >
          <MapPin className="w-4 h-4" />
          <span>Guardar ubicaciones frecuentes</span>
        </Button>
      )}
    </div>
  );
};
