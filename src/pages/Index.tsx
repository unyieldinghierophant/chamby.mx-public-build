import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import Header from "@/components/Header";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/user-landing");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Not logged in - show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-background mobile-pb-nav">
        <Header hideProfileMenu={false} />
        <main className="pt-20">
          <div className="animate-fade-in">
            <Hero />
          </div>
          <div className="animate-blur-fade" style={{ animationDelay: "0.3s" }}>
            <HowItWorks />
          </div>
          <div className="animate-blur-fade" style={{ animationDelay: "0.6s" }}>
            <Trust />
          </div>
        </main>
        <Footer />
        <div className="desktop-only">
          <MobileBottomNav />
        </div>
      </div>
    );
  }

  // This shouldn't render since logged-in users are redirected
  return null;
};
const AddressMap = () => {
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = initMap;
    document.head.appendChild(script);

    function initMap() {
      const defaultLocation = { lat: 20.6736, lng: -103.344 }; // Guadalajara
      const map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 13,
      });
      const marker = new google.maps.Marker({
        position: defaultLocation,
        map,
        draggable: true,
      });
      const input = document.getElementById("address") as HTMLInputElement;
      const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: { country: "mx" },
      });
      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry) return;
        map.setCenter(place.geometry.location);
        marker.setPosition(place.geometry.location);
      });
      google.maps.event.addListener(marker, "dragend", () => {
        const pos = marker.getPosition();
        const coordsInput = document.getElementById("coords") as HTMLInputElement;
        if (coordsInput) {
          coordsInput.value = `${pos.lat().toFixed(6)}, ${pos.lng().toFixed(6)}`;
        }
      });
    }
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h2 className="text-lg font-semibold mb-2">Selecciona tu dirección</h2>
      <input
        id="address"
        type="text"
        placeholder="Escribe tu dirección"
        style={{ width: "100%", marginBottom: "10px" }}
      />
      <input
        id="coords"
        type="text"
        placeholder="Coordenadas"
        readOnly
        style={{ width: "100%", marginBottom: "10px" }}
      />
      <div id="map" style={{ width: "100%", height: "300px", borderRadius: "10px" }}></div>
    </div>
  );
};

export default Index;
