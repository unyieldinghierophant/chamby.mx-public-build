import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LogIn, UserPlus } from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogin: () => void;
  onGuest: () => void;
  message?: string;
  showGuestOption?: boolean;
}

export const AuthModal = ({
  open,
  onOpenChange,
  onLogin,
  onGuest,
  message = "Necesitas iniciar sesión o crear una cuenta para continuar.",
  showGuestOption = true
}: AuthModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            Autenticación requerida
          </DialogTitle>
          <DialogDescription className="text-center text-base pt-2">
            {message}
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 pt-4">
          <Button 
            onClick={onLogin}
            size="lg"
            className="w-full h-12 text-base font-semibold"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Iniciar sesión / Registrarme
          </Button>
          
          {showGuestOption && (
            <Button 
              onClick={onGuest}
              variant="outline"
              size="lg"
              className="w-full h-12 text-base font-semibold"
            >
              <UserPlus className="mr-2 h-5 w-5" />
              Continuar como invitado
            </Button>
          )}
        </div>
        
        <p className="text-xs text-muted-foreground text-center pt-2">
          {showGuestOption 
            ? "Podrás guardar tu progreso después de iniciar sesión"
            : "Necesitas una cuenta para completar esta acción"}
        </p>
      </DialogContent>
    </Dialog>
  );
};
