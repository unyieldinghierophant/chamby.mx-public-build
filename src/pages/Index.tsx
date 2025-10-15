import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

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
        <Header logoAlignment="left" />
        <main>
          <div className="animate-fade-in">
            <Hero />
          </div>
          <div className="animate-blur-fade" style={{ animationDelay: '0.3s' }}>
            <HowItWorks />
          </div>
          <div className="animate-blur-fade" style={{ animationDelay: '0.6s' }}>
            <Trust />
          </div>
        </main>
        <div className="desktop-only">
          <Footer />
        </div>
        <div className="mobile-only">
          <MobileBottomNav />
        </div>
      </div>
    );
  }

  // This shouldn't render since logged-in users are redirected
  return null;
};

export default Index;
