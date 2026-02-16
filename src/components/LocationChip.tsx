import { useState, useCallback } from 'react';
import { MapPin, ChevronDown, Navigation, Loader2, X } from 'lucide-react';
import { useGlobalLocation, GlobalLocation } from '@/hooks/useGlobalLocation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface LocationChipProps {
  variant?: 'light' | 'dark';
  className?: string;
}

export function LocationChip({ variant = 'light', className }: LocationChipProps) {
  const { location, setGlobalLocation } = useGlobalLocation();
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleUseMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error('Tu navegador no soporta geolocalización');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const resp = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=16`,
            { headers: { 'User-Agent': 'Chamby.mx/1.0' }, signal: AbortSignal.timeout(5000) }
          );
          const data = await resp.json();
          const shortAddr = data.address?.road
            ? `${data.address.road}${data.address.house_number ? ` ${data.address.house_number}` : ''}, ${data.address.city || data.address.town || data.address.municipality || ''}`
            : data.display_name?.split(',').slice(0, 2).join(',') || 'Mi ubicación';
          const fullAddr = data.display_name || shortAddr;

          setGlobalLocation({
            address: fullAddr,
            latitude,
            longitude,
            shortAddress: shortAddr.length > 35 ? shortAddr.slice(0, 32) + '…' : shortAddr,
          });
          toast.success('📍 Ubicación detectada');
          setOpen(false);
        } catch {
          setGlobalLocation({
            address: `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
            latitude,
            longitude,
            shortAddress: 'Mi ubicación',
          });
          setOpen(false);
        }
        setIsLocating(false);
      },
      () => {
        toast.error('No se pudo obtener tu ubicación');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [setGlobalLocation]);

  const handleManualSubmit = useCallback(() => {
    if (address.trim().length < 5) {
      toast.error('Escribe una dirección más completa');
      return;
    }
    // For manual entry, we don't have coords — set to Guadalajara center as fallback
    setGlobalLocation({
      address: address.trim(),
      latitude: 20.6597,
      longitude: -103.3496,
      shortAddress: address.trim().length > 35 ? address.trim().slice(0, 32) + '…' : address.trim(),
    });
    setOpen(false);
    setAddress('');
  }, [address, setGlobalLocation]);

  const isDark = variant === 'dark';

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 max-w-[280px]',
          isDark
            ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20 backdrop-blur-sm'
            : 'bg-accent hover:bg-accent/80 text-foreground border border-border',
          className
        )}
      >
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">
          {location?.shortAddress || 'Selecciona tu ubicación'}
        </span>
        <ChevronDown className="h-3 w-3 shrink-0 opacity-60" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-jakarta text-lg">¿Dónde necesitas el servicio?</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Use my location */}
            <Button
              variant="outline"
              className="w-full h-12 justify-start gap-3"
              onClick={handleUseMyLocation}
              disabled={isLocating}
            >
              {isLocating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Navigation className="h-4 w-4 text-primary" />
              )}
              {isLocating ? 'Detectando ubicación…' : 'Usar mi ubicación actual'}
            </Button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">o escribe una dirección</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            {/* Manual address */}
            <div className="flex gap-2">
              <Input
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Calle, número, colonia…"
                className="flex-1 h-12"
                onKeyDown={(e) => e.key === 'Enter' && handleManualSubmit()}
              />
              <Button
                onClick={handleManualSubmit}
                disabled={address.trim().length < 5}
                className="h-12 px-5"
              >
                Listo
              </Button>
            </div>

            {/* Current location display */}
            {location && (
              <div className="bg-accent/40 rounded-lg p-3 flex items-start gap-2">
                <MapPin className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{location.shortAddress}</p>
                  <p className="text-xs text-muted-foreground truncate">{location.address}</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
