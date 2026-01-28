import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import logo from "@/assets/chamby-logo-new-horizontal.png";
import { ModernButton } from "@/components/ui/modern-button";
import { Menu, X } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { AllCategoriesDialog } from "@/components/AllCategoriesDialog";
import { ReviewsCarousel } from "@/components/ReviewsCarousel";
import { FullPageSkeleton } from "@/components/skeletons";
const Index = () => {
  const {
    user,
    loading
  } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);

  const handlePostJobClick = () => {
    navigate('/book-job', {
      state: {
        category: 'Handyman',
        service: 'Reparaciones generales',
        description: 'Servicio de reparaciones generales del hogar'
      }
    });
  };

  const handleHowItWorksClick = () => {
    const howItWorksSection = document.getElementById('how-it-works-section');
    if (howItWorksSection) {
      howItWorksSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  useEffect(() => {
    if (!loading && user) {
      navigate("/user-landing");
    }
  }, [user, loading, navigate]);
  if (loading) {
    return <FullPageSkeleton />;
  }

  // Not logged in - show landing page
  if (!user) {
    return <div className="min-h-screen bg-background mobile-pb-nav">
      <AllCategoriesDialog 
        open={categoriesDialogOpen} 
        onOpenChange={setCategoriesDialogOpen} 
      />
      <header className="fixed top-0 left-0 right-0 bg-background z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-2 md:py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Chamby" className="h-40 md:h-48 w-auto" />
              <span className="text-xl font-['Made_Dillan'] text-foreground">
            </span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center justify-between flex-1">
              {/* Center Navigation */}
              <nav className="flex items-center gap-8 mx-auto">
                <button onClick={handlePostJobClick} className="px-6 py-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium">
                  Buscar Servicio
                </button>
                <button 
                  onClick={() => setCategoriesDialogOpen(true)}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  Categorías
                </button>
                <button 
                  onClick={handleHowItWorksClick}
                  className="text-foreground hover:text-primary transition-colors font-medium"
                >
                  ¿Cómo funciona?
                </button>
              </nav>

              {/* Right Auth Links */}
              <div className="flex items-center gap-6">
                <Link to="/auth/user" className="text-foreground hover:text-primary transition-colors font-medium">
                  Registrarse
                </Link>
                <Link to="/auth/user" className="text-foreground hover:text-primary transition-colors font-medium">
                  Iniciar sesión
                </Link>
                <Link to="/auth/provider" className="text-primary hover:text-primary/80 transition-colors font-medium">
                  Ser Chambynauta
                </Link>
              </div>
            </div>

            {/* Mobile Hamburger Menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 hover:bg-accent rounded-lg transition-colors">
                  <Menu className="h-6 w-6 text-foreground" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                <div className="flex flex-col gap-4 mt-8">
                  <button 
                    onClick={() => {
                      handlePostJobClick();
                      setMobileMenuOpen(false);
                    }}
                    className="px-6 py-3 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium text-center"
                  >
                    Buscar Servicio
                  </button>
                  <button 
                    onClick={() => {
                      setCategoriesDialogOpen(true);
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    Categorías
                  </button>
                  <button 
                    onClick={() => {
                      handleHowItWorksClick();
                      setMobileMenuOpen(false);
                    }}
                    className="px-4 py-2 text-foreground hover:text-primary transition-colors font-medium text-left"
                  >
                    ¿Cómo funciona?
                  </button>
                  <div className="border-t border-border my-4"></div>
                  <Link to="/auth/user" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-foreground hover:text-primary transition-colors font-medium text-left">
                    Registrarse
                  </Link>
                  <Link to="/auth/user?mode=signin" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-foreground hover:text-primary transition-colors font-medium text-left">
                    Iniciar sesión
                  </Link>
                  <Link to="/auth/provider" onClick={() => setMobileMenuOpen(false)} className="px-4 py-2 text-primary hover:text-primary/80 transition-colors font-semibold text-left">
                    Ser Chambynauta
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
          animationDelay: "0.5s"
        }}>
            <ReviewsCarousel />
          </div>
          <div className="animate-blur-fade" style={{
          animationDelay: "0.7s"
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