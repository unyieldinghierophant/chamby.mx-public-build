import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";
const Footer = () => {
  return <footer className="bg-muted/30 text-foreground border-t">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">Chamby.mx</h3>
            <p className="text-muted-foreground mb-4 leading-relaxed">
              La plataforma más confiable de México para servicios del hogar. 
              Conectamos profesionales verificados con clientes que necesitan soluciones.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Limpieza del hogar</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Reparaciones</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Jardinería</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Pintura</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Instalaciones</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Compañía</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Acerca de nosotros</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cómo funciona</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Ser profesional</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Centro de ayuda</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Blog</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Contacto</h4>
            <ul className="space-y-3 text-muted-foreground">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>armando@chamby.mx</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+52 33 2543 8136</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Guadalajara, México</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground text-sm mb-4 md:mb-0">© 2025 Chamby.mx. Todos los derechos reservados.</div>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Términos de servicio</a>
              <a href="#" className="hover:text-primary transition-colors">Política de privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Política de cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;