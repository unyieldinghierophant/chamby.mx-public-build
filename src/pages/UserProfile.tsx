import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import Header from "@/components/Header";
import { 
  User, 
  Lock, 
  CreditCard, 
  Calendar,
  Camera,
  Save,
  AlertTriangle,
  Bell,
  Trash2
} from "lucide-react";
import { useSearchParams, Navigate } from "react-router-dom";
import { toast } from 'sonner';

const UserProfile = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    bio: '',
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    try {
      const result = await updateProfile(formData);
      if (result?.error) {
        toast.error("No se pudo actualizar el perfil");
      } else {
        toast.success("Perfil actualizado correctamente");
        setIsEditing(false);
      }
    } catch (error) {
      toast.error("Ocurrió un error inesperado");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
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

          <Tabs value={activeTab} className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-card/95 backdrop-blur-sm shadow-raised">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span>Seguridad</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>Pagos</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span>Config</span>
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Información Personal
                  </CardTitle>
                  <CardDescription>
                    Actualiza tu información personal y foto de perfil
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Avatar Section */}
                  <div className="flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
                    <Avatar className="h-24 w-24 mx-auto md:mx-0">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="text-xl">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-center md:text-left space-y-2">
                      <Button variant="outline" size="sm">
                        <Camera className="w-4 h-4 mr-2" />
                        Cambiar Foto
                      </Button>
                      <p className="text-sm text-muted-foreground">
                        JPG, PNG o GIF. Máximo 2MB.
                      </p>
                    </div>
                  </div>

                  <Separator />

                  {/* Form Fields */}
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Nombre Completo</Label>
                        <Input
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Tu nombre completo"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="phone">Teléfono</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          disabled={!isEditing}
                          placeholder="Tu número de teléfono"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        value={user.email || ''}
                        disabled
                        className="bg-muted"
                      />
                      <p className="text-sm text-muted-foreground">
                        El email no se puede cambiar desde aquí
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="bio">Acerca de ti</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                        placeholder="Cuéntanos un poco sobre ti..."
                      />
                    </div>

                    {profile?.is_tasker && (
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label>Estado de Verificación</Label>
                            <p className="text-sm text-muted-foreground">
                              {profile.verification_status === 'verified' 
                                ? 'Tu cuenta está verificada' 
                                : 'Verificación pendiente'
                              }
                            </p>
                          </div>
                          <Badge 
                            variant={profile.verification_status === 'verified' ? 'default' : 'secondary'}
                            className="ml-2"
                          >
                            {profile.verification_status === 'verified' ? 'Verificado' : 'Pendiente'}
                          </Badge>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col md:flex-row justify-end space-y-2 md:space-y-0 md:space-x-2 pt-4">
                    {isEditing ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            if (profile) {
                              setFormData({
                                full_name: profile.full_name || '',
                                phone: profile.phone || '',
                                bio: profile.bio || '',
                              });
                            }
                          }}
                          className="w-full md:w-auto"
                        >
                          Cancelar
                        </Button>
                        <Button 
                          onClick={handleSave} 
                          disabled={isSaving}
                          className="w-full md:w-auto"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                      </>
                    ) : (
                      <Button 
                        onClick={() => setIsEditing(true)}
                        className="w-full md:w-auto"
                      >
                        Editar Perfil
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Security Tab */}
            <TabsContent value="security" className="space-y-6">
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
                      <Button variant="outline">Cambiar</Button>
                    </div>
                    
                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Autenticación de Dos Factores</h4>
                        <p className="text-sm text-muted-foreground">
                          Agrega una capa extra de seguridad
                        </p>
                      </div>
                      <Button variant="outline">Configurar</Button>
                    </div>

                    <div className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">Sesiones Activas</h4>
                        <p className="text-sm text-muted-foreground">
                          Revisa dónde has iniciado sesión
                        </p>
                      </div>
                      <Button variant="outline">Ver Sesiones</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Billing Tab */}
            <TabsContent value="billing" className="space-y-6">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Métodos de Pago
                  </CardTitle>
                  <CardDescription>
                    Gestiona tus métodos de pago y historial de transacciones
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center py-8">
                    <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No hay métodos de pago</h3>
                    <p className="text-muted-foreground mb-4">
                      Agrega una tarjeta o método de pago para comenzar
                    </p>
                    <Button>Agregar Método de Pago</Button>
                  </div>
                  
                  {profile?.is_tasker && (
                    <>
                      <Separator />
                      <div className="space-y-4">
                        <h4 className="font-medium">Información de Facturación</h4>
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="font-medium mb-1">Ganancias Este Mes</p>
                            <p className="text-2xl font-bold text-primary">$0</p>
                          </div>
                          <div className="p-4 bg-muted/50 rounded-lg">
                            <p className="font-medium mb-1">Total Disponible</p>
                            <p className="text-2xl font-bold text-green-600">$0</p>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Configuración y Notificaciones
                  </CardTitle>
                  <CardDescription>
                    Personaliza cómo quieres usar la plataforma
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <h4 className="font-medium">Notificaciones por Email</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Nuevas reservas</p>
                          <p className="text-sm text-muted-foreground">Cuando alguien reserve tus servicios</p>
                        </div>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Recordatorios</p>
                          <p className="text-sm text-muted-foreground">Recordatorios de citas próximas</p>
                        </div>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Promociones</p>
                          <p className="text-sm text-muted-foreground">Ofertas especiales y novedades</p>
                        </div>
                        <input type="checkbox" className="rounded" />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Preferencias de Privacidad</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Perfil público</p>
                          <p className="text-sm text-muted-foreground">Permite que otros vean tu perfil</p>
                        </div>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                      
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">Mostrar calificaciones</p>
                          <p className="text-sm text-muted-foreground">Mostrar tus calificaciones públicamente</p>
                        </div>
                        <input type="checkbox" className="rounded" defaultChecked />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Danger Zone */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-destructive flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Zona de Peligro
                    </h4>
                    <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Eliminar Cuenta</p>
                          <p className="text-sm text-muted-foreground">
                            Esta acción no se puede deshacer
                          </p>
                        </div>
                        <Button variant="destructive" size="sm">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default UserProfile;