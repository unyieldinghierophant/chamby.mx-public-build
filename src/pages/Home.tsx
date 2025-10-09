import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Briefcase, Calendar, Clock, Heart, Shield, Star, Home as HomeIcon, Wrench, Droplets, Truck, SprayCan } from "lucide-react";
import EnhancedSearchBar from "@/components/EnhancedSearchBar";
import HowItWorks from "@/components/HowItWorks";
import Trust from "@/components/Trust";

export default function Home() {
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

  // Get user's first name for greeting
  const userName = profile?.full_name?.split(' ')[0] || 
                   user.user_metadata?.full_name?.split(' ')[0] || 
                   user.email?.split('@')[0] || 
                   'Usuario';

  const handleSearch = (query: string) => {
    // Search handled by EnhancedSearchBar redirect to /nueva-solicitud
  };

  const quickActions = [
    {
      title: "Trabajos Activos",
      description: "Ver tus trabajos en progreso",
      icon: Briefcase,
      action: () => navigate("/mobile-jobs"),
      gradient: "from-green-500 to-teal-500"
    },
    {
      title: "Trabajos Pasados",
      description: "Historial de trabajos completados",
      icon: Clock,
      action: () => navigate("/mobile-jobs"),
      gradient: "from-orange-500 to-red-500"
    },
    {
      title: "Servicios Favoritos",
      description: "Tus proveedores favoritos",
      icon: Heart,
      action: () => navigate("/mobile-favorites"),
      gradient: "from-pink-500 to-rose-500"
    },
    {
      title: "Historial de Trabajos",
      description: "Ver todo tu historial",
      icon: Calendar,
      action: () => navigate("/mobile-jobs"),
      gradient: "from-blue-500 to-purple-500"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section with Personalized Greeting */}
      <section className="relative min-h-screen bg-background flex items-center justify-center pt-20 overflow-hidden">
        {/* 3D Glass Morphic Background Icons */}
        <div className="absolute inset-0 pointer-events-none">
          {/* House Icon - Top Left */}
          <div className="absolute top-20 left-2 sm:top-32 sm:left-16 transform">
            <div className="w-14 h-14 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-xl rounded-2xl shadow-raised border border-white/30 flex items-center justify-center transform rotate-12 hover:rotate-6 transition-transform duration-300">
              <HomeIcon size={24} className="sm:w-8 sm:h-8 text-muted-foreground/60" />
            </div>
          </div>
          
          {/* Wrench Icon - Top Right */}
          <div className="absolute top-20 right-2 sm:top-40 sm:right-20 transform">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-xl rounded-xl shadow-raised border border-white/30 flex items-center justify-center transform -rotate-12 hover:rotate-0 transition-transform duration-300">
              <Wrench size={20} className="sm:w-6 sm:h-6 text-muted-foreground/60" />
            </div>
          </div>
          
          {/* Droplets Icon - Left Side */}
          <div className="absolute top-1/2 left-8 transform -translate-y-1/2">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl shadow-raised border border-white/30 flex items-center justify-center transform rotate-45 hover:rotate-12 transition-transform duration-300">
              <Droplets size={28} className="text-muted-foreground/60" />
            </div>
          </div>
          
          {/* Truck Icon - Right Side */}
          <div className="absolute top-1/2 right-12 transform -translate-y-1/2">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-2xl shadow-raised border border-white/30 flex items-center justify-center transform -rotate-6 hover:rotate-6 transition-transform duration-300">
              <Truck size={32} className="text-muted-foreground/60" />
            </div>
          </div>
          
          {/* SprayCan Icon - Bottom Left */}
          <div className="absolute bottom-32 left-24 transform">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-xl shadow-raised border border-white/30 flex items-center justify-center transform rotate-20 hover:rotate-0 transition-transform duration-300">
              <SprayCan size={24} className="text-muted-foreground/60" />
            </div>
          </div>
          
          {/* Additional Icon - Bottom Right */}
          <div className="absolute bottom-28 right-16 transform">
            <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl shadow-raised border border-white/30 flex items-center justify-center transform -rotate-15 hover:rotate-3 transition-transform duration-300">
              <Shield size={28} className="text-muted-foreground/60" />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-20 relative z-10">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            {/* Personalized Welcome Heading */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-foreground leading-tight pb-2">
                <span className="block bg-gradient-button bg-clip-text text-transparent py-[4px]">
                  ¡Bienvenido {userName}!
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground leading-relaxed max-w-3xl mx-auto px-4 pt-0">
                ¿Qué servicio necesitas hoy?
              </p>
            </div>

            {/* Enhanced Search Bar */}
            <div className="max-w-xl mx-auto">
              <EnhancedSearchBar 
                placeholder="¿Qué servicio necesitas hoy?" 
                onSearch={handleSearch} 
                size="lg" 
                className="w-full" 
              />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
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

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 bg-gradient-glass rounded-full px-6 py-3 shadow-soft backdrop-blur-glass">
                <Shield className="h-5 w-5 text-primary" />
                <span>Profesionales verificados</span>
              </div>
              <div className="flex items-center space-x-2 bg-gradient-glass rounded-full px-6 py-3 shadow-soft backdrop-blur-glass">
                <Star className="h-5 w-5 text-primary" />
                <span>Calificaciones reales</span>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="bg-gradient-card rounded-2xl p-6 shadow-raised backdrop-blur-glass border border-white/20">
                <div className="text-3xl md:text-4xl font-bold text-primary">500+</div>
                <div className="text-sm text-muted-foreground">Profesionales</div>
              </div>
              <div className="bg-gradient-card rounded-2xl p-6 shadow-raised backdrop-blur-glass border border-white/20">
                <div className="text-3xl md:text-4xl font-bold text-primary">10k+</div>
                <div className="text-sm text-muted-foreground">Servicios completados</div>
              </div>
              <div className="bg-gradient-card rounded-2xl p-6 shadow-raised backdrop-blur-glass border border-white/20">
                <div className="text-3xl md:text-4xl font-bold text-primary">4.9★</div>
                <div className="text-sm text-muted-foreground">Calificación promedio</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <div className="animate-blur-fade" style={{ animationDelay: '0.3s' }}>
        <HowItWorks />
      </div>

      {/* Trust Section */}
      <div className="animate-blur-fade" style={{ animationDelay: '0.6s' }}>
        <Trust />
      </div>

      <Footer />
      <MobileBottomNav />
    </div>
  );
}
