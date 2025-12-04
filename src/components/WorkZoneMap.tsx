import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Circle, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface WorkZoneMapProps {
  center: [number, number];
  radius: number;
  onPositionChange: (lat: number, lng: number) => void;
}

// Inner component that uses react-leaflet hooks
function MapEventHandler({ 
  center, 
  onPositionChange 
}: { 
  center: [number, number]; 
  onPositionChange: (lat: number, lng: number) => void;
}) {
  const map = useMap();
  const prevCenter = useRef(center);
  
  // Handle map clicks
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  
  // Handle recentering when center changes
  useEffect(() => {
    if (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1]) {
      map.setView(center, map.getZoom());
      prevCenter.current = center;
    }
  }, [center, map]);

  return null;
}

export default function WorkZoneMap({ center, radius, onPositionChange }: WorkZoneMapProps) {
  return (
    <MapContainer
      center={center}
      zoom={11}
      style={{ height: '300px', width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <Circle
        center={center}
        radius={radius}
        pathOptions={{
          color: '#8B5CF6',
          fillColor: '#8B5CF6',
          fillOpacity: 0.15,
          weight: 2,
        }}
      />
      <MapEventHandler center={center} onPositionChange={onPositionChange} />
    </MapContainer>
  );
}
