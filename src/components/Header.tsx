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
        <div className="flex items-center justify-center h-16 md:h-20 relative">
          {/* Logo - Absolute left */}
          <div className="absolute left-0 flex items-center">
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

          {/* Center - All Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <Link to="/book-job">
              <span className="bg-primary hover:bg-primary/90 text-white rounded-full px-8 py-3 text-base font-semibold inline-block transition-colors cursor-pointer">
                Publicar tarea
              </span>
            </Link>
            <Link to="/categories" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
              Categorías
            </Link>
            <Link to="/browse-tasks" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
              Explorar tareas
            </Link>
            <Link to="/how-it-works" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
              Cómo funciona
            </Link>
            
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
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/profile/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configuración</span>
                  </DropdownMenuItem>
                  {isTasker && (
                    <DropdownMenuItem onClick={() => navigate("/tasker-dashboard")}>
                      <Users className="mr-2 h-4 w-4" />
                      <span>Dashboard</span>
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
                <Link to="/auth/user" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
                  Registrarse
                </Link>
                <Link to="/auth/user?mode=signin" className="text-foreground/70 hover:text-foreground transition-colors text-base font-normal">
                  Iniciar sesión
                </Link>
                <Link to="/auth/tasker" className="text-primary hover:text-primary/80 transition-colors text-base font-semibold">
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
            <div className="px-4 pt-4 pb-6 space-y-4">
              <Link to="/book-job" className="block">
                <span className="w-full bg-primary hover:bg-primary/90 text-white rounded-full px-6 py-3 text-base font-semibold inline-block text-center">
                  Publicar tarea
                </span>
              </Link>
              <Link to="/categories" className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                Categorías
              </Link>
              <Link to="/browse-tasks" className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                Explorar tareas
              </Link>
              <Link to="/how-it-works" className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                Cómo funciona
              </Link>
              
              {user ? (
                <>
                  <div className="flex items-center gap-3 pt-4 pb-2 border-t border-border/40">
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
                  <Link to="/profile" className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                    Ver Perfil
                  </Link>
                  {isTasker && (
                    <Link to="/tasker-dashboard" className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                      Dashboard
                    </Link>
                  )}
                  <button 
                    className="block w-full text-left py-2 text-base font-normal text-foreground/70 hover:text-foreground"
                    onClick={handleSignOut}
                    disabled={isLoggingOut}
                  >
                    {isLoggingOut ? 'Saliendo...' : 'Cerrar Sesión'}
                  </button>
                </>
              ) : (
                <div className="pt-4 border-t border-border/40 space-y-2">
                  <Link to="/auth/user" className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                    Registrarse
                  </Link>
                  <Link to="/auth/user?mode=signin" className="block py-2 text-base font-normal text-foreground/70 hover:text-foreground">
                    Iniciar sesión
                  </Link>
                  <Link to="/auth/tasker" className="block py-2 text-base font-semibold text-primary hover:text-primary/80">
                    Ser Chambynauta
                  </Link>
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