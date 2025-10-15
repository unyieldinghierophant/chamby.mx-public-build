import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useEffect } from "react";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import logo from "@/assets/chamby-logo-icon.png";
import { ModernButton } from "@/components/ui/modern-button";

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
        <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
          <div className="max-w-7xl mx-auto px-4 md:px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={logo} alt="Chamby" className="w-8 h-8" />
              <span className="text-xl font-['Made_Dillan'] text-foreground">Chamby</span>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <Link to="/auth/tasker">
                <ModernButton variant="accent">
                  Ser Tasker
                </ModernButton>
              </Link>
              <Link to="/auth/user">
                <ModernButton variant="primary">
                  Iniciar Sesión
                </ModernButton>
              </Link>
            </div>
          </div>
        </header>
        <main className="pt-20">
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
