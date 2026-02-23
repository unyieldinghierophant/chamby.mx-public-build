import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const REASON_CODES = [
  { value: "no_show", label: "No se presentó" },
  { value: "bad_service", label: "Mal servicio" },
  { value: "pricing_dispute", label: "Desacuerdo en precio" },
  { value: "damage", label: "Daño a propiedad" },
  { value: "other", label: "Otro" },
] as const;

interface DisputeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: string;
  onDisputeOpened: () => void;
}

export const DisputeModal = ({ open, onOpenChange, jobId, onDisputeOpened }: DisputeModalProps) => {
  const [reasonCode, setReasonCode] = useState("");
  const [reasonText, setReasonText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!reasonCode) {
      toast.error("Selecciona una razón");
      return;
    }

    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("open-dispute", {
        body: { job_id: jobId, reason_code: reasonCode, reason_text: reasonText },
      });

      if (error || data?.error) {
        toast.error(data?.error || error?.message || "Error al abrir disputa");
        return;
      }

      toast.success("Disputa abierta exitosamente");
      onOpenChange(false);
      onDisputeOpened();
    } catch (err) {
      toast.error("Error inesperado");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Iniciar disputa
          </DialogTitle>
          <DialogDescription>
            Al abrir una disputa, el pago se congela hasta que un administrador la resuelva.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1.5 block">Razón</label>
            <Select value={reasonCode} onValueChange={setReasonCode}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una razón" />
              </SelectTrigger>
              <SelectContent>
                {REASON_CODES.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1.5 block">
              Detalles (opcional)
            </label>
            <Textarea
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Describe el problema con más detalle..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleSubmit}
              disabled={submitting || !reasonCode}
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <AlertTriangle className="h-4 w-4 mr-2" />
              )}
              Abrir disputa
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
