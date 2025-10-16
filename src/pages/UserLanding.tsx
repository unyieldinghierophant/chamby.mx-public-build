import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import { AISearchBar } from "@/components/AISearchBar";
import { CategoryCard } from "@/components/CategoryCard";

const UserLanding = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const { profile } = useProfile();
  const navigate = useNavigate();

  // Redirect non-authenticated users to public landing
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/", { replace: true });
    }
  }, [user, authLoading, navigate]);

  // Redirect providers to their dashboard
  useEffect(() => {
    if (!roleLoading && role === "provider") {
      navigate("/provider-dashboard", { replace: true });
    }
  }, [role, roleLoading, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const categories = [
    {
      icon: "🚗",
      category: "Auto y Lavado",
      description: "Lavado, aspirado, encerado, batería",
      services: [
        "Lavado exterior completo",
        "Aspirado interior",
        "Encerado y pulido",
        "Cambio de batería",
        "Mantenimiento básico"
      ],
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: "🔧",
      category: "Fontanería",
      description: "Fugas, WC, bombas",
      services: [
        "Reparación de fugas",
        "Reparación de WC",
        "Instalación de bombas",
        "Destapado de cañerías",
        "Cambio de llaves"
      ],
      gradient: "from-blue-600 to-indigo-600"
    },
    {
      icon: "⚡",
      category: "Electricidad",
      description: "Apagadores, cortos, lámparas",
      services: [
        "Instalación de apagadores",
        "Reparación de cortos circuitos",
        "Instalación de lámparas",
        "Revisión de tablero eléctrico",
        "Cableado eléctrico"
      ],
      gradient: "from-yellow-500 to-orange-500"
    },
    {
      icon: "🧰",
      category: "Handyman",
      description: "Arreglos, pintura, colgar TV, mover muebles",
      services: [
        "Arreglos generales",
        "Pintura de interiores",
        "Colgar TV en pared",
        "Mover muebles",
        "Montaje de muebles",
        "Reparaciones menores"
      ],
      gradient: "from-pink-500 to-rose-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header logoAlignment="left" />
      
      <main className="container mx-auto px-4 pt-24 pb-24">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            ¡Bienvenido de vuelta{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
          </h1>
          <p className="text-muted-foreground text-lg mb-6">
            ¿Qué necesitas hoy?
          </p>
          
          {/* AI Search Bar */}
          <div className="mb-10">
            <AISearchBar />
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold text-foreground mb-6">
            Categorías de Servicios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categories.map((category, index) => (
              <CategoryCard
                key={index}
                icon={category.icon}
                category={category.category}
                description={category.description}
                services={category.services}
                gradient={category.gradient}
              />
            ))}
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">
            Actividad Reciente
          </h2>
          <Card className="bg-gradient-card border-white/20">
            <CardContent className="py-12 text-center">
              <TrendingUp className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No tienes actividad reciente todavía
              </p>
              <Button
                onClick={() => navigate("/book-job")}
                className="mt-4 bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant"
              >
                Buscar Servicios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Become Provider CTA */}
        {role === "client" && (
          <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                ¿Quieres ofrecer tus servicios?
              </h3>
              <p className="text-muted-foreground mb-4">
                Únete como proveedor y empieza a ganar dinero hoy
              </p>
              <Button
                onClick={() => navigate("/tasker-landing")}
                className="bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant"
              >
                Convertirse en Proveedor
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Footer />
      <MobileBottomNav />
    </div>
  );
};

export default UserLanding;
