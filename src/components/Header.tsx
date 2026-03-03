import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Menu, X, LogOut, User, Settings, CreditCard, Users } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import ChambyLogoText from "@/components/ChambyLogoText";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AllCategoriesDialog } from "@/components/AllCategoriesDialog";
import { HeaderSearchBar } from "@/components/HeaderSearchBar";
import { ROUTES } from "@/constants/routes";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categoriesDialogOpen, setCategoriesDialogOpen] = useState(false);
  const { user, signOut } = useAuth();
  const { role } = useUserRole();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
    if (location.pathname.startsWith('/provider')) {
      navigate('/provider-landing');
    } else {
      navigate('/');
    }
  };

  const isProvider = user?.user_metadata?.is_provider;
  const isOnProviderPage = location.pathname.startsWith(ROUTES.PROVIDER_PORTAL);

  const getLogoDestination = () => {
    return isOnProviderPage ? ROUTES.PROVIDER_LANDING : ROUTES.USER_LANDING;
  };

  const handleHowItWorksClick = (e: React.MouseEvent) => {
    if (location.pathname === ROUTES.HOME || location.pathname === ROUTES.USER_LANDING) {
      e.preventDefault();
      const howItWorksSection = document.getElementById('how-it-works-section');
      if (howItWorksSection) {
        howItWorksSection.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <>
      <AllCategoriesDialog 
        open={categoriesDialogOpen} 
        onOpenChange={setCategoriesDialogOpen} 
      />
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative flex items-center h-16 md:h-20">
            {/* Logo — absolute center, ignoring siblings */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="pointer-events-auto">
                <ChambyLogoText onClick={() => navigate(getLogoDestination())} size="md" />
              </div>
            </div>
            <div className="hidden lg:flex items-center gap-5 ml-auto">
              <HeaderSearchBar />
              
              <button 
                onClick={() => setCategoriesDialogOpen(true)}
                className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium whitespace-nowrap"
              >
                Categorías
              </button>
              <Link to={ROUTES.ACTIVE_JOBS} className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium whitespace-nowrap">
                Trabajos activos
              </Link>
              <button 
                onClick={handleHowItWorksClick}
                className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium whitespace-nowrap"
              >
                Cómo funciona
              </button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="relative h-9 w-9 rounded-full hover:opacity-80 transition-opacity flex-shrink-0">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-sm">
                          {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {user.user_metadata?.full_name || "Usuario"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {user.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE)}>
                      <User className="mr-2 h-4 w-4" />
                      <span>Perfil</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/invoices')}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span>Facturas</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(ROUTES.PROFILE_SETTINGS)}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </DropdownMenuItem>
                    {isProvider && (
                      <DropdownMenuItem onClick={() => navigate(ROUTES.PROVIDER_PORTAL)}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Portal Proveedor</span>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut} disabled={isLoggingOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>{isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <>
                  <Link to={ROUTES.USER_AUTH} className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium whitespace-nowrap">
                    Registrarse
                  </Link>
                  <Link to={ROUTES.LOGIN} className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium whitespace-nowrap">
                    Iniciar sesión
                  </Link>
                  <Link to={ROUTES.PROVIDER_AUTH} className="text-primary hover:text-primary/80 transition-colors text-sm font-semibold whitespace-nowrap">
                    Ser Chambynauta
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden ml-auto">
              <button
                className="p-2 hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="lg:hidden border-t border-border/40 bg-background">
              <div className="px-4 pt-4 pb-6 space-y-3">
                <button 
                  onClick={() => {
                    setCategoriesDialogOpen(true);
                    setIsMenuOpen(false);
                  }}
                  className="block w-full text-left py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                >
                  Servicios
                </button>
                <Link 
                  to={ROUTES.ACTIVE_JOBS}
                  className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Trabajos activos
                </Link>
                {user ? (
                  <>
                    <Link 
                      to={ROUTES.PROFILE}
                      className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Perfil
                    </Link>
                    <button
                      onClick={() => { handleSignOut(); setIsMenuOpen(false); }}
                      className="block w-full text-left py-3 text-lg font-medium text-destructive hover:text-destructive/80 transition-colors"
                    >
                      Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <>
                    <Link 
                      to={ROUTES.LOGIN} 
                      className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Iniciar sesión
                    </Link>
                    <Link 
                      to={ROUTES.USER_AUTH} 
                      className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Registrarse
                    </Link>
                    <Link 
                      to={ROUTES.PROVIDER_AUTH} 
                      className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Ser Chambynauta
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
