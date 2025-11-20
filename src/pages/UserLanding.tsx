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
import logo from "@/assets/chamby-logo-text.png";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import categoryAuto from "@/assets/category-auto.png";
import categoryPlumbing from "@/assets/category-plumbing.png";
import categoryElectrician from "@/assets/category-electrician.png";
import categoryHandyman from "@/assets/category-handyman.png";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { categoryServicesMap } from "@/data/categoryServices";
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
  const [selectedCategory, setSelectedCategory] = useState<string>('handyman');
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

  // Redirect providers to provider portal
  useEffect(() => {
    if (!roleLoading && role === "provider") {
      navigate("/provider-portal", {
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

  const categoryTabsData = [
    { id: 'handyman', name: 'Handyman', icon: categoryHandyman, dataKey: 'Handyman' },
    { id: 'electrician', name: 'Electricidad', icon: categoryElectrician, dataKey: 'Electricidad' },
    { id: 'plumbing', name: 'Fontanería', icon: categoryPlumbing, dataKey: 'Fontanería' },
    { id: 'auto', name: 'Auto y Lavado', icon: categoryAuto, dataKey: 'Auto y Lavado' },
  ];

  const currentCategory = categoryTabsData.find(cat => cat.id === selectedCategory);
  const services = currentCategory ? categoryServicesMap[currentCategory.dataKey] || [] : [];

  const handleServiceClick = (serviceName: string, description: string) => {
    localStorage.removeItem('chamby_form_job-booking');
    sessionStorage.removeItem('chamby_form_job-booking');
    navigate(`/book-job?new=${Date.now()}`, {
      state: {
        category: currentCategory?.dataKey || 'General',
        service: serviceName,
        description: description,
        forceNew: true
      }
    });
  };
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
                {role === 'provider' && (
                  <DropdownMenuItem onClick={() => navigate("/provider-portal")}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Portal de Proveedores</span>
                  </DropdownMenuItem>
                )}
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
                {role === 'provider' && (
                  <DropdownMenuItem onClick={() => navigate("/provider-portal")}>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    <span>Portal de Proveedores</span>
                  </DropdownMenuItem>
                )}
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
        {/* Welcome Section with Blue Card */}
        <div className="mb-8 text-center pt-[10%] md:pt-[5%]">
          <h1 className="text-3xl md:text-4xl font-['Made_Dillan'] text-foreground mb-6">
            ¡Bienvenido de vuelta{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}!
          </h1>
          
          {/* Blue Card with Stars - matching landing page */}
          <div className="relative bg-gradient-to-br from-[#1e3a8a] to-[#1e40af] rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 lg:p-10 shadow-[0_20px_60px_-15px_rgba(30,58,138,0.5)] border border-white/10 max-w-4xl mx-auto">
            {/* Shiny Stars Background - SVG Stars */}
            <div className="absolute inset-0 pointer-events-none">
              <svg className="absolute top-[8%] left-[12%] w-6 h-6 text-white animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: '0s', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute top-[15%] right-[18%] w-5 h-5 text-white animate-[pulse_2.5s_ease-in-out_infinite]" style={{ animationDelay: '0.5s', filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.9))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute bottom-[12%] left-[8%] w-4 h-4 text-white animate-[pulse_3s_ease-in-out_infinite]" style={{ animationDelay: '1s', filter: 'drop-shadow(0 0 5px rgba(255,255,255,0.7))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute top-[55%] right-[12%] w-6 h-6 text-white animate-[pulse_2s_ease-in-out_infinite]" style={{ animationDelay: '1.5s', filter: 'drop-shadow(0 0 7px rgba(255,255,255,0.85))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              <svg className="absolute bottom-[22%] right-[22%] w-5 h-5 text-white animate-[pulse_2.5s_ease-in-out_infinite]" style={{ animationDelay: '2s', filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="relative z-10 space-y-4">
              <p className="text-white text-lg md:text-xl mb-4">
                ¿Qué necesitas hoy?
              </p>
              
              {/* AI Search Bar */}
              <AISearchBar className="max-w-2xl mx-auto" />
            </div>
          </div>
        </div>

        {/* Category Tabs with Service Pills - Same as Landing Page */}
        <div className="mb-12 w-[96%] md:w-[98%] mx-auto">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
            {/* Category Tabs */}
            <TabsList className="w-full h-auto bg-background/50 backdrop-blur-sm p-4 rounded-2xl grid grid-cols-4 gap-4">
              {categoryTabsData.map((category) => (
                <TabsTrigger
                  key={category.id}
                  value={category.id}
                  className="flex flex-col items-center gap-4 p-5 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-xl transition-all h-auto"
                >
                  <div className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center">
                    <img 
                      src={category.icon} 
                      alt={category.name} 
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <span className="text-base md:text-lg font-medium whitespace-nowrap">
                    {category.name}
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Service Pills for Each Category */}
            {categoryTabsData.map((category) => (
              <TabsContent 
                key={category.id} 
                value={category.id}
                className="mt-10 animate-in fade-in-50 duration-300"
              >
                <div className="flex flex-wrap gap-4 justify-center pb-7">
                  {services.map((service) => (
                    <Button
                      key={service.name}
                      onClick={() => handleServiceClick(service.name, service.description)}
                      variant="outline"
                      className="rounded-full px-7 py-4 h-auto text-base md:text-lg bg-background/50 backdrop-blur-sm hover:bg-primary/10 hover:text-primary hover:border-primary transition-all"
                    >
                      {service.name}
                    </Button>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
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
              <Button onClick={() => navigate("/become-provider")} className="bg-gradient-button text-primary-foreground shadow-glow hover:shadow-elegant">
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