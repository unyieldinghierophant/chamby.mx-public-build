import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernButton } from "@/components/ui/modern-button";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, Settings, CreditCard, Shield, Users } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import chambyLogo from "@/assets/chamby-logo-new.png";
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

  const isTasker = user?.user_metadata?.is_tasker;
  
  // Determine if we're on a tasker page based on current route
  const isOnTaskerPage = location.pathname.startsWith('/tasker') || location.pathname === '/provider-dashboard';
  
  // Determine where the logo should navigate based on current page context
  const getLogoDestination = () => {
    return isOnTaskerPage ? '/tasker-landing' : '/user-landing';
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-16 px-4 md:px-8 pt-[5%]">
          {/* Left Side - Logo or Back Button */}
          <div className="flex items-center min-w-0">
            {logoAlignment === "center" && backButtonPosition === "left" && location.pathname !== '/' && location.pathname !== '/user-landing' && location.pathname !== '/tasker-landing' ? (
              <BackButton variant={backButtonVariant} fallbackPath={user ? '/user-landing' : '/'} />
            ) : !hideLogo && logoAlignment === "left" ? (
              <button 
                onClick={() => navigate(getLogoDestination())}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img 
                  src={chambyLogo} 
                  alt="Chamby.mx" 
                  className="h-12 md:h-14 w-auto"
                />
              </button>
            ) : null}
          </div>

          {/* Center - Logo (only when centered) */}
          {!hideLogo && logoAlignment === "center" && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
              <button 
                onClick={() => navigate(getLogoDestination())}
                className="hover:opacity-80 transition-opacity cursor-pointer"
              >
                <img 
                  src={chambyLogo} 
                  alt="Chamby.mx" 
                  className="h-12 md:h-14 w-auto"
                />
              </button>
            </div>
          )}

          {/* Right Side - Profile Menu or Back Button */}
          <div className="flex items-center gap-4">
            {/* Desktop Profile Menu */}
            {!hideProfileMenu && user && (
              <div className="hidden md:flex items-center space-x-4">
                {isTasker && isOnTaskerPage && (
                  <Link to="/tasker-dashboard">
                    <ModernButton variant="outline" size="sm">
                      Mi Dashboard
                    </ModernButton>
                  </Link>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
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
                    {isTasker && (
                      <DropdownMenuItem onClick={() => navigate("/tasker-dashboard")}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Dashboard Tasker</span>
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
            )}

            {/* Auth Buttons for Non-Logged In Users */}
            {!hideProfileMenu && !user && (
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
            )}

            {/* Mobile Menu Button - Always visible on mobile */}
            <div className="md:hidden flex items-center gap-2">
              {backButtonPosition === "right" && location.pathname !== '/' && location.pathname !== '/user-landing' && location.pathname !== '/tasker-landing' && (
                <BackButton variant={backButtonVariant} fallbackPath={user ? '/user-landing' : '/'} />
              )}
              <ModernButton
                variant="glass"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </ModernButton>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/10 bg-gradient-glass backdrop-blur-glass shadow-soft rounded-b-2xl mx-4">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <div className="flex flex-col space-y-2 px-3 pt-2">
                {user ? (
                  <>
                    {/* User info */}
                    <div className="flex items-center justify-center py-2 space-x-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback>
                          {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium text-primary">
                        {user.user_metadata?.full_name || user.email}
                      </span>
                    </div>
                    
                    {/* Dashboard for taskers only */}
                    {isTasker && isOnTaskerPage && (
                      <Link to="/tasker-dashboard">
                        <ModernButton variant="outline" className="w-full">
                          Mi Dashboard
                        </ModernButton>
                      </Link>
                    )}
                    
                    {/* Profile link */}
                    <Link to="/profile">
                      <ModernButton variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Ver Perfil
                      </ModernButton>
                    </Link>
                    
                    {/* Sign out */}
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}
                    </Button>
                  </>
                ) : (
                  /* Not logged in - mobile auth buttons */
                  <>
                    <Link to="/auth/tasker">
                      <ModernButton variant="accent" className="w-full">
                        Ser Tasker
                      </ModernButton>
                    </Link>
                    <Link to="/auth/user">
                      <ModernButton variant="primary" className="w-full">
                        Iniciar Sesión
                      </ModernButton>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;