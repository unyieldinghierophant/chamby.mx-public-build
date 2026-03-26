import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle } from "lucide-react";

interface RefundRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => Promise<boolean>;
  submitting: boolean;
}

export function RefundRequestModal({
  open,
  onOpenChange,
  onConfirm,
  submitting,
}: RefundRequestModalProps) {
  const [reason, setReason] = useState("");

  const handleConfirm = async () => {
    const success = await onConfirm(reason.trim());
    if (success) {
      setReason("");
      onOpenChange(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-[90vw] sm:max-w-md rounded-xl">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-500/10">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
            </div>
            <AlertDialogTitle className="text-base">
              ¿Solicitar reembolso?
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm">
            Tu solicitud será revisada por un administrador. Describe el motivo
            del reembolso para que podamos procesarlo más rápido.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Textarea
          placeholder="Describe el motivo del reembolso..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="min-h-[100px] text-sm"
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {reason.length}/500
        </p>

        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel disabled={submitting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={reason.trim().length < 5 || submitting}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            className="bg-amber-500 hover:bg-amber-600 text-white"
          >
            {submitting ? "Enviando..." : "Solicitar reembolso"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
