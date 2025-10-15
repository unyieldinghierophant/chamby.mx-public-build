import { useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin } from 'lucide-react';

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: 19.4326,
  lng: -99.1332
};

interface GoogleMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLocation?: string;
}

export const GoogleMapPicker = ({ onLocationSelect, initialLocation }: GoogleMapPickerProps) => {
  const [center, setCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [address, setAddress] = useState(initialLocation || '');
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Your Google Maps API key should be stored in environment variables
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setAddress(formattedAddress);
          onLocationSelect(lat, lng, formattedAddress);
        }
      });
    }
  }, [onLocationSelect]);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newCenter = { lat, lng };
        
        setCenter(newCenter);
        setMarkerPosition(newCenter);
        setAddress(place.formatted_address || '');
        onLocationSelect(lat, lng, place.formatted_address || '');
      }
    }
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="p-8 text-center border border-destructive rounded-lg bg-destructive/10">
        <p className="text-destructive font-semibold">
          Google Maps API key no configurado
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Por favor configura VITE_GOOGLE_MAPS_API_KEY en las variables de entorno
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-foreground">
            Ubicación del trabajo
          </Label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                componentRestrictions: { country: 'mx' },
                fields: ['formatted_address', 'geometry', 'name']
              }}
            >
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ingresa dirección o colonia"
                className="h-14 text-base pl-12"
              />
            </Autocomplete>
          </div>
          <p className="text-sm text-muted-foreground">
            Escribe una dirección o haz clic en el mapa para seleccionar
          </p>
        </div>

        <div className="rounded-lg overflow-hidden border border-border">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={13}
            onClick={onMapClick}
            options={{
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
            }}
          >
            <Marker position={markerPosition} />
          </GoogleMap>
        </div>
      </LoadScript>
    </div>
  );
};
