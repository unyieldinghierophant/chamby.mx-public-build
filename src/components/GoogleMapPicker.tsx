import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleMap, LoadScript, Autocomplete } from '@react-google-maps/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Star, Plus, Trash2, Edit2, Navigation, Loader2 } from 'lucide-react';
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
  height: '600px',
  borderRadius: '1rem',
};

// Ultra-modern minimal map styling (Uber/Airbnb style)
const modernMapStyles = [
  // Hide most POIs for cleaner look
  { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  
  // Desaturate everything for minimal look
  { elementType: "geometry", stylers: [{ saturation: -40 }, { lightness: 35 }] },
  
  // Roads: clean white/light gray
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
  
  // Water: soft muted blue
  { featureType: "water", stylers: [{ color: "#c5d9e8" }, { lightness: 20 }] },
  
  // Landscape: very light gray
  { featureType: "landscape", stylers: [{ color: "#f8f8f8" }] },
  
  // Parks: barely visible
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#e8f5e9" }] },
  
  // Remove icons
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  
  // Subtle text
  { elementType: "labels.text.fill", stylers: [{ color: "#666666" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }, { weight: 3 }] },
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
  const [currentAddress, setCurrentAddress] = useState(initialLocation || '');
  const [currentCity, setCurrentCity] = useState('');
  const [interiorNumber, setInteriorNumber] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocodeTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
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

  // Debounced reverse geocoding function
  const reverseGeocode = useCallback((lat: number, lng: number) => {
    // Clear existing timeout
    if (geocodeTimeoutRef.current) {
      clearTimeout(geocodeTimeoutRef.current);
    }
    
    setIsGeocoding(true);
    
    // Debounce: wait 500ms before geocoding
    geocodeTimeoutRef.current = setTimeout(() => {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const formattedAddress = results[0].formatted_address;
          setCurrentAddress(formattedAddress);
          
          // Extract city for secondary display
          const cityComponent = results[0].address_components.find(
            c => c.types.includes('locality') || c.types.includes('administrative_area_level_1')
          );
          setCurrentCity(cityComponent?.long_name || '');
          
          // Call parent with full address including interior number
          const fullAddress = interiorNumber 
            ? `${formattedAddress}, ${interiorNumber}`
            : formattedAddress;
          onLocationSelect(lat, lng, fullAddress);
        }
        setIsGeocoding(false);
      });
    }, 500);
  }, [onLocationSelect, interiorNumber]);

  // Handle map drag end - this is the core of the new UX
  const handleMapDragEnd = useCallback(() => {
    if (!mapRef.current) return;
    
    const newCenter = mapRef.current.getCenter();
    if (newCenter) {
      const lat = newCenter.lat();
      const lng = newCenter.lng();
      setCenter({ lat, lng });
      reverseGeocode(lat, lng);
    }
  }, [reverseGeocode]);

  // GPS location handler
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const newCenter = { lat: latitude, lng: longitude };
        
        // Animate map to new location
        if (mapRef.current) {
          mapRef.current.panTo(newCenter);
          mapRef.current.setZoom(16);
        }
        
        setCenter(newCenter);
        reverseGeocode(latitude, longitude);
        toast.success('📍 Ubicación detectada');
        setIsLocating(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('No se pudo obtener tu ubicación');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

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
        
        // Animate pan to location
        if (mapRef.current) {
          mapRef.current.panTo(newCenter);
          mapRef.current.setZoom(16);
        }
        
        setCenter(newCenter);
        setCurrentAddress(place.formatted_address || '');
        setSelectedLocationId(null);
        
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
    setCurrentAddress(location.address);
    setInteriorNumber('');
    
    // If location has coordinates, update map
    if (location.latitude && location.longitude) {
      const newCenter = { lat: location.latitude, lng: location.longitude };
      
      // Animate pan to location
      if (mapRef.current) {
        mapRef.current.panTo(newCenter);
        mapRef.current.setZoom(16);
      }
      
      setCenter(newCenter);
      onLocationSelect(location.latitude, location.longitude, location.address);
    } else {
      // Geocode the address to get coordinates
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: location.address }, (results, status) => {
        if (status === 'OK' && results && results[0] && results[0].geometry) {
          const lat = results[0].geometry.location.lat();
          const lng = results[0].geometry.location.lng();
          const newCenter = { lat, lng };
          
          if (mapRef.current) {
            mapRef.current.panTo(newCenter);
            mapRef.current.setZoom(16);
          }
          
          setCenter(newCenter);
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
      {/* Saved Locations - Show for authenticated users */}
      {user && (
        <div className="space-y-3">
          <Label className="text-base font-medium text-foreground">
            Ubicaciones guardadas
          </Label>
          
          {locationsLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Cargando ubicaciones...</span>
            </div>
          ) : (
            <div className="flex gap-2">
              <Select 
                value={selectedLocationId || ''} 
                onValueChange={handleSavedLocationSelect}
                disabled={locations.length === 0}
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
          )}
          
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
        {/* Search Bar - Floating on Mobile */}
        <div className="space-y-3">
          <Label className="text-lg font-semibold text-foreground">
            Arrastra el mapa para seleccionar ubicación
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
                value={currentAddress}
                onChange={(e) => setCurrentAddress(e.target.value)}
                placeholder="Buscar dirección o colonia..."
                className="h-14 text-base pl-12 shadow-lg border-2 focus:border-primary"
              />
            </Autocomplete>
          </div>
        </div>

        {/* Modern Map Container with Fixed Pin */}
        <div className="relative rounded-2xl overflow-hidden border-2 border-border shadow-2xl">
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={15}
            onLoad={(map) => { mapRef.current = map; }}
            onDragEnd={handleMapDragEnd}
            options={{
              styles: modernMapStyles,
              disableDefaultUI: true,
              zoomControl: false,
              gestureHandling: 'greedy',
              restriction: {
                latLngBounds: guadalajaraBounds,
                strictBounds: false,
              },
              minZoom: 11,
              maxZoom: 19,
            }}
          >
            {/* No Marker component - we use CSS fixed pin instead */}
          </GoogleMap>
          
          {/* Fixed Center Pin - Chamby Style */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10 pointer-events-none">
            <div className="animate-bounce-subtle">
              <svg width="48" height="64" viewBox="0 0 48 64" className="drop-shadow-2xl">
                <defs>
                  <linearGradient id="pinGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#3771C8', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#2557a8', stopOpacity: 1 }} />
                  </linearGradient>
                </defs>
                <path 
                  d="M24 0C13.5 0 5 8.5 5 19c0 17.5 19 45 19 45s19-27.5 19-45c0-10.5-8.5-19-19-19z" 
                  fill="url(#pinGradient)" 
                  stroke="#fff" 
                  strokeWidth="3"
                />
                <circle cx="24" cy="19" r="8" fill="#fff" />
                <circle cx="24" cy="19" r="4" fill="#DD5B3B" />
              </svg>
            </div>
          </div>

          {/* GPS Location Button */}
          <button 
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="absolute bottom-32 md:bottom-6 right-4 md:right-6 z-20 bg-white dark:bg-gray-900 rounded-full shadow-2xl border-2 border-gray-200 dark:border-gray-700 w-14 h-14 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform disabled:opacity-50"
            aria-label="Usar mi ubicación"
          >
            {isLocating ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : (
              <Navigation className="w-6 h-6 text-primary" />
            )}
          </button>

          {/* Bottom Address Card - Modern Floating Design */}
          <div className="absolute bottom-0 left-0 right-0 z-20 p-4 md:p-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border-2 border-gray-200 dark:border-gray-700 p-4 md:p-6 max-w-2xl mx-auto backdrop-blur-sm bg-opacity-95">
              {/* Address Display */}
              <div className="flex items-start gap-3 mb-4">
                <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {isGeocoding ? (
                    <div className="animate-pulse space-y-2">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
                    </div>
                  ) : (
                    <>
                      <p className="font-semibold text-base text-foreground leading-tight">
                        {currentAddress || 'Selecciona una ubicación'}
                      </p>
                      {currentCity && (
                        <p className="text-sm text-muted-foreground mt-1">{currentCity}</p>
                      )}
                    </>
                  )}
                </div>
              </div>
              
              {/* Interior Number Input */}
              <div className="relative mb-4">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                <Input
                  value={interiorNumber}
                  onChange={(e) => {
                    const value = e.target.value.slice(0, 50);
                    setInteriorNumber(value);
                    if (currentAddress) {
                      const fullAddress = value ? `${currentAddress}, ${value}` : currentAddress;
                      onLocationSelect(center.lat, center.lng, fullAddress);
                    }
                  }}
                  placeholder="Interior, depto, torre (opcional)"
                  className="h-11 text-sm pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  maxLength={50}
                />
              </div>
              
              {/* Confirm Button */}
              <Button 
                className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-shadow" 
                size="lg"
                disabled={!currentAddress || isGeocoding}
                onClick={() => {
                  const fullAddress = interiorNumber 
                    ? `${currentAddress}, ${interiorNumber}`
                    : currentAddress;
                  onLocationSelect(center.lat, center.lng, fullAddress);
                  toast.success('✓ Ubicación confirmada');
                }}
              >
                {isGeocoding ? 'Cargando...' : 'Confirmar ubicación'}
              </Button>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground text-center">
          💡 Arrastra el mapa para ajustar la ubicación exacta del pin central
        </p>
      </LoadScript>
    </div>
  );
};
