import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

const Footer = () => {
  const { isAdmin } = useUserRole();
  const navigate = useNavigate();
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
              <a href="https://www.facebook.com/share/1EqrageV34/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="https://x.com/chambymx?s=11" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a href="https://www.instagram.com/chamby.mx?igsh=MTVyNTd0OHVkenUxNA%3D%3D&utm_source=qr" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="https://www.tiktok.com/@chamby.mx?_r=1&_t=ZS-917ke72A78P" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Servicios</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>
                <button onClick={() => navigate('/book-job', { state: { category: 'Fontanería' }})} className="hover:text-primary transition-colors text-left">
                  Fontanería en Guadalajara
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/book-job', { state: { category: 'Electricidad' }})} className="hover:text-primary transition-colors text-left">
                  Electricistas en Guadalajara
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/book-job', { state: { category: 'Jardinería' }})} className="hover:text-primary transition-colors text-left">
                  Jardinería
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/book-job', { state: { category: 'Limpieza' }})} className="hover:text-primary transition-colors text-left">
                  Limpieza a domicilio
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/book-job', { state: { category: 'Auto y Lavado' }})} className="hover:text-primary transition-colors text-left">
                  Lavado de auto a domicilio
                </button>
              </li>
              <li>
                <button onClick={() => navigate('/book-job', { state: { category: 'Handyman' }})} className="hover:text-primary transition-colors text-left">
                  Handyman y manitas
                </button>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-lg font-semibold mb-4">Compañía</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li><a href="#" className="hover:text-primary transition-colors">Acerca de nosotros</a></li>
              <li><a href="#" className="hover:text-primary transition-colors">Cómo funciona</a></li>
              <li><Link to="/provider/onboarding" className="hover:text-primary transition-colors font-medium">Conviértete en Chambynauta</Link></li>
              <li><a href="/help-center" className="hover:text-primary transition-colors">Centro de ayuda</a></li>
              <li><a href="/blog" className="hover:text-primary transition-colors">Blog</a></li>
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

        {/* SEO: Keyword-rich section for search visibility */}
        <div className="border-t border-border mt-8 pt-6">
          <p className="text-xs text-muted-foreground/60 leading-relaxed max-w-4xl">
            Chamby.mx es la plataforma líder de servicios del hogar en Guadalajara, Jalisco. Ofrecemos fontaneros, electricistas, jardineros, limpieza a domicilio, lavado de auto a domicilio y handyman en zonas como Providencia, Punto Sur, Zona Sur, Andares, Zapopan y toda la zona metropolitana de Guadalajara. Ya sea que busques chamby, chanby, chanbi, chami, chamy, chanvi o chambitas — aquí encuentras al profesional verificado que necesitas. Servicios del hogar confiables: manitas, reparaciones, instalaciones y más.
          </p>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-border mt-4 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-muted-foreground text-sm mb-4 md:mb-0">© 2025 Chamby.mx. Todos los derechos reservados.</div>
            <div className="flex flex-wrap justify-center md:justify-end gap-4 md:gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Términos de servicio</a>
              <a href="#" className="hover:text-primary transition-colors">Política de privacidad</a>
              <a href="#" className="hover:text-primary transition-colors">Política de cookies</a>
              {isAdmin && (
                <Link to="/admin" className="hover:text-primary transition-colors font-medium text-primary/70">
                  Admin
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>;
};
export default Footer;