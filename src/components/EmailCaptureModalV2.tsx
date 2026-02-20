import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Gift, CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "email_capture_seen_v2";

export function EmailCaptureModalV2() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"capture" | "success">("capture");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (user) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    const timer = setTimeout(() => {
      setOpen(true);
      sessionStorage.setItem(STORAGE_KEY, "1");
      localStorage.setItem(STORAGE_KEY, Date.now().toString());
    }, 4000);

    return () => clearTimeout(timer);
  }, [user]);

  const handleSubmit = useCallback(async () => {
    if (!email || !email.includes("@")) {
      toast.error("Ingresa un email válido");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("claim-welcome-credit", {
        body: { email: email.trim(), urgency: false },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        setLoading(false);
        return;
      }
      setStep("success");
    } catch (err) {
      console.error("Credit claim error:", err);
      toast.error("Error al reclamar crédito. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }, [email]);

  const content = (
    <div className="p-6 sm:p-8 space-y-6">
      {step === "capture" && (
        <>
          <div className="text-center space-y-3">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Gift className="h-7 w-7 text-primary" />
            </div>
            <DialogTitle className="text-2xl font-bold tracking-tight text-foreground leading-tight">
              Obtén $150 MXN de crédito en tu primera visita
            </DialogTitle>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Úsalo automáticamente al reservar tu primer servicio.
            </p>
          </div>

          <div className="space-y-3">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="h-12 text-base rounded-xl border-border/60 bg-background focus-visible:ring-primary/30"
              autoFocus
            />
            <Button
              onClick={handleSubmit}
              disabled={loading || !email}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/85 text-primary-foreground font-semibold text-base shadow-md hover:shadow-lg transition-all duration-200"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Recibir crédito"}
            </Button>
            <button
              onClick={() => setOpen(false)}
              className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-1"
            >
              Continuar sin descuento
            </button>
          </div>

          <p className="text-xs text-center text-muted-foreground/70">
            Sin spam. Solo confirmaciones y ofertas relevantes.
          </p>
        </>
      )}

      {step === "success" && (
        <div className="text-center space-y-4 py-2">
          <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
            <CheckCircle className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-foreground">¡Tu crédito está listo!</h3>
            <p className="text-2xl font-bold text-primary mt-1">$150 MXN</p>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Se aplicará automáticamente al pagar tu primer servicio. Válido por 14 días.
          </p>
          <Button
            onClick={() => setOpen(false)}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-primary to-primary/85 text-primary-foreground font-semibold shadow-md"
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
        <DrawerContent className="border-t border-border/40 rounded-t-3xl bg-gradient-to-b from-background to-muted/30">
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border border-border/40 shadow-2xl bg-gradient-to-b from-background to-muted/30 p-0">
        {content}
      </DialogContent>
    </Dialog>
  );
}
