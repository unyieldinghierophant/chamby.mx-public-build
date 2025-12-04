import { useEffect, useRef } from 'react';
import { TileLayer, Circle, useMapEvents, useMap } from 'react-leaflet';

interface MapContentProps {
  center: [number, number];
  radius: number;
  onPositionChange: (lat: number, lng: number) => void;
}

export function WorkZoneMapContent({ center, radius, onPositionChange }: MapContentProps) {
  const prevCenter = useRef(center);
  
  // Handle map clicks
  useMapEvents({
    click(e) {
      onPositionChange(e.latlng.lat, e.latlng.lng);
    },
  });
  
  // Handle recentering
  const map = useMap();
  useEffect(() => {
    if (prevCenter.current[0] !== center[0] || prevCenter.current[1] !== center[1]) {
      map.setView(center, map.getZoom());
      prevCenter.current = center;
    }
  }, [center, map]);

  return (
    <>
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
    </>
  );
}
