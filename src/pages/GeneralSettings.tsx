import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Header from "@/components/Header";
import { Settings, ArrowLeft, Bell, Globe, Trash2, AlertTriangle } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { toast } from 'sonner';

const GeneralSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState({
    newBookings: true,
    reminders: true,
    promotions: false,
    emailDigest: true,
    smsAlerts: false
  });
  const [preferences, setPreferences] = useState({
    language: 'es',
    timezone: 'America/Bogota',
    theme: 'system'
  });

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleNotificationChange = (key: string, value: boolean) => {
    setNotifications(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success("Configuración actualizada");
  };

  const handlePreferenceChange = (key: string, value: string) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    toast.success("Preferencia actualizada");
  };

  const handleDeleteAccount = () => {
    toast.error("Función no disponible aún");
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
            <h1 className="text-3xl font-bold text-foreground mb-2">Configuración General</h1>
            <p className="text-muted-foreground">Personaliza cómo quieres usar la plataforma</p>
          </div>

          <div className="space-y-6">
            {/* Notifications Settings */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notificaciones
                </CardTitle>
                <CardDescription>
                  Configura cómo y cuándo quieres recibir notificaciones
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Notificaciones por Email</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="new-bookings" className="font-medium cursor-pointer">
                          Nuevas reservas
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Cuando alguien reserve tus servicios
                        </p>
                      </div>
                      <Switch
                        id="new-bookings"
                        checked={notifications.newBookings}
                        onCheckedChange={(checked) => handleNotificationChange('newBookings', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="reminders" className="font-medium cursor-pointer">
                          Recordatorios
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Recordatorios de citas próximas
                        </p>
                      </div>
                      <Switch
                        id="reminders"
                        checked={notifications.reminders}
                        onCheckedChange={(checked) => handleNotificationChange('reminders', checked)}
                      />
                    </div>
                    
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="promotions" className="font-medium cursor-pointer">
                          Promociones
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Ofertas especiales y novedades
                        </p>
                      </div>
                      <Switch
                        id="promotions"
                        checked={notifications.promotions}
                        onCheckedChange={(checked) => handleNotificationChange('promotions', checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <Label htmlFor="email-digest" className="font-medium cursor-pointer">
                          Resumen semanal
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Resumen de actividad semanal por email
                        </p>
                      </div>
                      <Switch
                        id="email-digest"
                        checked={notifications.emailDigest}
                        onCheckedChange={(checked) => handleNotificationChange('emailDigest', checked)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Notificaciones SMS</h4>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="sms-alerts" className="font-medium cursor-pointer">
                        Alertas por SMS
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe alertas importantes por mensaje de texto
                      </p>
                    </div>
                    <Switch
                      id="sms-alerts"
                      checked={notifications.smsAlerts}
                      onCheckedChange={(checked) => handleNotificationChange('smsAlerts', checked)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Language and Region Settings */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Idioma y Región
                </CardTitle>
                <CardDescription>
                  Configura tu idioma preferido y zona horaria
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Idioma</Label>
                    <Select
                      value={preferences.language}
                      onValueChange={(value) => handlePreferenceChange('language', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="es">Español</SelectItem>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="pt">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Zona Horaria</Label>
                    <Select
                      value={preferences.timezone}
                      onValueChange={(value) => handlePreferenceChange('timezone', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="America/Bogota">Bogotá (UTC-5)</SelectItem>
                        <SelectItem value="America/Mexico_City">Ciudad de México (UTC-6)</SelectItem>
                        <SelectItem value="America/Lima">Lima (UTC-5)</SelectItem>
                        <SelectItem value="America/Santiago">Santiago (UTC-3)</SelectItem>
                        <SelectItem value="America/Buenos_Aires">Buenos Aires (UTC-3)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Tema</Label>
                  <Select
                    value={preferences.theme}
                    onValueChange={(value) => handlePreferenceChange('theme', value)}
                  >
                    <SelectTrigger className="w-full md:w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="system">Sistema</SelectItem>
                      <SelectItem value="light">Claro</SelectItem>
                      <SelectItem value="dark">Oscuro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Privacy and Data Settings */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Privacidad y Datos
                </CardTitle>
                <CardDescription>
                  Controla cómo se usan tus datos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium cursor-pointer">
                        Perfil público
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Permite que otros vean tu perfil
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium cursor-pointer">
                        Análisis de uso
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Ayuda a mejorar la plataforma con datos anónimos
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>

                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label className="font-medium cursor-pointer">
                        Marketing personalizado
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Recibe ofertas basadas en tus preferencias
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <h4 className="font-medium">Gestión de datos</h4>
                  <div className="flex flex-col space-y-2">
                    <Button variant="outline" className="w-full md:w-auto" onClick={() => navigate('/profile/data-export')}>
                      Descargar mis datos
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Descarga una copia de todos tus datos
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-destructive/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-5 h-5" />
                  Zona de Peligro
                </CardTitle>
                <CardDescription>
                  Acciones irreversibles que afectan tu cuenta
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
                  <div>
                    <h4 className="font-medium text-destructive">Eliminar cuenta</h4>
                    <p className="text-sm text-muted-foreground">
                      Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta y todos tus datos.
                    </p>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="w-4 h-4 mr-2" />
                        Eliminar
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>¿Estás completamente seguro?</DialogTitle>
                        <DialogDescription>
                          Esta acción no se puede deshacer. Se eliminará permanentemente tu cuenta
                          y todos los datos asociados de nuestros servidores.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <Button variant="destructive" onClick={() => navigate('/profile/account-deletion')}>
                          Sí, eliminar mi cuenta
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default GeneralSettings;