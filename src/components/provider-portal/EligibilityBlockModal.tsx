import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, XCircle, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface EligibilityBlockModalProps {
  open: boolean;
  onClose: () => void;
  missing: string[];
}

export const EligibilityBlockModal = ({ open, onClose, missing }: EligibilityBlockModalProps) => {
  const navigate = useNavigate();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            No puedes aceptar trabajos todavía
          </DialogTitle>
          <DialogDescription>
            Completa los siguientes requisitos para poder aceptar trabajos en Chamby.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-2">
          {missing.map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-foreground">
              <XCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <span>{item}</span>
            </div>
          ))}
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">
            Cerrar
          </Button>
          <Button
            onClick={() => {
              onClose();
              navigate('/provider/onboarding');
            }}
            className="flex-1"
          >
            Completar perfil
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
