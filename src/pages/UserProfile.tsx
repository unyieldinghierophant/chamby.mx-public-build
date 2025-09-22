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
  Shield, 
  Bell, 
  CreditCard, 
  Calendar,
  Building,
  Wallet,
  Receipt,
  Trash2,
  Camera,
  Save,
  AlertTriangle
} from "lucide-react";
import { useSearchParams, Navigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";

const UserProfile = () => {
  const { user } = useAuth();
  const { profile, loading, updateProfile } = useProfile();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'profile';
  const { toast } = useToast();
  
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
        toast({
          title: "Error",
          description: "No se pudo actualizar el perfil",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Perfil actualizado",
          description: "Los cambios se guardaron correctamente",
        });
        setIsEditing(false);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "destructive",
      });
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
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Mi Cuenta</h1>
            <p className="text-muted-foreground">Gestiona tu información personal y configuración</p>
          </div>

          <Tabs value={activeTab} className="space-y-6">
            <TabsList className="grid grid-cols-4 lg:grid-cols-9 w-full bg-background/60 backdrop-blur-sm border border-border/50">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Perfil</span>
              </TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                <span className="hidden sm:inline">Seguridad</span>
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notificaciones</span>
              </TabsTrigger>
              <TabsTrigger value="billing" className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span className="hidden sm:inline">Facturación</span>
              </TabsTrigger>
              <TabsTrigger value="tasks" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span className="hidden sm:inline">Tareas</span>
              </TabsTrigger>
              <TabsTrigger value="business" className="flex items-center gap-2">
                <Building className="w-4 h-4" />
                <span className="hidden sm:inline">Negocio</span>
              </TabsTrigger>
              <TabsTrigger value="balance" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                <span className="hidden sm:inline">Balance</span>
              </TabsTrigger>
              <TabsTrigger value="transactions" className="flex items-center gap-2">
                <Receipt className="w-4 h-4" />
                <span className="hidden sm:inline">Transacciones</span>
              </TabsTrigger>
              <TabsTrigger value="danger" className="flex items-center gap-2 text-destructive">
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Eliminar</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
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
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profile?.avatar_url || ''} />
                      <AvatarFallback className="text-lg">
                        {profile?.full_name ? getInitials(profile.full_name) : 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-2">
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
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="full_name">Nombre Completo</Label>
                      <Input
                        id="full_name"
                        value={formData.full_name}
                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="grid gap-2">
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
                    
                    <div className="grid gap-2">
                      <Label htmlFor="phone">Teléfono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        disabled={!isEditing}
                      />
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="bio">Biografía</Label>
                      <Textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        disabled={!isEditing}
                        rows={3}
                      />
                    </div>

                    {profile?.is_tasker && (
                      <div className="grid gap-2">
                        <Label>Estado de Verificación</Label>
                        <Badge variant={profile.verification_status === 'verified' ? 'default' : 'secondary'}>
                          {profile.verification_status === 'verified' ? 'Verificado' : 'Pendiente'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
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
                        >
                          Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                          <Save className="w-4 h-4 mr-2" />
                          {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setIsEditing(true)}>
                        Editar Perfil
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
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
                          Última actualización: hace 30 días
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
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5" />
                    Notificaciones
                  </CardTitle>
                  <CardDescription>
                    Configura cómo y cuándo quieres recibir notificaciones
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Configuración de notificaciones próximamente...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Información de Facturación
                  </CardTitle>
                  <CardDescription>
                    Gestiona tus métodos de pago y facturación
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Información de facturación próximamente...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tasks" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Cancelar una Tarea
                  </CardTitle>
                  <CardDescription>
                    Cancela tareas programadas si es necesario
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Gestión de tareas próximamente...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="w-5 h-5" />
                    Información del Negocio
                  </CardTitle>
                  <CardDescription>
                    Información fiscal y de empresa (solo para taskers)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {profile?.is_tasker ? (
                    <p className="text-muted-foreground">Información del negocio próximamente...</p>
                  ) : (
                    <p className="text-muted-foreground">Esta sección es solo para taskers.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="balance" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wallet className="w-5 h-5" />
                    Balance de la Cuenta
                  </CardTitle>
                  <CardDescription>
                    Revisa tu balance actual y retiros
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Balance de cuenta próximamente...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="transactions" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Receipt className="w-5 h-5" />
                    Historial de Transacciones
                  </CardTitle>
                  <CardDescription>
                    Revisa todas tus transacciones y pagos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Historial de transacciones próximamente...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="danger" className="space-y-6">
              <Card className="bg-background/60 backdrop-blur-sm border-border/50 border-destructive/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-destructive">
                    <AlertTriangle className="w-5 h-5" />
                    Zona de Peligro
                  </CardTitle>
                  <CardDescription>
                    Acciones irreversibles para tu cuenta
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                    <h4 className="font-medium text-destructive mb-2">Eliminar Cuenta</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Esta acción no se puede deshacer. Se eliminarán permanentemente todos tus datos.
                    </p>
                    <Button variant="destructive" size="sm">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Eliminar mi cuenta
                    </Button>
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