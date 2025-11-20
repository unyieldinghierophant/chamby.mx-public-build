import { useEffect, useState } from "react";
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from "@react-google-maps/api";

interface JobTrackingMapProps {
  clientLat: number;
  clientLng: number;
  providerLat?: number | null;
  providerLng?: number | null;
  providerName?: string;
}

const mapContainerStyle = {
  width: "100%",
  height: "400px",
};

export const JobTrackingMap = ({
  clientLat,
  clientLng,
  providerLat,
  providerLng,
  providerName,
}: JobTrackingMapProps) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDZF5nFnQPtaOpuqC9fHfEb1HbMrCrYMGo",
  });

  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);

  useEffect(() => {
    if (isLoaded && providerLat && providerLng && map) {
      const directionsService = new google.maps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: providerLat, lng: providerLng },
          destination: { lat: clientLat, lng: clientLng },
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            setDirections(result);
          }
        }
      );
    }
  }, [isLoaded, clientLat, clientLng, providerLat, providerLng, map]);

  const center = {
    lat: providerLat || clientLat,
    lng: providerLng || clientLng,
  };

  if (!isLoaded) {
    return <div className="w-full h-[400px] bg-muted animate-pulse rounded-lg" />;
  }

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={13}
      onLoad={(map) => setMap(map)}
      options={{
        disableDefaultUI: false,
        zoomControl: true,
      }}
    >
      {/* Client location marker (home) */}
      <Marker
        position={{ lat: clientLat, lng: clientLng }}
        icon={{
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
        }}
        title="Tu ubicación"
      />

      {/* Provider location marker */}
      {providerLat && providerLng && (
        <Marker
          position={{ lat: providerLat, lng: providerLng }}
          icon={{
            url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          }}
          title={providerName || "Chambynauta"}
        />
      )}

      {/* Route */}
      {directions && <DirectionsRenderer directions={directions} />}
    </GoogleMap>
  );
};
