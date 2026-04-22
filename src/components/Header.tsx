import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { Menu, X, LogOut, User, Settings, CreditCard, Users, ShieldCheck } from "lucide-react";
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
  const { role, isAdmin } = useUserRole();
  const { unreadCount, markAllRead } = useAdminNotifications(isAdmin);
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


  return (
    <>
      <AllCategoriesDialog 
        open={categoriesDialogOpen} 
        onOpenChange={setCategoriesDialogOpen} 
      />
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border/40">
        <div className="relative flex h-16 md:h-20 w-full items-center px-4 sm:px-6 lg:px-8">
          {/* Logo - centered on mobile, left-aligned on desktop */}
          <div className="absolute left-1/2 -translate-x-[calc(50%+10px)] lg:static lg:translate-x-0 flex items-center">
            <ChambyLogoText onClick={() => navigate(getLogoDestination())} size="md" />
          </div>

          {/* Right */}
          <div className="ml-auto flex items-center">
            <div className="hidden lg:flex items-center gap-5">
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
              <Link to={ROUTES.HOW_IT_WORKS} className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium whitespace-nowrap">
                Cómo funciona
              </Link>
              <Link to={ROUTES.ABOUT} className="text-foreground/70 hover:text-foreground transition-colors text-sm font-medium whitespace-nowrap">
                Sobre nosotros
              </Link>
              
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
                    {isAdmin && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/admin')}>
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          <span>Panel Admin</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => { markAllRead(); navigate('/admin/console'); }}>
                          <span className="mr-2 flex h-4 w-4 items-center justify-center">⚖️</span>
                          <span className="flex-1">Conflictos</span>
                          {unreadCount > 0 && (
                            <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
                              {unreadCount > 99 ? "99+" : unreadCount}
                            </span>
                          )}
                        </DropdownMenuItem>
                      </>
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
                  <Link to={ROUTES.PROVIDER_LANDING} className="text-primary hover:text-primary/80 transition-colors text-sm font-semibold whitespace-nowrap">
                    Ser Chambynauta
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden">
              <button
                className="p-2 hover:bg-accent rounded-md transition-colors"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
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
                  {isAdmin && (
                    <Link 
                      to="/admin"
                      className="block py-3 text-lg font-medium text-foreground hover:text-primary transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Panel Admin
                    </Link>
                  )}
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
                     to={ROUTES.PROVIDER_LANDING} 
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
      </header>
    </>
  );
};

export default Header;
