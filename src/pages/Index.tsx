import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";

const Index = () => {
  const { user, loading } = useAuth();

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
        <Header />
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

  // Logged in - show logged-in home page
  return (
    <div className="min-h-screen bg-background mobile-pb-nav">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            Bienvenido, {user.user_metadata?.full_name || user.email}
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
            Esta es tu página de inicio personalizada.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Mis Solicitudes</h3>
              <p className="text-sm text-muted-foreground">Ver y gestionar tus servicios</p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Perfil</h3>
              <p className="text-sm text-muted-foreground">Actualiza tu información</p>
            </div>
            <div className="p-6 rounded-lg border bg-card">
              <h3 className="font-semibold mb-2">Configuración</h3>
              <p className="text-sm text-muted-foreground">Ajusta tus preferencias</p>
            </div>
          </div>
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
};

export default Index;
