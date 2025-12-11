import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { useCompleteFirstVisit } from "@/hooks/useCompleteFirstVisit";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Job {
  id: string;
  title: string;
  category: string;
  provider_confirmed_visit: boolean;
  client_confirmed_visit: boolean;
  visit_confirmation_deadline: string | null;
  visit_dispute_status: string | null;
  visit_dispute_reason: string | null;
  provider?: {
    full_name: string;
  };
}

interface ClientVisitConfirmationProps {
  job: Job;
  onConfirmed: () => void;
}

export const ClientVisitConfirmation = ({ job, onConfirmed }: ClientVisitConfirmationProps) => {
  const [showDisputeForm, setShowDisputeForm] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const { clientConfirmVisit, clientDisputeVisit, loading } = useCompleteFirstVisit();

  const handleConfirm = async () => {
    const result = await clientConfirmVisit(job.id);
    if (result.success) {
      toast.success("¡Visita confirmada!", {
        description: "El pago ha sido procesado al proveedor."
      });
      onConfirmed();
    } else {
      toast.error("Error al confirmar", {
        description: result.message
      });
    }
  };

  const handleDispute = async () => {
    if (!disputeReason.trim()) {
      toast.error("Por favor describe el problema");
      return;
    }

    const result = await clientDisputeVisit(job.id, disputeReason);
    if (result.success) {
      toast.success("Disputa enviada", {
        description: "Nuestro equipo revisará tu caso pronto."
      });
      onConfirmed();
    } else {
      toast.error("Error al enviar disputa", {
        description: result.message
      });
    }
  };

  // Already confirmed
  if (job.client_confirmed_visit) {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-success" />
          <span className="text-sm text-success">Visita confirmada y pago procesado</span>
        </CardContent>
      </Card>
    );
  }

  // In dispute
  if (job.visit_dispute_status === "pending_support") {
    return (
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-warning" />
          <div>
            <span className="text-sm text-warning font-medium">En revisión por soporte</span>
            <p className="text-xs text-muted-foreground mt-1">
              Nuestro equipo está revisando tu caso
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Resolved
  if (job.visit_dispute_status?.startsWith("resolved_")) {
    const resolvedFor = job.visit_dispute_status === "resolved_client" ? "a tu favor" : "a favor del proveedor";
    return (
      <Card className="border-muted">
        <CardContent className="p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Caso resuelto {resolvedFor}</span>
        </CardContent>
      </Card>
    );
  }

  // Provider hasn't confirmed yet
  if (!job.provider_confirmed_visit) {
    return null;
  }

  // Calculate time remaining
  const deadline = job.visit_confirmation_deadline ? new Date(job.visit_confirmation_deadline) : null;
  const isExpired = deadline ? deadline < new Date() : false;
  const timeRemaining = deadline 
    ? formatDistanceToNow(deadline, { locale: es, addSuffix: true })
    : null;

  if (isExpired) {
    return (
      <Card className="border-warning/50 bg-warning/5">
        <CardContent className="p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-warning" />
          <div>
            <span className="text-sm text-warning font-medium">Tiempo expirado</span>
            <p className="text-xs text-muted-foreground mt-1">
              El caso será revisado por nuestro equipo de soporte
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/50 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Confirma la visita</CardTitle>
          {timeRemaining && (
            <Badge variant="outline" className="gap-1">
              <Clock className="h-3 w-3" />
              {timeRemaining}
            </Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {job.provider?.full_name || "El proveedor"} ha confirmado que completó la visita para "{job.title}".
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!showDisputeForm ? (
          <div className="flex flex-col gap-2">
            <Button 
              onClick={handleConfirm}
              disabled={loading}
              className="w-full gap-2 bg-success hover:bg-success/90"
            >
              <CheckCircle className="h-4 w-4" />
              Confirmo que la visita se completó
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowDisputeForm(true)}
              disabled={loading}
              className="w-full gap-2"
            >
              <XCircle className="h-4 w-4" />
              Tengo un problema
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <Textarea
              placeholder="Describe el problema que tuviste con la visita..."
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => {
                  setShowDisputeForm(false);
                  setDisputeReason("");
                }}
                disabled={loading}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button 
                variant="destructive"
                onClick={handleDispute}
                disabled={loading || !disputeReason.trim()}
                className="flex-1"
              >
                Enviar disputa
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
