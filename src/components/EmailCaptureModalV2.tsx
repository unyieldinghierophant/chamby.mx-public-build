import { useState, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import chambyLogo from "@/assets/chamby-logo-new.png";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const STORAGE_KEY = "email_capture_seen_v2";
const COOKIE_KEY = "chamby_cookie_consent";

const CAROUSEL_IMAGES = [
  "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=800&h=500&fit=crop&q=80",
  "https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=800&h=500&fit=crop&q=80",
  "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=500&fit=crop&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&h=500&fit=crop&q=80",
];

const WaveDivider = () => (
  <svg
    className="absolute bottom-0 left-0 w-full"
    viewBox="0 0 1440 120"
    preserveAspectRatio="none"
    style={{ height: "60px", display: "block" }}
  >
    <path
      d="M0,64 C360,120 720,0 1080,64 C1260,96 1380,80 1440,64 L1440,120 L0,120 Z"
      className="fill-background"
    />
  </svg>
);

export function EmailCaptureModalV2() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"capture" | "success">("capture");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [currentImage, setCurrentImage] = useState(0);
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (user) return;
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Wait until cookie consent is resolved before showing
    const waitForCookies = () => {
      const consent = localStorage.getItem(COOKIE_KEY);
      if (consent) {
        // Cookie consent already handled — show after short delay
        const timer = setTimeout(() => {
          setOpen(true);
          sessionStorage.setItem(STORAGE_KEY, "1");
          localStorage.setItem(STORAGE_KEY, Date.now().toString());
        }, 1500);
        return () => clearTimeout(timer);
      }

      // Poll for cookie consent resolution
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

    const cleanup = waitForCookies();
    return cleanup;
  }, [user]);

  useEffect(() => {
    if (!open || step !== "capture") return;
    intervalRef.current = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 3500);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [open, step]);

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
    <div className="flex flex-col overflow-hidden">
      {/* ── Image Carousel ── */}
      <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] overflow-hidden bg-primary/10">
        <AnimatePresence mode="wait">
          <motion.img
            key={currentImage}
            src={CAROUSEL_IMAGES[currentImage]}
            alt="Servicios del hogar"
            className="absolute inset-0 w-full h-full object-cover"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          />
        </AnimatePresence>

        {/* Gradient scrim for close button visibility */}
        <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

        {/* Close button */}
        <button
          onClick={() => setOpen(false)}
          className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/60 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Carousel dots */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {CAROUSEL_IMAGES.map((_, i) => (
            <span
              key={i}
              className={`block w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                i === currentImage ? "bg-white w-4" : "bg-white/50"
              }`}
            />
          ))}
        </div>

        {/* Wavy SVG divider */}
        <WaveDivider />
      </div>

      {/* ── Bottom Content — clean card style ── */}
      <div className="px-8 pb-8 pt-4 sm:px-10 sm:pb-10 space-y-5">
        {/* Logo */}
        <div className="flex justify-center">
          <img src={chambyLogo} alt="Chamby" className="h-8 sm:h-9 object-contain" />
        </div>

        <div className="text-center space-y-2">
          <DialogTitle className="text-[22px] sm:text-2xl font-extrabold text-foreground leading-snug tracking-tight">
            Regístrate con tu email para recibir un código de descuento
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            (prometemos no spamearte)
          </p>
        </div>

        <div className="space-y-3">
          <Input
            type="email"
            placeholder="Tu correo aquí"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="h-[52px] text-base rounded-lg border-border bg-background"
            autoFocus
          />
          <Button
            onClick={handleSubmit}
            disabled={loading || !email}
            className="w-full h-[52px] rounded-lg bg-foreground hover:bg-foreground/90 text-background font-semibold text-base transition-all duration-200"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Continuar"}
          </Button>
        </div>
      </div>
    </div>
  );

  const successContent = (
    <div className="px-8 pb-8 pt-6 sm:px-10 sm:pb-10 text-center space-y-5">
      <div className="flex justify-center">
        <img src={chambyLogo} alt="Chamby" className="h-8 sm:h-9 object-contain" />
      </div>
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
        className="w-full h-[52px] rounded-lg bg-foreground hover:bg-foreground/90 text-background font-semibold"
      >
        ¡Entendido!
      </Button>
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
