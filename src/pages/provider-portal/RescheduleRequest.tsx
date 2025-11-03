import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useRescheduleRequest } from '@/hooks/useRescheduleRequest';
import { RescheduleCountdown } from '@/components/provider-portal/RescheduleCountdown';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Check, X, Calendar as CalendarIconLucide, MapPin, DollarSign, User, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const RescheduleRequest = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { reschedule, loading, responding, acceptReschedule, suggestAlternative, cancelJob } = useRescheduleRequest(id || '');
  const [suggestedDate, setSuggestedDate] = useState<Date>();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!reschedule) {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">Solicitud no encontrada</p>
            <Button onClick={() => navigate('/provider-portal/calendar')} className="mt-4">
              Volver al calendario
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (reschedule.status !== 'pending') {
    return (
      <div className="container mx-auto p-4 lg:p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Badge className="mb-4" variant={reschedule.status === 'accepted' ? 'default' : 'secondary'}>
              {reschedule.status === 'accepted' ? 'Aceptada' : reschedule.status === 'expired' ? 'Expirada' : 'Rechazada'}
            </Badge>
            <p className="text-muted-foreground">Esta solicitud ya fue procesada</p>
            <Button onClick={() => navigate('/provider-portal/calendar')} className="mt-4">
              Volver al calendario
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 lg:p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Solicitud de Reprogramación</h1>
        <p className="text-muted-foreground">
          El cliente solicita cambiar la fecha de este trabajo
        </p>
      </div>

      <RescheduleCountdown 
        deadline={reschedule.booking.reschedule_response_deadline}
        onExpire={() => navigate('/provider-portal/calendar')}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Left Column - Job Details */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Detalles del Trabajo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">{reschedule.booking.title}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{reschedule.booking.customer.full_name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>{reschedule.booking.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>${reschedule.booking.total_amount.toLocaleString('es-MX')}</span>
                  </div>
                </div>
              </div>

              {reschedule.reason && (
                <div className="pt-4 border-t">
                  <h4 className="font-medium text-sm mb-1">Motivo:</h4>
                  <p className="text-sm text-muted-foreground">{reschedule.reason}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cambio de Fecha</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Fecha original</p>
                    <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                      <CalendarIconLucide className="h-4 w-4" />
                      <span className="font-medium">
                        {format(new Date(reschedule.original_date), "PPP 'a las' p", { locale: es })}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1">Nueva fecha solicitada</p>
                    <div className="flex items-center gap-2 p-3 bg-primary/10 border-2 border-primary rounded-lg">
                      <CalendarIconLucide className="h-4 w-4" />
                      <span className="font-medium">
                        {format(new Date(reschedule.requested_date), "PPP 'a las' p", { locale: es })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Actions */}
        <div className="space-y-4">
          <Card className="border-2 border-green-500/20 bg-green-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Check className="h-5 w-5 text-green-600" />
                Aceptar nueva fecha
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Confirma que puedes realizar el trabajo en la nueva fecha solicitada por el cliente.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="w-full" disabled={responding}>
                    Aceptar reprogramación
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Confirmar reprogramación?</AlertDialogTitle>
                    <AlertDialogDescription>
                      El trabajo se moverá al {format(new Date(reschedule.requested_date), "PPP 'a las' p", { locale: es })}.
                      El cliente será notificado inmediatamente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={acceptReschedule}>
                      Confirmar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="border-2 border-orange-500/20 bg-orange-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIconLucide className="h-5 w-5 text-orange-600" />
                Sugerir otra fecha
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Si no puedes en esa fecha, sugiere una alternativa que funcione para ti.
              </p>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start text-left font-normal',
                      !suggestedDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {suggestedDate ? format(suggestedDate, 'PPP', { locale: es }) : 'Selecciona una fecha'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={suggestedDate}
                    onSelect={setSuggestedDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="w-full" disabled={!suggestedDate || responding}>
                    Enviar sugerencia
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Enviar fecha sugerida?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Sugerirás el {suggestedDate && format(suggestedDate, 'PPP', { locale: es })} al cliente.
                      Ellos podrán aceptar tu propuesta o cancelar el trabajo.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => suggestedDate && suggestAlternative(suggestedDate)}>
                      Enviar
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>

          <Card className="border-2 border-red-500/20 bg-red-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <X className="h-5 w-5 text-red-600" />
                No puedo, cancelar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Si no puedes realizar el trabajo, cancélalo y será reasignado a otro profesional.
              </p>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="w-full" disabled={responding}>
                    Cancelar trabajo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Cancelar trabajo?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta acción no se puede deshacer. El trabajo será cancelado y reasignado a otro profesional.
                      Tu calificación no se verá afectada.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Volver</AlertDialogCancel>
                    <AlertDialogAction onClick={cancelJob} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                      Confirmar cancelación
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RescheduleRequest;
