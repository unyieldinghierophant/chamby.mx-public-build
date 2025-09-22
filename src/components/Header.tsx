import { ModernButton } from "@/components/ui/modern-button";
import { Button } from "@/components/ui/button";
import { Menu, X, LogOut, User } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut();
    setIsLoggingOut(false);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-50 bg-transparent backdrop-blur-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 md:h-16 px-8 md:px-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Chamby.mx
            </h1>
          </div>

          {/* Spacer for desktop */}
          <div className="hidden md:block flex-1"></div>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm font-medium text-primary">
                  {user.user_metadata?.full_name || user.email}
                </span>
                {user.user_metadata?.is_tasker && (
                  <>
                    <Link to="/dashboard">
                      <ModernButton variant="outline" size="sm">
                        Mi Dashboard
                      </ModernButton>
                    </Link>
                    <Link to="/tasker-onboarding">
                      <ModernButton variant="outline" size="sm">
                        Completar Perfil
                      </ModernButton>
                    </Link>
                  </>
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleSignOut}
                  disabled={isLoggingOut}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {isLoggingOut ? 'Saliendo...' : 'Salir'}
                </Button>
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
                    <div className="text-center py-2">
                      <span className="text-sm font-medium text-primary">
                        {user.user_metadata?.full_name || user.email}
                      </span>
                    </div>
                    {user.user_metadata?.is_tasker && (
                      <>
                        <Link to="/dashboard">
                          <ModernButton variant="outline" className="w-full">
                            Mi Dashboard
                          </ModernButton>
                        </Link>
                        <Link to="/tasker-onboarding">
                          <ModernButton variant="outline" className="w-full">
                            Completar Perfil
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
                      {isLoggingOut ? 'Saliendo...' : 'Salir'}
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
    </header>
  );
};

export default Header;