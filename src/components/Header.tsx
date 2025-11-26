import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernButton } from "@/components/ui/modern-button";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, Settings, CreditCard, Shield, Users } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import chambyLogo from "@/assets/chamby-logo-text.png";
import { BackButton } from "@/components/BackButton";
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
import { ROUTES } from "@/constants/routes";

interface HeaderProps {
  hideLogo?: boolean;
  hideProfileMenu?: boolean;
  backButtonVariant?: "back" | "close";
  backButtonPosition?: "left" | "right";
  logoAlignment?: "left" | "center";
}

const Header = ({ 
  hideLogo = false, 
  hideProfileMenu = false,
  backButtonVariant = "back",
  backButtonPosition = "left",
  logoAlignment = "center"
}: HeaderProps) => {
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
  };

  const isProvider = user?.user_metadata?.is_provider;
  
  // Determine if we're on a provider page based on current route
  const isOnProviderPage = location.pathname.startsWith(ROUTES.PROVIDER_PORTAL);
  
  // Determine where the logo should navigate based on current page context
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

  const handlePostJobClick = () => {
    navigate(ROUTES.BOOK_JOB, {
      state: {
        category: 'Handyman',
        service: 'Reparaciones generales',
        description: 'Servicio de reparaciones generales del hogar'
      }
    });
  };

  return (
    <>
      <AllCategoriesDialog 
        open={categoriesDialogOpen} 
        onOpenChange={setCategoriesDialogOpen} 
      />
    <header className="absolute top-8 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-20 md:h-24 relative">
          {/* Logo - Absolute left */}
          <div className="absolute left-0 flex items-center">
            <button 
              onClick={() => navigate(getLogoDestination())}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img 
                src={chambyLogo} 
                alt="Chamby.mx" 
                className="h-16 md:h-20 w-auto"
              />
            </button>
          </div>

          {/* Center - All Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <button onClick={handlePostJobClick}>
              <span className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-3 text-base font-semibold inline-block transition-colors cursor-pointer">
                Publicar tarea
              </span>
            </button>
            <button 
              onClick={() => setCategoriesDialogOpen(true)}
              className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal"
            >
              Categorías
            </button>
            <Link to={ROUTES.ACTIVE_JOBS} className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
              Trabajos activos
            </Link>
            <button 
              onClick={handleHowItWorksClick}
              className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal"
            >
              Cómo funciona
            </button>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative h-10 w-10 rounded-full hover:opacity-80 transition-opacity">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
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
                <Link to={ROUTES.USER_AUTH} className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
                  Registrarse
                </Link>
                <Link to={ROUTES.USER_AUTH_SIGNIN} className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
                  Iniciar sesión
                </Link>
                <Link to={ROUTES.PROVIDER_AUTH} className="text-primary hover:text-primary/80 transition-colors text-base font-semibold">
                  Ser Chambynauta
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button - Absolute right */}
          <div className="absolute right-0 lg:hidden">
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
                to={ROUTES.USER_AUTH} 
                className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Iniciar sesión / Registrarse
              </Link>
              
              <Link 
                to={ROUTES.PROVIDER_AUTH} 
                className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Ser Chambynauta
              </Link>
            </div>
          </div>
        )}
      </div>
    </header>
    </>
  );
};

export default Header;