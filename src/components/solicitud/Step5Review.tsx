import { SolicitudFormData } from "@/pages/NuevaSolicitud";
import { Badge } from "@/components/ui/badge";
import { MapPin, Calendar, FileText, Image, Zap } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Step5ReviewProps {
  formData: SolicitudFormData;
}

const Step5Review = ({ formData }: Step5ReviewProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-semibold mb-2">Revisa tu solicitud</h3>
        <p className="text-muted-foreground text-sm">
          Verifica que toda la información sea correcta antes de continuar
        </p>
      </div>

      {/* Service Type */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Servicio</h4>
        <div className="p-4 bg-gradient-glass rounded-lg">
          <p className="font-semibold capitalize">{formData.serviceType}</p>
          <p className="text-sm text-muted-foreground capitalize">{formData.problem}</p>
        </div>
      </div>

      {/* Photos */}
      {formData.photos.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 text-muted-foreground" />
            <h4 className="text-sm font-medium text-muted-foreground">
              Fotos ({formData.photos.length})
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {formData.photos.slice(0, 6).map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Foto ${index + 1}`}
                className="w-full h-20 object-cover rounded-lg"
              />
            ))}
          </div>
          {formData.photos.length > 6 && (
            <p className="text-xs text-muted-foreground">
              +{formData.photos.length - 6} fotos más
            </p>
          )}
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">Descripción</h4>
        </div>
        <div className="p-4 bg-gradient-glass rounded-lg">
          <p className="text-sm">{formData.description}</p>
        </div>
      </div>

      {/* Date/Time or Urgent */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          {formData.urgent ? (
            <Zap className="h-4 w-4 text-orange-500" />
          ) : (
            <Calendar className="h-4 w-4 text-muted-foreground" />
          )}
          <h4 className="text-sm font-medium text-muted-foreground">Fecha y hora</h4>
        </div>
        <div className="p-4 bg-gradient-glass rounded-lg">
          {formData.urgent ? (
            <Badge variant="destructive" className="bg-orange-500">
              <Zap className="mr-1 h-3 w-3" />
              Servicio urgente (menos de 2 horas)
            </Badge>
          ) : formData.scheduledAt ? (
            <p className="text-sm">
              {format(new Date(formData.scheduledAt), "EEEE, d 'de' MMMM 'de' yyyy 'a las' HH:mm", {
                locale: es,
              })}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No especificado</p>
          )}
        </div>
      </div>

      {/* Location */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-muted-foreground">Ubicación</h4>
        </div>
        <div className="p-4 bg-gradient-glass rounded-lg">
          <p className="text-sm">{formData.location}</p>
        </div>
      </div>

      {/* Payment Notice */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">
          Siguiente paso: Pago de visita
        </p>
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Se requiere un pago de visita para confirmar tu solicitud. Los profesionales revisarán tu caso y te enviarán presupuestos.
        </p>
      </div>
    </div>
  );
};

export default Step5Review;
