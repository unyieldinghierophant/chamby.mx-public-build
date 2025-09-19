import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-chamby-black text-white">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Company Info */}
          <div>
            <h3 className="text-2xl font-bold text-primary mb-4">Chamby.mx</h3>
            <p className="text-gray-300 mb-4 leading-relaxed">
              La plataforma más confiable de México para servicios del hogar. 
              Conectamos profesionales verificados con clientes que necesitan soluciones.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2 text-gray-300">
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
            <ul className="space-y-2 text-gray-300">
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
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-primary" />
                <span>armando@chamby.mx</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-primary" />
                <span>+52 55 1234 5678</span>
              </li>
              <li className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Ciudad de México, México</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-8 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-gray-400 text-sm mb-4 md:mb-0">
              © 2024 Chamby.mx. Todos los derechos reservados.
            </div>
            <div className="flex space-x-6 text-sm text-gray-400">
              <a href="#" className="hover:text-primary transition-colors">Términos de servicio</a>
              <a href="#" className="hover:text-primary transition-colors">Política de privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Política de cookies</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;