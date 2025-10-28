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
    <header className="absolute top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border/40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          {/* Left Side - Logo */}
          <div className="flex items-center">
            <button 
              onClick={() => navigate(getLogoDestination())}
              className="hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img 
                src={chambyLogo} 
                alt="Chamby.mx" 
                className="h-8 md:h-10 w-auto"
              />
            </button>
          </div>

          {/* Center - Primary Action + Navigation Links */}
          <div className="hidden lg:flex items-center gap-6">
            <Link to="/book-job">
              <Button 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full px-8 py-5 text-base font-semibold"
              >
                Publicar tarea
              </Button>
            </Link>
            <Link to="/categories" className="text-foreground/80 hover:text-foreground transition-colors text-base font-medium">
              Categorías
            </Link>
            <Link to="/browse-tasks" className="text-foreground/80 hover:text-foreground transition-colors text-base font-medium">
              Explorar tareas
            </Link>
            <Link to="/how-it-works" className="text-foreground/80 hover:text-foreground transition-colors text-base font-medium">
              Cómo funciona
            </Link>
          </div>

          {/* Right Side - Auth Buttons */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="hidden md:flex items-center gap-4">
                {isTasker && isOnTaskerPage && (
                  <Link to="/tasker-dashboard">
                    <Button variant="ghost" size="sm">
                      Mi Dashboard
                    </Button>
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
            ) : (
              <div className="hidden lg:flex items-center gap-6">
                <Link to="/auth/user" className="text-foreground/80 hover:text-foreground transition-colors text-base font-medium">
                  Registrarse
                </Link>
                <Link to="/auth/user?mode=signin" className="text-foreground/80 hover:text-foreground transition-colors text-base font-medium">
                  Iniciar sesión
                </Link>
                <Link to="/auth/tasker">
                  <Button className="bg-transparent hover:bg-primary/5 text-primary border-none font-semibold text-base">
                    Ser Chambynauta
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-border/40 bg-background">
            <div className="px-4 pt-4 pb-6 space-y-4">
              {user ? (
                <>
                  <div className="flex items-center gap-3 pb-4 border-b border-border/40">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.user_metadata?.avatar_url} />
                      <AvatarFallback>
                        {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium">
                        {user.user_metadata?.full_name || "Usuario"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </div>
                  
                  <Link to="/book-job" className="block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                      Publicar tarea
                    </Button>
                  </Link>
                  
                  {isTasker && isOnTaskerPage && (
                    <Link to="/tasker-dashboard">
                      <Button variant="outline" className="w-full">
                        Mi Dashboard
                      </Button>
                    </Link>
                  )}
                  
                  <Link to="/profile">
                    <Button variant="ghost" className="w-full justify-start">
                      <User className="w-4 h-4 mr-2" />
                      Ver Perfil
                    </Button>
                  </Link>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}
                  </Button>
                </>
              ) : (
                <div className="space-y-3">
                  <Link to="/book-job" className="block">
                    <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">
                      Publicar tarea
                    </Button>
                  </Link>
                  <Link to="/categories" className="block py-3 text-base font-medium text-foreground/80 hover:text-foreground">
                    Categorías
                  </Link>
                  <Link to="/browse-tasks" className="block py-3 text-base font-medium text-foreground/80 hover:text-foreground">
                    Explorar tareas
                  </Link>
                  <Link to="/how-it-works" className="block py-3 text-base font-medium text-foreground/80 hover:text-foreground">
                    Cómo funciona
                  </Link>
                  <div className="pt-4 border-t border-border/40 space-y-3">
                    <Link to="/auth/user" className="block py-2 text-base font-medium text-foreground/80 hover:text-foreground">
                      Registrarse
                    </Link>
                    <Link to="/auth/user?mode=signin" className="block py-2 text-base font-medium text-foreground/80 hover:text-foreground">
                      Iniciar sesión
                    </Link>
                    <Link to="/auth/tasker">
                      <Button className="w-full bg-transparent hover:bg-primary/5 text-primary border-none font-semibold">
                        Ser Chambynauta
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;