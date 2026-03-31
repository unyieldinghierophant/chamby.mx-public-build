import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MapPin, Navigation, Loader2, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const GDL_CENTER = { lat: 20.6597, lng: -103.3496 };
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

interface LocationStepProps {
  address: string;
  latitude: number | null;
  longitude: number | null;
  addressNotes: string;
  onAddressChange: (address: string) => void;
  onCoordsChange: (lat: number, lng: number) => void;
  onAddressNotesChange: (notes: string) => void;
}

// Ensure Google Maps script is loaded once
let googleMapsPromise: Promise<void> | null = null;
function loadGoogleMaps(): Promise<void> {
  if (window.google?.maps?.places) return Promise.resolve();
  if (googleMapsPromise) return googleMapsPromise;
  googleMapsPromise = new Promise((resolve, reject) => {
    // Check if already loaded
    if (window.google?.maps?.places) { resolve(); return; }
    const existing = document.querySelector(`script[src*="maps.googleapis.com"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve());
      return;
    }
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=places,geocoding`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(script);
  });
  return googleMapsPromise;
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
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);

  const [isLocating, setIsLocating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ---- Initialize Google Map ----
  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps().then(() => {
      if (cancelled || !mapContainerRef.current || mapRef.current) return;

      const initCenter = latitude && longitude
        ? { lat: latitude, lng: longitude }
        : GDL_CENTER;

      const map = new google.maps.Map(mapContainerRef.current, {
        center: initCenter,
        zoom: latitude ? 16 : 13,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_BOTTOM },
        gestureHandling: "greedy",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { featureType: "poi", stylers: [{ visibility: "off" }] },
          { featureType: "transit", stylers: [{ visibility: "off" }] },
        ],
      });

      // Track drag state for pin animation
      map.addListener("dragstart", () => setIsDragging(true));
      map.addListener("dragend", () => setIsDragging(false));

      // Reverse geocode on idle (after drag/zoom settles)
      map.addListener("idle", () => {
        const center = map.getCenter();
        if (!center) return;
        const lat = center.lat();
        const lng = center.lng();
        onCoordsChange(lat, lng);
        reverseGeocodeDebounced(lat, lng);
      });

      mapRef.current = map;
      geocoderRef.current = new google.maps.Geocoder();
      autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
      setMapReady(true);
    }).catch(() => {
      toast.error("Error al cargar el mapa");
    });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- Reverse geocode (debounced) ----
  const reverseGeocodeDebounced = useCallback((lat: number, lng: number) => {
    if (geocodeDebounceRef.current) clearTimeout(geocodeDebounceRef.current);
    setIsGeocoding(true);

    geocodeDebounceRef.current = setTimeout(() => {
      if (!geocoderRef.current) { setIsGeocoding(false); return; }
      geocoderRef.current.geocode(
        { location: { lat, lng } },
        (results, status) => {
          setIsGeocoding(false);
          if (status === "OK" && results && results[0]) {
            const formatted = results[0].formatted_address;
            onAddressChange(formatted);
          }
        }
      );
    }, 400);
  }, [onAddressChange]);

  // ---- Places Autocomplete search ----
  const handleSearchInput = (value: string) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 2) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    debounceRef.current = setTimeout(() => {
      if (!autocompleteServiceRef.current) return;
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          componentRestrictions: { country: "mx" },
          types: ["address", "establishment", "geocode"],
        },
        (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            setPredictions(results);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    }, 250);
  };

  const selectPrediction = (prediction: google.maps.places.AutocompletePrediction) => {
    setShowPredictions(false);
    setPredictions([]);
    setSearchQuery("");

    if (!geocoderRef.current || !mapRef.current) return;

    geocoderRef.current.geocode({ placeId: prediction.place_id }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        const loc = results[0].geometry.location;
        onAddressChange(results[0].formatted_address);
        onCoordsChange(loc.lat(), loc.lng());
        mapRef.current?.panTo(loc);
        mapRef.current?.setZoom(16);
      }
    });
  };

  const clearSearch = () => {
    setSearchQuery("");
    setPredictions([]);
    setShowPredictions(false);
    searchInputRef.current?.focus();
  };

  // ---- Use my location ----
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        // Move map immediately — don't wait for geocoding
        if (mapRef.current) {
          mapRef.current.panTo({ lat, lng });
          mapRef.current.setZoom(16);
        }
        onCoordsChange(lat, lng);
        toast.success("📍 Ubicación detectada");
        setIsLocating(false);
        // Geocoding happens automatically via the map's idle listener
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          toast.error("Permiso de ubicación denegado");
        } else {
          toast.error("No pudimos obtener tu ubicación");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ---- Close predictions on outside click ----
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowPredictions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="space-y-3">
      <div>
        <h1 className="text-2xl md:text-3xl font-jakarta font-medium text-foreground">
          Ubicación del servicio
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Mueve el mapa o busca tu dirección abajo
        </p>
      </div>

      {/* Map with fixed center pin — TOP */}
      <div className="relative rounded-2xl overflow-hidden border border-border/60 shadow-md ring-1 ring-border/20">
        <div
          ref={mapContainerRef}
          className="w-full h-[240px] md:h-[300px]"
          style={{ zIndex: 0 }}
        />

        {/* Fixed center pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-[10] pointer-events-none">
          <div
            className={cn(
              "transition-transform duration-200",
              isDragging ? "-translate-y-3 scale-110" : "translate-y-0 scale-100"
            )}
          >
            <svg width="36" height="48" viewBox="0 0 36 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 30 18 30s18-16.5 18-30C36 8.06 27.94 0 18 0z"
                className="fill-primary"
              />
              <circle cx="18" cy="18" r="7" fill="white" />
            </svg>
          </div>
          <div
            className={cn(
              "mx-auto rounded-full bg-foreground/20 transition-all duration-200",
              isDragging ? "w-6 h-1.5 opacity-30 mt-2" : "w-4 h-1 opacity-50 mt-0"
            )}
          />
        </div>

        {/* GPS button overlaid on map */}
        <button
          type="button"
          onClick={handleUseMyLocation}
          disabled={isLocating}
          className={cn(
            "absolute bottom-3 right-3 z-[10] flex items-center gap-2 px-3 py-2 rounded-lg bg-background/95 backdrop-blur-sm border border-border shadow-md text-sm font-medium text-primary transition-colors",
            isLocating ? "opacity-70 cursor-not-allowed" : "hover:bg-background"
          )}
        >
          {isLocating ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Navigation className="w-4 h-4" />
          )}
          {isLocating ? "Detectando…" : "Mi ubicación"}
        </button>

        {/* Loading overlay */}
        {!mapReady && (
          <div className="absolute inset-0 bg-muted flex items-center justify-center z-[5]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      {/* Address search + display — BELOW map */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm space-y-3">
        {/* Current address display */}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <MapPin className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
              Dirección seleccionada
            </p>
            {isGeocoding ? (
              <div className="flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Obteniendo dirección…</span>
              </div>
            ) : address ? (
              <p className="text-sm font-medium text-foreground leading-snug">{address}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Mueve el mapa para seleccionar una ubicación
              </p>
            )}
          </div>
        </div>

        {/* Search input to correct address */}
        <div className="relative z-[60]" ref={searchContainerRef}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => handleSearchInput(e.target.value)}
              onFocus={() => predictions.length > 0 && setShowPredictions(true)}
              placeholder="¿Dirección incorrecta? Búscala aquí…"
              className="h-11 text-sm pl-9 pr-9 rounded-lg border-border bg-background"
              style={{ fontSize: "16px" }}
              maxLength={300}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>

          {/* Predictions dropdown */}
          {showPredictions && predictions.length > 0 && (
            <div className="absolute z-[1000] w-full mt-1 bg-background border border-border rounded-xl shadow-lg max-h-56 overflow-y-auto">
              {predictions.map((p) => (
                <button
                  key={p.place_id}
                  type="button"
                  onClick={() => selectPrediction(p)}
                  className="w-full px-4 py-3 text-left text-sm hover:bg-muted/50 transition-colors flex items-start gap-3 border-b border-border/50 last:border-b-0"
                >
                  <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div>
                    <span className="font-medium text-foreground">
                      {p.structured_formatting.main_text}
                    </span>
                    <span className="block text-xs text-muted-foreground">
                      {p.structured_formatting.secondary_text}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Access notes */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-muted-foreground">
            Notas de acceso (opcional)
          </Label>
          <Input
            value={addressNotes}
            onChange={(e) => onAddressNotesChange(e.target.value)}
            placeholder="Ej: Puerta azul, timbre 3, portería…"
            className="h-11"
            maxLength={200}
          />
        </div>
      </div>
    </div>
  );
}
