import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar, Clock, Heart, Search, TrendingUp } from "lucide-react";

const UserLanding = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  // Redirect non-authenticated users to public landing
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/user-landing", { replace: true });
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

  const quickActions = [
    {
      title: "Nueva Solicitud",
      description: "Crea una nueva solicitud de servicio",
      icon: Search,
      action: () => navigate("/nueva-solicitud"),
      gradient: "from-blue-500 to-purple-500"
    },
    {
      title: "Mis Trabajos",
      description: "Ver tus trabajos activos",
      icon: Briefcase,
      action: () => navigate("/mobile-jobs"),
      gradient: "from-green-500 to-teal-500"
    },
    {
      title: "Favoritos",
      description: "Tus proveedores favoritos",
      icon: Heart,
      action: () => navigate("/mobile-favorites"),
      gradient: "from-pink-500 to-rose-500"
    },
    {
      title: "Historial",
      description: "Ver trabajos completados",
      icon: Clock,
      action: () => navigate("/mobile-jobs"),
      gradient: "from-orange-500 to-red-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-24">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            ¡Bienvenido de vuelta!
          </h1>
          <p className="text-muted-foreground text-lg">
            ¿Qué necesitas hoy?
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-elegant transition-all duration-300 hover:scale-105 bg-gradient-card border-white/20"
                onClick={action.action}
              >
                <CardHeader className="pb-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center mb-3 shadow-glow`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <CardTitle className="text-lg">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            );
          })}
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
                onClick={() => navigate("/nueva-solicitud")}
                className="mt-4 bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant"
              >
                Crear Primera Solicitud
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
