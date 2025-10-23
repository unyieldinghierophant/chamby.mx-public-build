import { useState, useCallback, useRef } from 'react';
import { GoogleMap, LoadScript, Marker, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Star, Plus, Trash2, Edit2 } from 'lucide-react';
import { useSavedLocations } from '@/hooks/useSavedLocations';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const libraries: ("places")[] = ["places"];

const mapContainerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '0.5rem',
  // Mobile-friendly touch handling
  touchAction: 'pan-x pan-y'
};

// Modern map styling
const mapStyles = [
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#a0d6ff" }, { lightness: 17 }]
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }, { lightness: 20 }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.fill",
    stylers: [{ color: "#ffffff" }, { lightness: 17 }]
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#ffffff" }, { lightness: 29 }, { weight: 0.2 }]
  },
  {
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }, { lightness: 18 }]
  },
  {
    featureType: "road.local",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }, { lightness: 16 }]
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#f5f5f5" }, { lightness: 21 }]
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#c8e6c9" }, { lightness: 21 }]
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ visibility: "on" }, { color: "#ffffff" }, { lightness: 16 }]
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ saturation: 36 }, { color: "#333333" }, { lightness: 40 }]
  },
  {
    elementType: "labels.icon",
    stylers: [{ visibility: "off" }]
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#f2f2f2" }, { lightness: 19 }]
  },
  {
    featureType: "administrative",
    elementType: "geometry.fill",
    stylers: [{ color: "#fefefe" }, { lightness: 20 }]
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#fefefe" }, { lightness: 17 }, { weight: 1.2 }]
  }
];

// Guadalajara coordinates
const defaultCenter = {
  lat: 20.6597,
  lng: -103.3496
};

// Bounds for Guadalajara metropolitan area
const guadalajaraBounds = {
  north: 20.8,
  south: 20.5,
  east: -103.2,
  west: -103.5,
};

interface GoogleMapPickerProps {
  onLocationSelect: (lat: number, lng: number, address: string) => void;
  initialLocation?: string;
}

export const GoogleMapPicker = ({ onLocationSelect, initialLocation }: GoogleMapPickerProps) => {
  const { user } = useAuth();
  const { locations, loading: locationsLoading, addLocation, updateLocation, deleteLocation } = useSavedLocations();
  const [center, setCenter] = useState(defaultCenter);
  const [markerPosition, setMarkerPosition] = useState(defaultCenter);
  const [address, setAddress] = useState(initialLocation || '');
  const [interiorNumber, setInteriorNumber] = useState('');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  
  // Dialog state for managing locations
  const [isManageDialogOpen, setIsManageDialogOpen] = useState(false);
  const [isAddEditDialogOpen, setIsAddEditDialogOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [formData, setFormData] = useState({
    label: '',
    address: '',
    isDefault: false
  });

  // Your Google Maps API key should be stored in environment variables
  const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const lat = e.latLng.lat();
      const lng = e.latLng.lng();
      setMarkerPosition({ lat, lng });
      
      // Reverse geocode to get address
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setAddress(formattedAddress);
          const fullAddress = interiorNumber 
            ? `${formattedAddress}, ${interiorNumber}`
            : formattedAddress;
          onLocationSelect(lat, lng, fullAddress);
        }
      });
    }
  }, [onLocationSelect]);

  const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
    autocompleteRef.current = autocomplete;
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        const newCenter = { lat, lng };
        
        setCenter(newCenter);
        setMarkerPosition(newCenter);
        setAddress(place.formatted_address || '');
        setSelectedLocationId(null); // Clear saved location selection
        const fullAddress = interiorNumber 
          ? `${place.formatted_address || ''}, ${interiorNumber}`
          : place.formatted_address || '';
        onLocationSelect(lat, lng, fullAddress);
      }
    }
  };

  const handleSavedLocationSelect = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    if (!location) return;
    
    setSelectedLocationId(location.id);
    setAddress(location.address);
    setInteriorNumber('');
    
    // If location has coordinates, update map
    if (location.latitude && location.longitude) {
      const newCenter = { lat: location.latitude, lng: location.longitude };
      setCenter(newCenter);
      setMarkerPosition(newCenter);
      onLocationSelect(location.latitude, location.longitude, location.address);
    } else {
      // Geocode the address to get coordinates
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: location.address }, (results, status) => {
        if (status === 'OK' && results && results[0] && results[0].geometry) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          const newCenter = { lat, lng };
          setCenter(newCenter);
          setMarkerPosition(newCenter);
          onLocationSelect(lat, lng, location.address);
        }
      });
    }
  };

  const handleAddNewLocation = () => {
    setEditingLocation(null);
    setFormData({ label: '', address: '', isDefault: false });
    setIsAddEditDialogOpen(true);
  };

  const handleEditLocation = (location: any) => {
    setEditingLocation(location);
    setFormData({
      label: location.label,
      address: location.address,
      isDefault: location.is_default
    });
    setIsAddEditDialogOpen(true);
  };

  const handleDeleteLocation = async (id: string) => {
    const { error } = await deleteLocation(id);
    if (error) {
      toast.error('Error al eliminar ubicación');
    } else {
      toast.success('Ubicación eliminada');
      if (selectedLocationId === id) {
        setSelectedLocationId(null);
      }
    }
  };

  const handleSubmitLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.label.trim() || !formData.address.trim()) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    if (editingLocation) {
      const { error } = await updateLocation(editingLocation.id, {
        label: formData.label,
        address: formData.address,
        is_default: formData.isDefault
      });

      if (error) {
        toast.error('Error al actualizar ubicación');
      } else {
        toast.success('Ubicación actualizada');
        setIsAddEditDialogOpen(false);
        setEditingLocation(null);
        setFormData({ label: '', address: '', isDefault: false });
      }
    } else {
      const { error } = await addLocation(
        formData.label,
        formData.address,
        undefined,
        undefined,
        formData.isDefault
      );

      if (error) {
        toast.error('Error al guardar ubicación');
      } else {
        toast.success('Ubicación guardada');
        setIsAddEditDialogOpen(false);
        setFormData({ label: '', address: '', isDefault: false });
      }
    }
  };

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <div className="p-8 text-center border border-destructive rounded-lg bg-destructive/10">
        <p className="text-destructive font-semibold">
          Google Maps API key no configurado
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Por favor configura VITE_GOOGLE_MAPS_API_KEY en las variables de entorno
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Saved Locations - Only show for authenticated users */}
      {user && !locationsLoading && (
        <div className="space-y-3">
          <Label className="text-base font-medium text-foreground">
            Ubicaciones guardadas
          </Label>
          
          <div className="flex gap-2">
            <Select 
              value={selectedLocationId || ''} 
              onValueChange={handleSavedLocationSelect}
            >
              <SelectTrigger className="flex-1 h-12">
                <SelectValue placeholder={
                  locations.length > 0 
                    ? "Selecciona una ubicación guardada" 
                    : "No hay ubicaciones guardadas"
                } />
              </SelectTrigger>
              <SelectContent className="bg-popover z-50">
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id}>
                    <div className="flex items-center gap-2">
                      {location.is_default && <Star className="w-3 h-3 fill-current text-primary" />}
                      <span className="font-medium">{location.label}</span>
                      <span className="text-xs text-muted-foreground">- {location.address.substring(0, 40)}...</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Dialog open={isManageDialogOpen} onOpenChange={setIsManageDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="icon" className="h-12 w-12">
                  <Plus className="w-4 h-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Gestionar ubicaciones</DialogTitle>
                  <DialogDescription>
                    Administra tus ubicaciones guardadas
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4 py-4">
                  {locations.length === 0 ? (
                    <div className="text-center py-8">
                      <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">No hay ubicaciones guardadas</p>
                      <Button onClick={handleAddNewLocation}>
                        <Plus className="w-4 h-4 mr-2" />
                        Agregar primera ubicación
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-muted-foreground">
                          {locations.length} ubicación(es) guardada(s)
                        </p>
                        <Button size="sm" onClick={handleAddNewLocation}>
                          <Plus className="w-4 h-4 mr-2" />
                          Nueva ubicación
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {locations.map((location) => (
                          <div 
                            key={location.id}
                            className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                          >
                            <div className="flex items-start gap-3 flex-1">
                              <MapPin className="w-4 h-4 text-primary mt-1" />
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{location.label}</span>
                                  {location.is_default && (
                                    <Star className="w-3 h-3 text-primary fill-primary" />
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">
                                  {location.address}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditLocation(location)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteLocation(location.id)}
                              >
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
          
          {/* Add/Edit Location Dialog */}
          <Dialog open={isAddEditDialogOpen} onOpenChange={(open) => {
            setIsAddEditDialogOpen(open);
            if (!open) {
              setEditingLocation(null);
              setFormData({ label: '', address: '', isDefault: false });
            }
          }}>
            <DialogContent>
              <form onSubmit={handleSubmitLocation}>
                <DialogHeader>
                  <DialogTitle>
                    {editingLocation ? 'Editar ubicación' : 'Nueva ubicación'}
                  </DialogTitle>
                  <DialogDescription>
                    Guarda una dirección para usarla rápidamente
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
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
                    <Label htmlFor="address">Dirección</Label>
                    <Input
                      id="address"
                      placeholder="Dirección completa"
                      value={formData.address}
                      onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor="is-default" className="font-medium cursor-pointer">
                        Ubicación predeterminada
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Usar esta ubicación por defecto
                      </p>
                    </div>
                    <Switch
                      id="is-default"
                      checked={formData.isDefault}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isDefault: checked }))}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit">
                    {editingLocation ? 'Actualizar' : 'Guardar'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        libraries={libraries}
      >
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-foreground">
            Ubicación del trabajo
          </Label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Autocomplete
              onLoad={onLoad}
              onPlaceChanged={onPlaceChanged}
              options={{
                componentRestrictions: { country: 'mx' },
                fields: ['formatted_address', 'geometry', 'name'],
                bounds: guadalajaraBounds,
                strictBounds: true,
              }}
            >
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Ingresa dirección o colonia"
                className="h-14 text-base pl-12"
              />
            </Autocomplete>
          </div>
          <p className="text-sm text-muted-foreground">
            Escribe una dirección o haz clic en el mapa para seleccionar
          </p>
        </div>

        <div className="space-y-2">
          <Label className="text-base font-medium text-foreground">
            Número interior, apartamento, o suite (opcional)
          </Label>
          <div className="relative">
            <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Input
              value={interiorNumber}
              onChange={(e) => {
                const value = e.target.value.slice(0, 50);
                setInteriorNumber(value);
                if (address) {
                  const fullAddress = value ? `${address}, ${value}` : address;
                  onLocationSelect(markerPosition.lat, markerPosition.lng, fullAddress);
                }
              }}
              placeholder="Ej: Depto 5, Torre B, Piso 3"
              className="h-12 text-base pl-12"
              maxLength={50}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Agrega detalles como número de departamento, torre, o suite
          </p>
        </div>

        <div className="rounded-lg overflow-hidden border border-border shadow-lg">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={13}
            onClick={onMapClick}
            options={{
              styles: mapStyles,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: false,
              zoomControl: true,
              zoomControlOptions: {
                position: 7 // RIGHT_TOP
              },
              gestureHandling: 'greedy',
              restriction: {
                latLngBounds: guadalajaraBounds,
                strictBounds: false,
              },
              minZoom: 11,
              maxZoom: 18,
            }}
          >
            <Marker 
              position={markerPosition}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                fillColor: "#2563eb",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 2,
                scale: 2,
              }}
            />
          </GoogleMap>
        </div>
      </LoadScript>
    </div>
  );
};
