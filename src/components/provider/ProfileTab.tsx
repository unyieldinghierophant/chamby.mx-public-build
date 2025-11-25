import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RatingDisplay } from "@/components/provider/RatingDisplay";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Camera, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

  interface ProfileData {
    full_name: string;
    phone: string;
    bio: string;
    display_name: string;
    specialty: string;
    zone_served: string;
    avatar_url: string;
    verified: boolean;
    rating: number;
    total_reviews: number;
  }

export const ProfileTab = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profile, setProfile] = useState<ProfileData>({
    full_name: "",
    phone: "",
    bio: "",
    display_name: "",
    specialty: "",
    zone_served: "",
    avatar_url: "",
    verified: false,
    rating: 0,
    total_reviews: 0,
  });

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { data: baseProfile, error: baseError } = await supabase
        .from('users')
        .select('full_name, phone, bio')
        .eq('id', user.id)
        .single();

      if (baseError) throw baseError;

      const { data: providerProfile, error: providerError} = await supabase
        .from('providers')
        .select('display_name, specialty, zone_served, rating, total_reviews, avatar_url, verified')
        .eq('user_id', user.id)
        .single();

      if (providerError) throw providerError;

      if (baseProfile && providerProfile) {
        setProfile({
          ...baseProfile,
          display_name: providerProfile.display_name || baseProfile.full_name || '',
          specialty: providerProfile.specialty || '',
          zone_served: providerProfile.zone_served || '',
          avatar_url: providerProfile.avatar_url || '',
          verified: providerProfile.verified || false,
          rating: providerProfile.rating || 0,
          total_reviews: providerProfile.total_reviews || 0,
        });
      }
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast({
        title: "Error",
        description: "Por favor sube una imagen válida",
        variant: "destructive",
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Error",
        description: "La imagen no debe superar 5MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/face-photo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("provider-photos")
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: signedUrlData, error: urlError } = await supabase.storage
        .from("provider-photos")
        .createSignedUrl(fileName, 31536000);

      if (urlError) throw urlError;

      const { error: updateError } = await supabase
        .from("providers")
        .update({
          avatar_url: signedUrlData.signedUrl,
          verified: false,
        })
        .eq("user_id", user.id);

      if (updateError) throw updateError;

      // Also update verification status in provider_details
      await supabase
        .from('provider_details')
        .update({ verification_status: 'pending' })
        .eq('user_id', user.id);

      setProfile((prev) => ({
        ...prev,
        avatar_url: signedUrlData.signedUrl,
        verified: false,
      }));

      toast({
        title: "Foto actualizada",
        description: "Tu perfil ha sido verificado correctamente",
      });
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast({
        title: "Error",
        description: "No se pudo subir la foto",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);

    try {
      const { error: baseError } = await supabase
        .from('users')
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
          bio: profile.bio,
        })
        .eq('id', user.id);

      if (baseError) throw baseError;

      const { error: providerError } = await supabase
        .from('providers')
        .update({
          display_name: profile.display_name,
          specialty: profile.specialty,
          zone_served: profile.zone_served,
        })
        .eq('user_id', user.id);

      if (providerError) throw providerError;

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se guardaron correctamente",
      });
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!profile.verified && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Verificación pendiente:</strong> Debes subir una foto de tu rostro para comenzar a recibir trabajos.
          </AlertDescription>
        </Alert>
      )}

      <Card className="bg-background/60 backdrop-blur-sm border-border/50">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Mi Perfil
                {profile.verified && (
                  <Badge variant="default" className="ml-2 gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Verificado
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>Actualiza tu información profesional</CardDescription>
            </div>
            {profile.rating > 0 && (
              <div className="hidden sm:block">
                <RatingDisplay rating={profile.rating} totalReviews={profile.total_reviews} />
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="w-32 h-32">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.full_name?.charAt(0) || "P"}
                </AvatarFallback>
              </Avatar>
              {profile.verified && (
                <div className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-1">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex flex-col items-center gap-2">
              <Label htmlFor="photo-upload" className="cursor-pointer">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploading}
                    onClick={() => document.getElementById("photo-upload")?.click()}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Subiendo...
                      </>
                    ) : (
                      <>
                        <Camera className="w-4 h-4 mr-2" />
                        {profile.avatar_url ? "Cambiar foto" : "Subir foto de verificación"}
                      </>
                    )}
                  </Button>
              </Label>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <p className="text-xs text-muted-foreground text-center">
                Sube una foto clara de tu rostro para verificación
              </p>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nombre completo</Label>
              <Input
                id="full_name"
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                placeholder="Tu nombre completo"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="specialty">Especialidad</Label>
              <Input
                id="specialty"
                value={profile.specialty || ""}
                onChange={(e) => setProfile({ ...profile, specialty: e.target.value })}
                placeholder="Ej: Fontanería, Electricidad, Limpieza..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="zone_served">Zona de servicio</Label>
              <Input
                id="zone_served"
                value={profile.zone_served || ""}
                onChange={(e) => setProfile({ ...profile, zone_served: e.target.value })}
                placeholder="Ej: Madrid Centro, Barcelona Norte..."
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono</Label>
              <Input
                id="phone"
                value={profile.phone || ""}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                El teléfono no se puede modificar
              </p>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="bio">Descripción</Label>
              <Textarea
                id="bio"
                value={profile.bio || ""}
                onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                placeholder="Cuéntanos sobre tu experiencia y servicios..."
                rows={4}
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Guardando...
              </>
            ) : (
              "Guardar cambios"
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
