import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix leaflet default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationMapProps {
  coordinates: [number, number];
  onLocationSelect: (lat: number, lng: number, address: string) => void;
}

function MapClickHandler({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
        );
        const data = await response.json();
        onLocationSelect(lat, lng, data.display_name);
      } catch (error) {
        console.error('Error reverse geocoding:', error);
        onLocationSelect(lat, lng, '');
      }
    },
  });
  return null;
}

export const LocationMap = ({ coordinates, onLocationSelect }: LocationMapProps) => {
  return (
    <MapContainer
      center={coordinates}
      zoom={13}
      style={{ height: '100%', width: '100%' }}
      key={`${coordinates[0]}-${coordinates[1]}`}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={coordinates} />
      <MapClickHandler onLocationSelect={onLocationSelect} />
    </MapContainer>
  );
};
