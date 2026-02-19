import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Header from "@/components/Header";
import { Lock, ArrowLeft, Eye, EyeOff, Shield, Activity } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { useSecurityMonitoring } from "@/hooks/useSecurityMonitoring";
import SecurityAlert from "@/components/SecurityAlert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

const SecuritySettings = () => {
  const { user } = useAuth();
  const { recentActivity, loading: activityLoading, error: activityError } = useSecurityMonitoring();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const getActionColor = (action: string) => {
    switch (action) {
      case 'INSERT': return 'default';
      case 'UPDATE': return 'secondary';
      case 'DELETE': return 'destructive';
      default: return 'outline';
    }
  };

  if (!user) {
    return <Navigate to="/auth/user" replace />;
  }
  const handlePasswordChange = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Las nuevas contraseñas no coinciden");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("La nueva contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword
      });

      if (error) throw error;

      toast.success("Contraseña actualizada correctamente");
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      toast.error(error.message || "Error al cambiar la contraseña");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetPassword = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email!, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) throw error;

      toast.success("Se ha enviado un enlace de restablecimiento a tu email");
    } catch (error: any) {
      toast.error(error.message || "Error al enviar el enlace de restablecimiento");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <Link to="/profile" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Volver a Mi Cuenta
            </Link>
            <h1 className="text-3xl font-bold text-foreground mb-2">Configuración de Seguridad</h1>
            <p className="text-muted-foreground">Gestiona tu contraseña y configuración de seguridad</p>
          </div>

          <div className="space-y-6">
            <SecurityAlert title="Estado de Seguridad">
              Tu cuenta está protegida con auditoría de acciones, limitación de intentos y 
              políticas de acceso avanzadas.
            </SecurityAlert>
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Seguridad de la Cuenta
                </CardTitle>
                <CardDescription>
                  Gestiona tu contraseña y configuración de seguridad
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Contraseña</h4>
                      <p className="text-sm text-muted-foreground">
                        Cambia tu contraseña regularmente por seguridad
                      </p>
                    </div>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline">Cambiar</Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Cambiar Contraseña</DialogTitle>
                          <DialogDescription>
                            Ingresa tu nueva contraseña. Debe tener al menos 6 caracteres.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="new-password">Nueva Contraseña</Label>
                            <div className="relative">
                              <Input
                                id="new-password"
                                type={showNewPassword ? "text" : "password"}
                                value={passwordForm.newPassword}
                                onChange={(e) => setPasswordForm({...passwordForm, newPassword: e.target.value})}
                                placeholder="Ingresa tu nueva contraseña"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                              >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                            <div className="relative">
                              <Input
                                id="confirm-password"
                                type={showConfirmPassword ? "text" : "password"}
                                value={passwordForm.confirmPassword}
                                onChange={(e) => setPasswordForm({...passwordForm, confirmPassword: e.target.value})}
                                placeholder="Confirma tu nueva contraseña"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                              >
                                {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </Button>
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            onClick={handlePasswordChange}
                            disabled={isChangingPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
                          >
                            {isChangingPassword ? "Cambiando..." : "Cambiar Contraseña"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Restablecer Contraseña por Email</h4>
                      <p className="text-sm text-muted-foreground">
                        Recibe un enlace para cambiar tu contraseña
                      </p>
                    </div>
                    <Button variant="outline" onClick={handleResetPassword}>
                      Enviar Enlace
                    </Button>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">Actividad de Seguridad</h4>
                      <p className="text-sm text-muted-foreground">
                        Monitorea las acciones realizadas en tu cuenta
                      </p>
                    </div>
                    <Badge variant="default">
                      <Activity className="w-3 h-3 mr-1" />
                      Activo
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Registro de Actividad
                </CardTitle>
                <CardDescription>
                  Últimas acciones de seguridad en tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activityLoading && (
                  <div className="space-y-3 py-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Skeleton className="h-5 w-16 rounded" />
                          <Skeleton className="h-4 w-20" />
                        </div>
                        <Skeleton className="h-3 w-28" />
                      </div>
                    ))}
                  </div>
                )}

                {activityError && (
                  <SecurityAlert variant="destructive">
                    Error al cargar la actividad: {activityError}
                  </SecurityAlert>
                )}

                {!activityLoading && !activityError && recentActivity.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No hay actividad reciente registrada
                  </p>
                )}

                {!activityLoading && !activityError && recentActivity.length > 0 && (
                  <div className="space-y-3">
                    {recentActivity.map((event, index) => (
                      <div key={event.id}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Badge variant={getActionColor(event.action)}>
                              {event.action}
                            </Badge>
                            <span className="text-sm font-medium capitalize">
                              {event.table_name}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {new Date(event.created_at).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        {index < recentActivity.length - 1 && <Separator className="mt-3" />}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle>Configuración Pendiente</CardTitle>
                <CardDescription>
                  Ajustes adicionales de seguridad recomendados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityAlert variant="default" title="Protección contra Contraseñas Filtradas">
                  Para completar la configuración de seguridad, habilita la protección contra 
                  contraseñas filtradas en el panel de Supabase: Authentication → Settings → Password Security.
                </SecurityAlert>

                <div className="mt-4 space-y-4">
                  <div className="flex items-center justify-between p-4 border rounded-lg opacity-50">
                    <div>
                      <h4 className="font-medium">Autenticación de Dos Factores</h4>
                      <p className="text-sm text-muted-foreground">
                        Próximamente - Agrega una capa extra de seguridad
                      </p>
                    </div>
                    <Button variant="outline" disabled>Próximamente</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SecuritySettings;