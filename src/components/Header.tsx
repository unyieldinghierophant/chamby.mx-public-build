import { ModernButton } from "@/components/ui/modern-button";
import { Menu, X } from "lucide-react";
import { useState } from "react";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="bg-gradient-glass backdrop-blur-glass border-b border-white/20 sticky top-0 z-50 shadow-soft">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
              Chamby.mx
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#servicios" className="text-foreground hover:text-primary transition-colors font-medium relative group">
              Servicios
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-button transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#como-funciona" className="text-foreground hover:text-primary transition-colors font-medium relative group">
              Cómo Funciona
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-button transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#seguridad" className="text-foreground hover:text-primary transition-colors font-medium relative group">
              Seguridad
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-button transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a href="#contacto" className="text-foreground hover:text-primary transition-colors font-medium relative group">
              Contacto
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-button transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center space-x-4">
            <ModernButton variant="glass">
              Iniciar Sesión
            </ModernButton>
            <ModernButton variant="primary">
              Registrarse
            </ModernButton>
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
          <div className="md:hidden border-t border-white/20 bg-gradient-card backdrop-blur-glass">
            <div className="px-2 pt-2 pb-3 space-y-1">
              <a
                href="#servicios"
                className="block px-3 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Servicios
              </a>
              <a
                href="#como-funciona"
                className="block px-3 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Cómo Funciona
              </a>
              <a
                href="#seguridad"
                className="block px-3 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Seguridad
              </a>
              <a
                href="#contacto"
                className="block px-3 py-2 text-foreground hover:text-primary transition-colors"
                onClick={() => setIsMenuOpen(false)}
              >
                Contacto
              </a>
              <div className="flex flex-col space-y-2 px-3 pt-2">
                <ModernButton variant="glass" className="w-full">
                  Iniciar Sesión
                </ModernButton>
                <ModernButton variant="primary" className="w-full">
                  Registrarse
                </ModernButton>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;