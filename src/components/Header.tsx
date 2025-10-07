import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ModernButton } from "@/components/ui/modern-button";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, Settings, CreditCard, Shield, Users } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import chambyLogo from "@/assets/chamby-logo.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const Header = () => {
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
        <div className="flex items-center justify-between h-24 md:h-20 px-4 md:px-16 pt-[5%] md:pt-[10%]">
          {/* Logo */}
          <div className="flex-shrink-0">
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

          {/* Spacer for desktop */}
          <div className="hidden md:block flex-1"></div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {/* Dashboard Link for Taskers only */}
                {isTasker && isOnTaskerPage && (
                  <Link to="/tasker-dashboard">
                    <ModernButton variant="outline" size="sm">
                      Mi Dashboard
                    </ModernButton>
                  </Link>
                )}
                
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="glass" size="sm" className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.user_metadata?.avatar_url} />
                        <AvatarFallback className="text-xs">
                          {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">
                        {user.user_metadata?.full_name || user.email}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-md border-border/50">
                    <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="flex items-center">
                        <User className="w-4 h-4 mr-2" />
                        Ver Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile/security" className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Seguridad
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile/payments" className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Facturación
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile/general" className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {/* Vista de Usuario para Providers */}
                    {isTasker && isOnTaskerPage && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link to="/user-landing" className="flex items-center">
                            <Users className="w-4 h-4 mr-2" />
                            Vista de Cliente
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem 
                      onClick={handleSignOut}
                      disabled={isLoggingOut}
                      className="text-destructive focus:text-destructive"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      {isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              /* Not logged in - show auth buttons */
              <>
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
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <ModernButton
              variant="glass"
              size="icon"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </ModernButton>
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