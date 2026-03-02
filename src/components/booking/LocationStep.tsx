import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Navigation, Loader2, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default marker icon for Leaflet + bundlers
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const GDL_CENTER: [number, number] = [20.6597, -103.3496];
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const NOMINATIM_HEADERS = { "User-Agent": "Chamby.mx/1.0", Accept: "application/json" };

interface LocationStepProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  addressNotes: string;
  onAddressChange: (address: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
  onAddressNotesChange: (notes: string) => void;
}

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
}

export function LocationStep({
  address,
  latitude,
  longitude,
  addressNotes,
  onAddressChange,
  onCoordsChange,
  onAddressNotesChange,
}: LocationStepProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [showResults, setShowResults] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const initLat = latitude ?? GDL_CENTER[0];
    const initLng = longitude ?? GDL_CENTER[1];

    const map = L.map(mapContainerRef.current, {
      center: [initLat, initLng],
      zoom: latitude ? 16 : 13,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([initLat, initLng], { draggable: true }).addTo(map);

    marker.on("dragend", () => {
      const pos = marker.getLatLng();
      onCoordsChange(pos.lat, pos.lng);
      reverseGeocode(pos.lat, pos.lng);
    });

    mapRef.current = map;
    markerRef.current = marker;

    // Force recalc after mount (fixes grey tiles in hidden containers)
    setTimeout(() => map.invalidateSize(), 200);

    return () => {
      map.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync marker when coords change externally
  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !latitude || !longitude) return;
    const pos: L.LatLngExpression = [latitude, longitude];
    markerRef.current.setLatLng(pos);
    mapRef.current.flyTo(pos, 16, { duration: 0.8 });
  }, [latitude, longitude]);

  // Reverse geocode
  const reverseGeocode = useCallback(
    async (lat: number, lng: number) => {
      try {
        const res = await fetch(
          `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18`,
          { headers: NOMINATIM_HEADERS, signal: AbortSignal.timeout(5000) }
        );
        const data = await res.json();
        if (data.display_name) {
          onAddressChange(data.display_name);
        }
      } catch {
        /* keep coords only */
      }
    },
    [onAddressChange]
  );

  // Forward geocode search (debounced)
  const handleSearchInput = (value: string) => {
    onAddressChange(value);

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 4) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(value)}&countrycodes=mx&limit=5&viewbox=-103.5,20.8,-103.2,20.5&bounded=1`,
          { headers: NOMINATIM_HEADERS, signal: AbortSignal.timeout(5000) }
        );
        const data: NominatimResult[] = await res.json();
        setSearchResults(data);
        setShowResults(data.length > 0);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);
  };

  const selectResult = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    onAddressChange(result.display_name);
    onCoordsChange(lat, lng);
    setShowResults(false);
    setSearchResults([]);
  };

  // GPS handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    setIsLocating(true);

    const timeoutId = setTimeout(() => {
      setIsLocating(false);
      toast.error("No pudimos obtener tu ubicación. Inténtalo de nuevo.");
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        clearTimeout(timeoutId);
        const { latitude: lat, longitude: lng } = pos.coords;
        onCoordsChange(lat, lng);
        await reverseGeocode(lat, lng);
        toast.success("📍 Ubicación detectada");
        setIsLocating(false);
      },
      (err) => {
        clearTimeout(timeoutId);
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Permiso de ubicación denegado. Activa los permisos en tu navegador.");
        } else {
          toast.error("No pudimos obtener tu ubicación. Inténtalo de nuevo.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Close results on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl md:text-4xl font-jakarta font-medium text-foreground">
          Ubicación del servicio
        </h1>
        <p className="text-muted-foreground mt-2">
          ¿Dónde necesitas que vaya el proveedor?
        </p>
      </div>

      <div className="space-y-4">
        {/* GPS button */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className={cn(
            "w-full flex items-center justify-center gap-2 h-12 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-medium transition-colors",
            isLocating
              ? "opacity-70 cursor-not-allowed"
              : "hover:bg-primary/10"
          )}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {isLocating ? "Detectando ubicación…" : "Usar mi ubicación actual"}
        </button>

        {/* Address search with suggestions */}
        <div className="relative" ref={searchInputRef}>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              value={address}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => searchResults.length > 0 && setShowResults(true)}
              placeholder="Escribe la dirección completa"
              className="h-14 text-base pl-10 pr-10"
              maxLength={300}
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
            )}
          </div>

          {/* Search results dropdown */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute z-[1000] w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectResult(r)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors flex items-start gap-2 border-b border-border/50 last:border-b-0"
                >
                  <Search className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <span className="line-clamp-2">{r.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <p
          className={cn(
            "text-xs",
            address.length < 5 ? "text-muted-foreground" : "text-primary"
          )}
        >
          Mínimo 5 caracteres
        </p>

        {/* Leaflet map */}
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
          <div
            ref={mapContainerRef}
            className="w-full h-[250px] md:h-[300px]"
            style={{ zIndex: 0 }}
          />
        </div>
        <p className="text-xs text-muted-foreground text-center">
          Arrastra el pin para ajustar la ubicación exacta
        </p>

        {/* Access notes */}
        <div className="space-y-2">
          <Label className="text-sm font-medium text-foreground">
            Notas de acceso (opcional)
          </Label>
          <Input
            value={addressNotes}
            onChange={(e) => onAddressNotesChange(e.target.value)}
            placeholder="Ej: Puerta azul, timbre 3, dejar en portería…"
            className="h-12"
            maxLength={200}
          />
        </div>
      </div>
    </div>
  );
}
