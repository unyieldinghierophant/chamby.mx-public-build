import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import logo from "@/assets/chamby-logo-new-icon.png";
import { ModernButton } from "@/components/ui/modern-button";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
const Index = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  useEffect(() => {
    if (!loading && user) {
      navigate("/user-landing");
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>;
  }

  // Not logged in - show landing page
  if (!user) {
    return <div className="min-h-screen bg-background mobile-pb-nav">
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Chamby" className="w-24 h-24 -my-4" />
              <span className="text-xl font-['Made_Dillan'] text-foreground">
            </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/auth/tasker">
                <ModernButton variant="accent">Ser Tasker</ModernButton>
              </Link>
              <Link to="/auth/user">
                <ModernButton variant="primary">Iniciar Sesión</ModernButton>
              </Link>
            </div>

            {/* Mobile Hamburger Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors">
                  <Menu className="h-6 w-6 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-6 mt-8">
                  <Link to="/auth/tasker" onClick={() => setMobileMenuOpen(false)}>
                    <ModernButton variant="accent" className="w-full">
                      Ser Tasker
                    </ModernButton>
                  </Link>
                  <Link to="/auth/user" onClick={() => setMobileMenuOpen(false)}>
                    <ModernButton variant="primary" className="w-full">
                      Iniciar Sesión
                    </ModernButton>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>
        <main className="pt-20">
          <div className="animate-fade-in">
            <Hero />
          </div>
          <div className="animate-blur-fade" style={{
          animationDelay: "0.3s"
        }}>
            <HowItWorks />
          </div>
          <div className="animate-blur-fade" style={{
          animationDelay: "0.6s"
        }}>
            <Trust />
          </div>
        </main>
        <Footer />
        <div className="desktop-only">
          <MobileBottomNav />
        </div>
      </div>;
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
      const defaultLocation = {
        lat: 20.6736,
        lng: -103.344
      }; // Guadalajara
      const map = new google.maps.Map(document.getElementById("map"), {
        center: defaultLocation,
        zoom: 13
      });
      const marker = new google.maps.Marker({
        position: defaultLocation,
        map,
        draggable: true
      });
      const input = document.getElementById("address") as HTMLInputElement;
      const autocomplete = new google.maps.places.Autocomplete(input, {
        componentRestrictions: {
          country: "mx"
        }
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
  return <div style={{
    padding: "20px"
  }}>
      <h2 className="text-lg font-semibold mb-2">Selecciona tu dirección</h2>
      <input id="address" type="text" placeholder="Escribe tu dirección" style={{
      width: "100%",
      marginBottom: "10px"
    }} />
      <input id="coords" type="text" placeholder="Coordenadas" readOnly style={{
      width: "100%",
      marginBottom: "10px"
    }} />
      <div id="map" style={{
      width: "100%",
      height: "300px",
      borderRadius: "10px"
    }}></div>
    </div>;
};
export default Index;