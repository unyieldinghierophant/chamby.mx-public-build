import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MapPin, Minus, Plus, Navigation, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Guadalajara default center
const DEFAULT_CENTER: [number, number] = [20.6597, -103.3496];
const MIN_RADIUS = 1000; // 1km minimum
const MAX_RADIUS = 30000; // 30km maximum
const DEFAULT_RADIUS = 5000; // 5km default

interface WorkZonePickerProps {
  onZoneChange: (lat: number, lng: number, radiusKm: number, zoneName: string) => void;
  initialLat?: number;
  initialLng?: number;
  initialRadius?: number;
}

// Lazy load the entire map component
const WorkZoneMap = lazy(() => import('@/components/WorkZoneMap'));

// Loading fallback for the map
const MapLoadingFallback = () => (
  <div className="h-[300px] w-full bg-muted rounded-xl flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

export function WorkZonePicker({ 
  onZoneChange, 
  initialLat, 
  initialLng, 
  initialRadius 
}: WorkZonePickerProps) {
  const [center, setCenter] = useState<[number, number]>(
    initialLat && initialLng ? [initialLat, initialLng] : DEFAULT_CENTER
  );
  const [radius, setRadius] = useState(initialRadius || DEFAULT_RADIUS);
  const [zoneName, setZoneName] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  
  // Use ref to store callback to avoid dependency issues and infinite re-renders
  const onZoneChangeRef = useRef(onZoneChange);
  useEffect(() => {
    onZoneChangeRef.current = onZoneChange;
  }, [onZoneChange]);

  // Reverse geocode to get zone name
  useEffect(() => {
    const fetchZoneName = async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${center[0]}&lon=${center[1]}&zoom=10`
        );
        const data = await response.json();
        const city = data.address?.city || data.address?.town || data.address?.municipality || data.address?.state || '';
        setZoneName(city);
      } catch (error) {
        console.error('Error fetching zone name:', error);
        setZoneName('');
      }
    };
    
    fetchZoneName();
  }, [center]);

  // Notify parent of changes - debounced to prevent too many calls
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onZoneChangeRef.current(center[0], center[1], radius / 1000, zoneName);
    }, 300);
    
    return () => clearTimeout(timeoutId);
  }, [center, radius, zoneName]);

  const handlePositionChange = useCallback((lat: number, lng: number) => {
    setCenter([lat, lng]);
  }, []);

  const handleRadiusChange = useCallback((value: number[]) => {
    setRadius(value[0]);
  }, []);

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCenter: [number, number] = [position.coords.latitude, position.coords.longitude];
        setCenter(newCenter);
        toast.success('📍 Ubicación detectada');
        setIsLocating(false);
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error('Permiso de ubicación denegado');
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error('No se pudo determinar tu ubicación');
            break;
          default:
            toast.error('Error al obtener ubicación');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const radiusKm = (radius / 1000).toFixed(1);

  return (
    <div className="space-y-4">
      {/* Location Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className="flex-1"
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4 mr-2" />
          )}
          {isLocating ? 'Detectando...' : 'Usar mi ubicación'}
        </Button>
      </div>

      {/* Map */}
      <div className="relative rounded-xl overflow-hidden border border-border shadow-soft">
        <Suspense fallback={<MapLoadingFallback />}>
          <WorkZoneMap 
            center={center} 
            radius={radius} 
            onPositionChange={handlePositionChange} 
          />
        </Suspense>

        {/* Center Pin Overlay */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[1000] pointer-events-none">
          <div className="relative">
            <MapPin className="w-8 h-8 text-primary fill-primary drop-shadow-lg" />
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-primary rounded-full shadow-lg" />
          </div>
        </div>

        {/* Tap instruction */}
        <div className="absolute bottom-2 left-2 right-2 z-[1000]">
          <div className="bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 text-center">
            <p className="text-xs text-muted-foreground">
              Toca el mapa para mover tu zona de trabajo
            </p>
          </div>
        </div>
      </div>

      {/* Radius Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Radio de cobertura</Label>
          <span className="text-sm font-semibold text-primary">{radiusKm} km</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setRadius(Math.max(MIN_RADIUS, radius - 1000))}
          >
            <Minus className="w-4 h-4" />
          </Button>
          
          <Slider
            value={[radius]}
            onValueChange={handleRadiusChange}
            min={MIN_RADIUS}
            max={MAX_RADIUS}
            step={500}
            className="flex-1"
          />
          
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => setRadius(Math.min(MAX_RADIUS, radius + 1000))}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>1 km</span>
          <span>30 km</span>
        </div>
      </div>

      {/* Zone Info */}
      {zoneName && (
        <div className="bg-accent/30 rounded-lg p-3 border border-accent">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <p className="text-sm">
              <span className="text-muted-foreground">Zona centrada en:</span>{' '}
              <span className="font-medium text-foreground">{zoneName}</span>
            </p>
          </div>
        </div>
      )}

      {/* Tip */}
      <div className="bg-accent/20 rounded-lg p-3 border border-accent">
        <p className="text-xs text-muted-foreground">
          💡 <strong>Consejo:</strong> Mientras más amplia sea tu zona de cobertura, más oportunidades tendrás de recibir solicitudes de trabajo.
        </p>
      </div>
    </div>
  );
}
