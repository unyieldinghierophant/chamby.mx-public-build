import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSavedLocations } from "@/hooks/useSavedLocations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GoogleMapPicker } from "@/components/GoogleMapPicker";
import Header from "@/components/Header";
import { MapPin, ArrowLeft, Trash2, Plus, Edit2, Star } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { toast } from 'sonner';

const SavedLocations = () => {
  const { user } = useAuth();
  const { locations, loading, addLocation, updateLocation, deleteLocation } = useSavedLocations();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    label: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    isDefault: false
  });

  if (!user) {
    return <Navigate to="/auth/user" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label.trim() || !formData.address.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (editingId) {
      const { error } = await updateLocation(editingId, {
        label: formData.label,
        address: formData.address,
        latitude: formData.latitude,
        longitude: formData.longitude,
        is_default: formData.isDefault
      });

      if (error) {
        toast.error('Error al actualizar ubicación');
      } else {
        toast.success('Ubicación actualizada');
        setEditingId(null);
        setIsAddDialogOpen(false);
        setFormData({ label: '', address: '', latitude: undefined, longitude: undefined, isDefault: false });
      }
    } else {
      const { error } = await addLocation(
        formData.label,
        formData.address,
        formData.latitude,
        formData.longitude,
        formData.isDefault
      );

      if (error) {
        toast.error('Error al guardar ubicación');
      } else {
        toast.success('Ubicación guardada');
        setIsAddDialogOpen(false);
        setFormData({ label: '', address: '', latitude: undefined, longitude: undefined, isDefault: false });
      }
    }
  };

  const handleEdit = (location: any) => {
    setEditingId(location.id);
    setFormData({
      label: location.label,
      address: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
      isDefault: location.is_default
    });
    setIsAddDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteLocation(id);
    
    if (error) {
      toast.error('Error al eliminar ubicación');
    } else {
      toast.success('Ubicación eliminada');
    }
  };

  const handleSetDefault = async (id: string) => {
    const { error } = await updateLocation(id, { is_default: true });
    
    if (error) {
      toast.error('Error al establecer ubicación predeterminada');
    } else {
      toast.success('Ubicación predeterminada actualizada');
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
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Ubicaciones Guardadas</h1>
                <p className="text-muted-foreground">Gestiona tus direcciones guardadas</p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={(open) => {
                setIsAddDialogOpen(open);
                if (!open) {
                  setEditingId(null);
                  setFormData({ label: '', address: '', latitude: undefined, longitude: undefined, isDefault: false });
                }
              }}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Ubicación
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>
                        {editingId ? 'Editar Ubicación' : 'Nueva Ubicación'}
                      </DialogTitle>
                      <DialogDescription>
                        Guarda una dirección para usarla rápidamente al reservar servicios
                      </DialogDescription>
                    </DialogHeader>
                    <Tabs defaultValue="map" className="py-4">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="map">Seleccionar en mapa</TabsTrigger>
                        <TabsTrigger value="manual">Ingresar manualmente</TabsTrigger>
                      </TabsList>
                      <TabsContent value="map" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="label">Etiqueta</Label>
                          <Input
                            id="label"
                            placeholder="Casa, Oficina, etc."
                            value={formData.label}
                            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Ubicación</Label>
                          <GoogleMapPicker
                            onLocationSelect={(lat, lng, address) => {
                              setFormData(prev => ({
                                ...prev,
                                address,
                                latitude: lat,
                                longitude: lng
                              }));
                            }}
                            initialLocation={formData.address}
                          />
                        </div>
                        {formData.address && (
                          <div className="p-3 bg-muted rounded-lg">
                            <p className="text-sm text-muted-foreground mb-1">Dirección seleccionada:</p>
                            <p className="text-sm font-medium">{formData.address}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <Label htmlFor="is-default-map" className="font-medium cursor-pointer">
                              Ubicación predeterminada
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Usar esta ubicación por defecto
                            </p>
                          </div>
                          <Switch
                            id="is-default-map"
                            checked={formData.isDefault}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                          />
                        </div>
                      </TabsContent>
                      <TabsContent value="manual" className="space-y-4 mt-4">
                        <div className="space-y-2">
                          <Label htmlFor="label-manual">Etiqueta</Label>
                          <Input
                            id="label-manual"
                            placeholder="Casa, Oficina, etc."
                            value={formData.label}
                            onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address-manual">Dirección</Label>
                          <Input
                            id="address-manual"
                            placeholder="Dirección completa"
                            value={formData.address}
                            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          />
                        </div>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div>
                            <Label htmlFor="is-default-manual" className="font-medium cursor-pointer">
                              Ubicación predeterminada
                            </Label>
                            <p className="text-sm text-muted-foreground">
                              Usar esta ubicación por defecto
                            </p>
                          </div>
                          <Switch
                            id="is-default-manual"
                            checked={formData.isDefault}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                          />
                        </div>
                      </TabsContent>
                    </Tabs>
                    <DialogFooter>
                      <Button type="submit">
                        {editingId ? 'Actualizar' : 'Guardar'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {locations.length === 0 ? (
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardContent className="py-12 text-center">
                <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No hay ubicaciones guardadas</h3>
                <p className="text-muted-foreground mb-4">
                  Agrega tus ubicaciones frecuentes para reservar servicios más rápido
                </p>
                <Button onClick={() => setIsAddDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Agregar Primera Ubicación
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {locations.map((location) => (
                <Card key={location.id} className="bg-card/95 backdrop-blur-sm shadow-raised">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <MapPin className="w-5 h-5 text-primary mt-1" />
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2">
                            {location.label}
                            {location.is_default && (
                              <Star className="w-4 h-4 text-primary fill-primary" />
                            )}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {location.address}
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {!location.is_default && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSetDefault(location.id)}
                            title="Establecer como predeterminada"
                          >
                            <Star className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(location)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(location.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default SavedLocations;
