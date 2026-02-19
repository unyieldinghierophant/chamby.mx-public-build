import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Gift, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "chamby_welcome_credit_shown";
const COOLDOWN_DAYS = 14;

export function WelcomeCreditModal() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"email" | "success">("email");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [creditAmount, setCreditAmount] = useState(150);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // Check urgency: if within first 24h concept (we use a simple time check)
  const isUrgency = true; // Always show urgency for now — can be time-gated later

  useEffect(() => {
    if (user) return; // Don't show if logged in

    // Check localStorage cooldown
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown) {
      const daysSince = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60 * 24);
      if (daysSince < COOLDOWN_DAYS) return;
    }

    // Trigger after 2.5s OR 20% scroll
    let triggered = false;
    const trigger = () => {
      if (triggered) return;
      triggered = true;
      setOpen(true);
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    };

    const timer = setTimeout(trigger, 2500);

    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent >= 0.2) trigger();
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      clearTimeout(timer);
      window.removeEventListener("scroll", handleScroll);
    };
  }, [user]);

  const handleSubmitEmail = useCallback(async () => {
    if (!email || !email.includes("@")) {
      toast.error("Ingresa un email válido");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-welcome-credit", {
        body: { email: email.trim(), urgency: isUrgency },
      });

      if (error) throw error;

      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }

      setCreditAmount(data?.credit?.amount || (isUrgency ? 200 : 150));
      setStep("success");
    } catch (err) {
      console.error("Credit claim error:", err);
      toast.error("Error al reclamar crédito. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [email, isUrgency]);

  const content = (
    <div className="p-6 space-y-6">
      {step === "email" && (
        <>
          <div className="text-center space-y-3">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Gift className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-xl font-bold text-foreground">
              Obtén crédito en tu primera visita
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              {isUrgency
                ? "Reserva en las próximas 24h y recibe $200 MXN de crédito"
                : "Recibe $150 MXN de crédito en tu primera visita"}
            </p>
          </div>

          <div className="space-y-4">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmitEmail()}
              className="h-12 text-base"
              autoFocus
            />
            <Button
              onClick={handleSubmitEmail}
              disabled={loading || !email}
              className="w-full h-12 bg-primary text-primary-foreground font-semibold text-base"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Obtener mi crédito"
              )}
            </Button>
          </div>

          <p className="text-xs text-center text-muted-foreground">
            Sin spam. Se aplicará automáticamente al pagar tu primer servicio.
          </p>
        </>
      )}

      {step === "success" && (
        <div className="text-center space-y-4 py-4">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">
              ¡Tu crédito está listo!
            </h3>
            <p className="text-2xl font-bold text-primary mt-1">
              ${creditAmount} MXN
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Se aplicará automáticamente al pagar tu primer servicio.
            Válido por 14 días.
          </p>
          <Button
            onClick={() => setOpen(false)}
            className="w-full h-12 bg-primary text-primary-foreground font-semibold"
          >
            ¡Entendido!
          </Button>
        </div>
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="border-t-2 border-primary/30">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md border-2 border-primary/20 shadow-xl">
        {content}
      </DialogContent>
    </Dialog>
  );
}
