import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import MobileBottomNav from "@/components/MobileBottomNav";
import Header from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ModernButton } from "@/components/ui/modern-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  User, 
  CreditCard, 
  Settings, 
  HelpCircle, 
  Shield, 
  Bell, 
  Receipt, 
  AlertTriangle,
  ChevronRight,
  LogOut,
  Phone,
  Mail
} from "lucide-react";
import { Link } from "react-router-dom";
import { ProfileCardSkeleton, MenuSectionSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

const MobileProfile = () => {
  const { user, signOut, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  const isLoading = authLoading || profileLoading;

  const menuSections = [
    {
      title: "Cuenta",
      items: [
        {
          icon: User,
          label: "Editar Perfil",
          href: "/profile/settings",
          description: "Información personal"
        },
        {
          icon: Shield,
          label: "Seguridad",
          href: "/profile/security", 
          description: "Contraseña y privacidad"
        },
        {
          icon: Bell,
          label: "Notificaciones",
          href: "/profile/general",
          description: "Preferencias de comunicación"
        }
      ]
    },
    {
      title: "Pagos & Facturación",
      items: [
        {
          icon: CreditCard,
          label: "Métodos de Pago",
          href: "/profile/payments",
          description: "Tarjetas y billeteras"
        },
        {
          icon: Receipt,
          label: "Historial de Pagos",
          href: "/profile/payments",
          description: "Recibos y facturas"
        }
      ]
    },
    {
      title: "Soporte",
      items: [
        {
          icon: HelpCircle,
          label: "Centro de Ayuda",
          href: "/help",
          description: "Preguntas frecuentes"
        },
        {
          icon: AlertTriangle,
          label: "Centro de Disputas",
          href: "/disputes",
          description: "Resolver problemas con servicios"
        },
        {
          icon: Phone,
          label: "Contactar Soporte",
          href: "/contact",
          description: "Habla con nuestro equipo"
        }
      ]
    }
  ];

  if (!user && !authLoading) {
    return (
      <div className="min-h-screen bg-gradient-main flex items-center justify-center pb-20">
        <div className="text-center p-8">
          <h2 className="text-xl font-semibold mb-4">Inicia sesión para ver tu perfil</h2>
          <ModernButton variant="primary" onClick={() => window.location.href = "/auth"}>
            Iniciar Sesión
          </ModernButton>
        </div>
        <MobileBottomNav />
      </div>
    );
  }

  if (isLoading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-main pb-20 pt-32">
          <div className="bg-gradient-glass backdrop-blur-glass border-b border-white/20 sticky top-32 z-40">
            <div className="p-4">
              <Skeleton className="h-7 w-28" />
            </div>
          </div>
          <div className="p-4 space-y-6">
            <ProfileCardSkeleton />
            <MenuSectionSkeleton itemCount={3} />
            <MenuSectionSkeleton itemCount={2} />
            <MenuSectionSkeleton itemCount={3} />
          </div>
        </div>
        <MobileBottomNav />
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-main pb-20 pt-32">
        {/* Header */}
        <div className="bg-gradient-glass backdrop-blur-glass border-b border-white/20 sticky top-32 z-40">
          <div className="p-4">
            <h1 className="text-xl font-bold text-foreground">Mi Perfil</h1>
          </div>
        </div>

      {/* Profile Info */}
      <div className="p-4">
        <Card className="bg-gradient-card shadow-raised border-0 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center space-x-4">
              <Avatar className="h-16 w-16 border-4 border-white/50">
                <AvatarImage src={user.user_metadata?.avatar_url} />
                <AvatarFallback className="text-lg font-semibold">
                  {(user.user_metadata?.full_name || user.email || "U").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-foreground">
                  {user.user_metadata?.full_name || "Usuario"}
                </h2>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{user.email}</span>
                  </div>
                  {profile?.phone && (
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                      <Phone className="h-3 w-3" />
                      <span>{profile.phone}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Menu Sections */}
        <div className="space-y-6">
          {menuSections.map((section, sectionIndex) => (
            <div key={sectionIndex}>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                {section.title}
              </h3>
              <Card className="bg-gradient-card shadow-raised border-0">
                <CardContent className="p-0">
                  {section.items.map((item, itemIndex) => {
                    const IconComponent = item.icon;
                    return (
                      <Link
                        key={itemIndex}
                        to={item.href}
                        className="flex items-center justify-between p-4 hover:bg-white/10 transition-colors border-b border-white/10 last:border-b-0"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-glass rounded-xl flex items-center justify-center">
                            <IconComponent className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground text-sm">
                              {item.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.description}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>

        {/* Quick Stats */}
        <Card className="bg-gradient-card shadow-raised border-0 mt-6">
          <CardHeader>
            <CardTitle className="text-base">Estadísticas</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">3</div>
              <div className="text-xs text-muted-foreground">Servicios Completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">4.9★</div>
              <div className="text-xs text-muted-foreground">Tu Calificación</div>
            </div>
          </CardContent>
        </Card>

        {/* Sign Out */}
        <Card className="bg-gradient-card shadow-raised border-0 mt-6">
          <CardContent className="p-0">
            <button
              onClick={signOut}
              className="w-full flex items-center justify-center space-x-2 p-4 text-destructive hover:bg-destructive/10 transition-colors rounded-lg"
            >
              <LogOut className="h-4 w-4" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
    </>
  );
};

export default MobileProfile;