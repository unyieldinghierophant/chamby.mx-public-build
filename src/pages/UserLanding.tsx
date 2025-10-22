import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import Footer from "@/components/Footer";
import MobileBottomNav from "@/components/MobileBottomNav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, LogOut, User, Settings, CreditCard, Shield, Users } from "lucide-react";
import { AISearchBar } from "@/components/AISearchBar";
import { CategoryCard } from "@/components/CategoryCard";
import logo from "@/assets/chamby-logo-new-icon.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
const UserLanding = () => {
  const {
    user,
    loading: authLoading,
    signOut
  } = useAuth();
  const {
    role,
    loading: roleLoading
  } = useUserRole();
  const {
    profile
  } = useProfile();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
  };

  // Redirect non-authenticated users to public landing
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/", {
        replace: true
      });
    }
  }, [user, authLoading, navigate]);

  // Redirect providers to their dashboard
  useEffect(() => {
    if (!roleLoading && role === "provider") {
      navigate("/provider-dashboard", {
        replace: true
      });
    }
  }, [role, roleLoading, navigate]);
  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>;
  }
  if (!user) {
    return null;
  }
  const categories = [{
    icon: "🚗",
    category: "Auto y Lavado",
    description: "Lavado, aspirado, encerado, batería",
    services: ["Lavado exterior completo", "Aspirado interior", "Encerado y pulido", "Cambio de batería", "Mantenimiento básico"],
    gradient: "from-blue-500 to-cyan-500"
  }, {
    icon: "🔧",
    category: "Fontanería",
    description: "Fugas, WC, bombas",
    services: ["Reparación de fugas", "Reparación de WC", "Instalación de bombas", "Destapado de cañerías", "Cambio de llaves"],
    gradient: "from-blue-600 to-indigo-600"
  }, {
    icon: "⚡",
    category: "Electricidad",
    description: "Apagadores, cortos, lámparas",
    services: ["Instalación de apagadores", "Reparación de cortos circuitos", "Instalación de lámparas", "Revisión de tablero eléctrico", "Cableado eléctrico"],
    gradient: "from-yellow-500 to-orange-500"
  }, {
    icon: "🧰",
    category: "Handyman",
    description: "Arreglos, pintura, colgar TV, mover muebles",
    services: ["Arreglos generales", "Pintura de interiores", "Colgar TV en pared", "Mover muebles", "Montaje de muebles", "Reparaciones menores"],
    gradient: "from-pink-500 to-rose-500"
  }];
  return <div className="min-h-screen bg-gradient-subtle">
      {/* Simple Header matching home page */}
      <header className="fixed top-0 left-0 right-0 bg-background border-b border-border z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 flex items-center justify-between">
          <button onClick={() => navigate('/user-landing')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={logo} alt="Chamby" className="w-40 h-40 -my-16" />
            <span className="text-xl font-['Made_Dillan'] text-foreground">
          </span>
          </button>
          
          {/* Desktop Profile Menu */}
          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || "Usuario"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/payment-settings")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Pagos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/security")}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Seguridad</span>
                </DropdownMenuItem>
                {profile?.is_tasker && <DropdownMenuItem onClick={() => navigate("/tasker-dashboard")}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Dashboard Tasker</span>
                  </DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile Profile Avatar */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user?.user_metadata?.avatar_url} />
                    <AvatarFallback>
                      {(profile?.full_name || user?.email || "U").charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {profile?.full_name || "Usuario"}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/profile")}>
                  <User className="mr-2 h-4 w-4" />
                  <span>Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/settings")}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/payment-settings")}>
                  <CreditCard className="mr-2 h-4 w-4" />
                  <span>Pagos</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/profile/security")}>
                  <Shield className="mr-2 h-4 w-4" />
                  <span>Seguridad</span>
                </DropdownMenuItem>
                {profile?.is_tasker && <DropdownMenuItem onClick={() => navigate("/tasker-dashboard")}>
                    <Users className="mr-2 h-4 w-4" />
                    <span>Dashboard Tasker</span>
                  </DropdownMenuItem>}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>{isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 pt-24 pb-24">
        {/* Welcome Section */}
        <div className="mb-8 text-center pt-[10%] md:pt-[5%]">
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
            {categories.map((category, index) => <CategoryCard key={index} icon={category.icon} category={category.category} description={category.description} services={category.services} gradient={category.gradient} />)}
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
              <Button onClick={() => navigate("/book-job")} className="mt-4 bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant">
                Buscar Servicios
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Become Provider CTA */}
        {role === "client" && <Card className="bg-gradient-to-br from-primary/10 to-purple-500/10 border-primary/20">
            <CardContent className="py-8 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                ¿Quieres ofrecer tus servicios?
              </h3>
              <p className="text-muted-foreground mb-4">
                Únete como proveedor y empieza a ganar dinero hoy
              </p>
              <Button onClick={() => navigate("/tasker-landing")} className="bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant">
                Convertirse en Proveedor
              </Button>
            </CardContent>
          </Card>}
      </main>

      <Footer />
      <div className="desktop-only">
        <MobileBottomNav />
      </div>
    </div>;
};
export default UserLanding;