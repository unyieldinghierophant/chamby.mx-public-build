import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import { useToast } from "@/hooks/use-toast";
import { Camera, Trash2, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const ProviderProfileEdit = () => {
  const { user, signOut } = useAuth();
  const { profile, updateProfile, refetch } = useProviderProfile(user?.id);
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    bio: profile?.bio || "",
  });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // Update form data when profile loads
  useEffect(() => {
    if (profile) {
      setFormData({
        full_name: profile.full_name || "",
        phone: profile.phone || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Error",
        description: "Por favor selecciona una imagen válida",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar los 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploadingAvatar(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/avatar.${fileExt}`;

      // Upload to storage bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { 
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      // Add cache-busting query param
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      // Update providers table with avatar URL
      const { error: updateError } = await supabase
        .from('providers')
        .update({ avatar_url: avatarUrl })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Also update users table
      await supabase
        .from('users')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      // Refetch profile to get updated avatar
      await refetch();

      toast({
        title: "Foto actualizada",
        description: "Tu foto de perfil se ha actualizado correctamente",
      });
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploadingAvatar(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      await updateProfile(formData);
      toast({
        title: "Perfil actualizado",
        description: "Tus cambios se han guardado exitosamente",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudieron guardar los cambios",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;
    
    setDeleting(true);
    try {
      // Delete user account
      const { error } = await supabase.rpc('delete_user_account', {
        user_id: user.id
      });

      if (error) throw error;

      toast({
        title: "Cuenta eliminada",
        description: "Tu cuenta ha sido eliminada exitosamente",
      });

      // Sign out and redirect
      await signOut();
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar la cuenta",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6 max-w-2xl">
      <div className="relative animate-fade-in">
        <div className="absolute -top-4 -left-4 w-24 h-24 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-accent/10 rounded-full blur-3xl animate-pulse delay-75" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">Mi Perfil</h1>
            <Sparkles className="h-6 w-6 text-primary animate-pulse" />
          </div>
          <p className="text-muted-foreground">
            Actualiza tu información personal y preferencias
          </p>
        </div>
      </div>

      <Card className="animate-scale-in overflow-hidden border-primary/10 hover:border-primary/20 transition-all duration-300">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/5 to-transparent rounded-full blur-3xl" />
        <CardHeader className="relative">
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            Foto de Perfil
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-6 relative">
          <div className="relative group cursor-pointer" onClick={handleAvatarClick}>
            <Avatar className="h-24 w-24 ring-4 ring-primary/10 group-hover:ring-primary/20 transition-all duration-300">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback className="text-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground">
                {profile?.full_name?.charAt(0) || "P"}
              </AvatarFallback>
            </Avatar>
            <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
              {uploadingAvatar ? (
                <Loader2 className="h-6 w-6 text-white animate-spin" />
              ) : (
                <Camera className="h-6 w-6 text-white" />
              )}
            </div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarUpload}
            disabled={uploadingAvatar}
          />
          <Button 
            variant="outline" 
            size="sm" 
            className="hover-scale"
            onClick={handleAvatarClick}
            disabled={uploadingAvatar}
          >
            {uploadingAvatar ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Subiendo...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                Cambiar Foto
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="animate-scale-in delay-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
        <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-accent/5 to-transparent rounded-full blur-3xl" />
        <CardHeader className="relative">
          <CardTitle>Información Personal</CardTitle>
        </CardHeader>
        <CardContent className="relative">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2 animate-fade-in">
              <Label htmlFor="full_name" className="text-sm font-medium">
                Nombre Completo
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                placeholder="Tu nombre completo"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2 animate-fade-in delay-75">
              <Label htmlFor="phone" className="text-sm font-medium">
                Teléfono
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Número de teléfono"
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20"
              />
            </div>

            <div className="space-y-2 animate-fade-in delay-100">
              <Label htmlFor="bio" className="text-sm font-medium">
                Biografía
              </Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                placeholder="Cuéntanos sobre ti y tu experiencia"
                rows={4}
                className="transition-all duration-200 focus:ring-2 focus:ring-primary/20 resize-none"
              />
            </div>

            <Button 
              type="submit" 
              disabled={saving}
              className="w-full hover-scale bg-gradient-to-r from-primary to-primary/90"
            >
              {saving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="animate-scale-in delay-150 border-destructive/20 hover:border-destructive/40 transition-all duration-300">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zona de Peligro
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Una vez que elimines tu cuenta, no hay vuelta atrás. Por favor, asegúrate de que realmente quieres hacer esto.
          </p>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button 
                variant="destructive" 
                className="w-full hover-scale"
                disabled={deleting}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleting ? "Eliminando..." : "Eliminar Cuenta Permanentemente"}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                  ¿Estás absolutamente seguro?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer. Esto eliminará permanentemente tu cuenta y todos tus datos de nuestros servidores.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteAccount}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Sí, eliminar mi cuenta
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProviderProfileEdit;
