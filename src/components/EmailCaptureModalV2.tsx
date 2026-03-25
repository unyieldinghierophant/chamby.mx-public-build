import { useState, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

const STORAGE_KEY = "email_capture_seen_v2";
const COOKIE_KEY = "chamby_cookie_consent";

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

    const waitForCookies = () => {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (consent) {
        const timer = setTimeout(() => {
          setOpen(true);
          sessionStorage.setItem(STORAGE_KEY, "1");
          localStorage.setItem(STORAGE_KEY, Date.now().toString());
        }, 1500);
        return () => clearTimeout(timer);
      }

      const interval = setInterval(() => {
        if (localStorage.getItem(COOKIE_KEY)) {
          clearInterval(interval);
          setTimeout(() => {
            if (!sessionStorage.getItem(STORAGE_KEY)) {
              setOpen(true);
              sessionStorage.setItem(STORAGE_KEY, "1");
              localStorage.setItem(STORAGE_KEY, Date.now().toString());
            }
          }, 1500);
        }
      }, 500);

      return () => clearInterval(interval);
    };

    return waitForCookies();
  }, [user]);

  // Auto-close on success
  useEffect(() => {
    if (step === "success") {
      const timer = setTimeout(() => setOpen(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [step]);

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

  const captureContent = (
    <div className="px-8 py-10 text-center space-y-5">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Wallet className="h-7 w-7 text-primary" />
      </div>

      <div className="space-y-1.5">
        <DialogTitle className="text-2xl font-extrabold text-foreground">
          $100 MXN de crédito
        </DialogTitle>
        <p className="text-sm text-muted-foreground">
          Para tu próximo servicio en Chamby
        </p>
      </div>

      <p className="text-xs text-muted-foreground">
        Se aplica automáticamente después de tu primer servicio
      </p>

      <div className="space-y-3">
        <Input
          type="email"
          placeholder="Tu correo"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          className="h-[52px] text-base rounded-lg border-border bg-background"
          autoFocus
        />
        <Button
          onClick={handleSubmit}
          disabled={loading || !email || !email.includes("@")}
          className="w-full h-[52px] rounded-lg bg-foreground hover:bg-foreground/90 text-background font-semibold text-base transition-all duration-200"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Activar crédito"}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        Sin spam. Crédito válido por 14 días.
      </p>
    </div>
  );

  const successContent = (
    <div className="px-8 py-10 text-center space-y-4">
      <div className="mx-auto w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center">
        <CheckCircle className="h-7 w-7 text-primary" />
      </div>
      <div>
        <h3 className="text-xl font-bold text-foreground">Crédito activado</h3>
        <p className="text-2xl font-bold text-primary mt-1">$100 MXN listo para usar</p>
      </div>
    </div>
  );

  const modalContent = step === "capture" ? captureContent : successContent;

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="border-t border-border/40 rounded-t-3xl bg-background p-0 overflow-hidden">
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[440px] rounded-3xl border border-border/40 shadow-2xl bg-background p-0 overflow-hidden [&>button]:hidden">
        {modalContent}
      </DialogContent>
    </Dialog>
  );
}
