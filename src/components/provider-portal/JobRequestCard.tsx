import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, DollarSign, Calendar, Clock } from "lucide-react";
import { Notification } from "@/hooks/useNotifications";
import { useState } from "react";
import { toast } from "sonner";

interface JobRequestCardProps {
  notification: Notification;
  onAccept: (jobId: string) => Promise<void>;
  onReject: (notificationId: string) => Promise<void>;
}

export const JobRequestCard = ({ notification, onAccept, onReject }: JobRequestCardProps) => {
  const [loading, setLoading] = useState(false);
  
  const jobData = notification.data as { 
    job_id: string; 
    category: string; 
    rate: number; 
    location: string;
    title?: string;
    description?: string;
  };

  const handleAccept = async () => {
    setLoading(true);
    try {
      await onAccept(jobData.job_id);
      toast.success("¡Trabajo aceptado!", {
        description: "El cliente ha sido notificado"
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Por favor intenta de nuevo";
      console.error("Error accepting job:", error);
      toast.error("No se pudo aceptar el trabajo", {
        description: errorMessage
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    setLoading(true);
    try {
      await onReject(notification.id);
      toast.info("Trabajo rechazado");
    } catch (error) {
      console.error("Error rejecting job:", error);
      toast.error("Error al rechazar el trabajo");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 hover:border-primary/40 transition-colors">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">
              {jobData.title || notification.title}
            </CardTitle>
            <Badge variant="secondary" className="mb-2">
              {jobData.category}
            </Badge>
          </div>
          <Badge variant="outline" className="bg-primary/10">
            Nuevo
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-sm">
          {jobData.description && (
            <p className="text-muted-foreground">{jobData.description}</p>
          )}
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="w-4 h-4" />
            <span>{jobData.location || "Ubicación no especificada"}</span>
          </div>
          
          <div className="flex items-center gap-2 font-semibold text-primary">
            <DollarSign className="w-4 h-4" />
            <span>${jobData.rate}</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleAccept} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? "Procesando..." : "Aceptar Trabajo"}
          </Button>
          <Button 
            variant="outline" 
            onClick={handleReject}
            disabled={loading}
            className="flex-1"
          >
            Rechazar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
