import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import Header from "@/components/Header";
import { 
  User, 
  Lock, 
  CreditCard, 
  Settings,
  ArrowRight
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";

const UserProfile = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth/user" replace />;
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Mi Cuenta</h1>
            <p className="text-muted-foreground">Gestiona tu información personal y configuración</p>
          </div>

          {/* User Profile Overview */}
          <Card className="bg-card/95 backdrop-blur-sm shadow-raised mb-8">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                <Avatar className="h-20 w-20 mx-auto md:mx-0">
                  <AvatarImage src={profile?.avatar_url || ''} />
                  <AvatarFallback className="text-lg">
                    {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-center md:text-left space-y-2">
                  <h2 className="text-2xl font-bold">
                    {profile?.full_name || 'Usuario'}
                  </h2>
                  <p className="text-muted-foreground">{user?.email}</p>
                  {profile?.is_tasker && (
                    <Badge 
                      variant={profile.verification_status === 'verified' ? 'default' : 'secondary'}
                      className="mt-2"
                    >
                      {profile.verification_status === 'verified' ? 'Verificado' : 'Pendiente verificación'}
                    </Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Settings Navigation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Link to="/profile/settings">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised hover:shadow-elevated transition-all duration-200 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <User className="w-6 h-6 text-primary" />
                      <span>Configuración del Perfil</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu información personal, foto de perfil y detalles de la cuenta
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/profile/security">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised hover:shadow-elevated transition-all duration-200 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock className="w-6 h-6 text-primary" />
                      <span>Seguridad</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardTitle>
                  <CardDescription>
                    Gestiona tu contraseña, autenticación de dos factores y sesiones activas
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/profile/payments">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised hover:shadow-elevated transition-all duration-200 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-primary" />
                      <span>Métodos de Pago</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardTitle>
                  <CardDescription>
                    Administra tus tarjetas, facturación y historial de transacciones
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>

            <Link to="/profile/general">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised hover:shadow-elevated transition-all duration-200 cursor-pointer group">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Settings className="w-6 h-6 text-primary" />
                      <span>Configuración General</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                  </CardTitle>
                  <CardDescription>
                    Notificaciones, idioma, zona horaria y preferencias de privacidad
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;