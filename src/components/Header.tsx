import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { ModernButton } from "@/components/ui/modern-button";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User, Settings, CreditCard, Shield, Plus } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import JobListingForm from "@/components/JobListingForm";
import VerificationOverlay from "@/components/VerificationOverlay";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showJobForm, setShowJobForm] = useState(false);
  const [showVerificationOverlay, setShowVerificationOverlay] = useState(false);
  const { user, signOut } = useAuth();
  const { isVerified, loading: verificationLoading } = useVerificationStatus();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Hide tasker-specific links on main customer landing page
  const isCustomerLandingPage = location.pathname === '/';

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
  };

  const handleListServices = () => {
    if (verificationLoading) return;
    
    if (isVerified) {
      setShowJobForm(true);
    } else {
      setShowVerificationOverlay(true);
    }
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-16 px-8 md:px-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <button 
              onClick={() => navigate('/')}
              className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent hover:opacity-80 transition-opacity cursor-pointer"
            >
              Chamby.mx
            </button>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block flex-1"></div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                {user.user_metadata?.is_tasker && !isCustomerLandingPage && (
                  <>
                    <Link to="/tasker-dashboard">
                      <ModernButton variant="outline" size="sm">
                        Mi Dashboard
                      </ModernButton>
                    </Link>
                  </>
                )}
                
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
                      <Link to="/profile?tab=security" className="flex items-center">
                        <Shield className="w-4 h-4 mr-2" />
                        Seguridad
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=billing" className="flex items-center">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Facturación
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile?tab=settings" className="flex items-center">
                        <Settings className="w-4 h-4 mr-2" />
                        Configuración
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
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
              <>
                <Link to="/auth">
                  <ModernButton variant="outline">
                    Ser Tasker
                  </ModernButton>
                </Link>
                <Link to="/auth">
                  <ModernButton variant="glass">
                    Iniciar Sesión
                  </ModernButton>
                </Link>
                <Link to="/auth">
                  <ModernButton variant="primary">
                    Registrarse
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
                    
                    <Link to="/profile">
                      <ModernButton variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Ver Perfil
                      </ModernButton>
                    </Link>
                    
                    {user.user_metadata?.is_tasker && !isCustomerLandingPage && (
                      <>
                        <Link to="/tasker-dashboard">
                          <ModernButton variant="outline" className="w-full">
                            Mi Dashboard
                          </ModernButton>
                        </Link>
                      </>
                    )}
                    
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
                  <>
                    <Link to="/auth">
                      <ModernButton variant="outline" className="w-full">
                        Ser Tasker
                      </ModernButton>
                    </Link>
                    <Link to="/auth">
                      <ModernButton variant="glass" className="w-full">
                        Iniciar Sesión
                      </ModernButton>
                    </Link>
                    <Link to="/auth">
                      <ModernButton variant="primary" className="w-full">
                        Registrarse
                      </ModernButton>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Listing Dialog */}
      <Dialog open={showJobForm} onOpenChange={setShowJobForm}>
        <DialogContent className="max-w-2xl">
          <JobListingForm 
            onClose={() => setShowJobForm(false)}
            onSuccess={() => {
              setShowJobForm(false);
              // Could add a success toast here
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Verification Overlay */}
      {showVerificationOverlay && (
        <VerificationOverlay onClose={() => setShowVerificationOverlay(false)} />
      )}
    </header>
  );
};

export default Header;