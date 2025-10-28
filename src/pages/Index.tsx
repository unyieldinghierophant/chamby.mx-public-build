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
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-border/40 z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-center relative">
            {/* Logo - Absolute Left */}
            <div className="absolute left-4 md:left-8">
              <img src={logo} alt="Chamby" className="w-10 h-10 md:w-12 md:h-12" />
            </div>

            {/* Center Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <Link to="/book-job">
                <span className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-3 text-base font-semibold inline-block transition-colors cursor-pointer">
                  Publicar tarea
                </span>
              </Link>
              <Link to="/categories" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
                Categorías
              </Link>
              <Link to="/browse-tasks" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
                Explorar tareas
              </Link>
              <Link to="/how-it-works" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
                Cómo funciona
              </Link>
              <Link to="/auth/user" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
                Registrarse
              </Link>
              <Link to="/auth/user?mode=signin" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
                Iniciar sesión
              </Link>
              <Link to="/auth/tasker" className="text-primary hover:text-primary/80 transition-colors text-base font-semibold">
                Ser Chambynauta
              </Link>
            </div>

            {/* Mobile Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="absolute right-4 md:right-8 lg:hidden p-2 hover:bg-accent rounded-lg transition-colors">
                  {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-4 mt-8">
                  <Link to="/book-job" onClick={() => setMobileMenuOpen(false)}>
                    <span className="w-full bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 text-base font-semibold inline-block text-center">
                      Publicar tarea
                    </span>
                  </Link>
                  <Link to="/categories" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                    Categorías
                  </Link>
                  <Link to="/browse-tasks" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                    Explorar tareas
                  </Link>
                  <Link to="/how-it-works" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                    Cómo funciona
                  </Link>
                  <div className="pt-4 border-t border-border/40 space-y-2">
                    <Link to="/auth/user" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                      Registrarse
                    </Link>
                    <Link to="/auth/user?mode=signin" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                      Iniciar sesión
                    </Link>
                    <Link to="/auth/tasker" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-base font-semibold text-primary hover:text-primary/80">
                      Ser Chambynauta
                    </Link>
                  </div>
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