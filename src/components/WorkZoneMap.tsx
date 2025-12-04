import { useCallback, useRef, useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';

interface WorkZoneMapProps {
  center: [number, number];
  radius: number;
  onPositionChange: (lat: number, lng: number) => void;
}

const mapContainerStyle = {
  height: '300px',
  width: '100%',
};

const mapStyles = [
  { elementType: 'geometry', stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'administrative.land_parcel', elementType: 'labels.text.fill', stylers: [{ color: '#bdbdbd' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial', elementType: 'labels.text.fill', stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#dadada' }] },
  { featureType: 'road.highway', elementType: 'labels.text.fill', stylers: [{ color: '#616161' }] },
  { featureType: 'road.local', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'transit.line', elementType: 'geometry', stylers: [{ color: '#e5e5e5' }] },
  { featureType: 'transit.station', elementType: 'geometry', stylers: [{ color: '#eeeeee' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9c9c9' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#9e9e9e' }] },
];

export default function WorkZoneMap({ center, radius, onPositionChange }: WorkZoneMapProps) {
  const mapRef = useRef<google.maps.Map | null>(null);
  const circleRef = useRef<google.maps.Circle | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
  });

  // Create and update circle when map loads or center/radius changes
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    const circleCenter = { lat: center[0], lng: center[1] };

    // If circle doesn't exist, create it
    if (!circleRef.current) {
      circleRef.current = new google.maps.Circle({
        map: mapRef.current,
        center: circleCenter,
        radius: radius,
        strokeColor: '#8B5CF6',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#8B5CF6',
        fillOpacity: 0.25,
        clickable: false,
      });
    } else {
      // Update existing circle
      circleRef.current.setCenter(circleCenter);
      circleRef.current.setRadius(radius);
    }

    // Pan map to new center
    mapRef.current.panTo(circleCenter);
  }, [center, radius, mapLoaded]);

  // Cleanup circle on unmount
  useEffect(() => {
    return () => {
      if (circleRef.current) {
        circleRef.current.setMap(null);
        circleRef.current = null;
      }
    };
  }, []);

  const handleMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      onPositionChange(e.latLng.lat(), e.latLng.lng());
    }
  }, [onPositionChange]);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    setMapLoaded(true);
  }, []);

  if (loadError) {
    return (
      <div className="h-[300px] w-full bg-muted rounded-xl flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Error al cargar el mapa</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-[300px] w-full bg-muted rounded-xl flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={{ lat: center[0], lng: center[1] }}
      zoom={11}
      onClick={handleMapClick}
      onLoad={onMapLoad}
      options={{
        styles: mapStyles,
        disableDefaultUI: true,
        zoomControl: false,
        gestureHandling: 'greedy',
      }}
    />
  );
}
