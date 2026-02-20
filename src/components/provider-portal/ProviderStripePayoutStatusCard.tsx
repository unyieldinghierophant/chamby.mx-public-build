import { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  CreditCard,
  CheckCircle,
  ArrowRight,
  Loader2,
  Info,
  ExternalLink,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Props {
  stripeOnboardingStatus: string;
  stripeAccountId: string | null;
  onStatusChange?: () => void;
  compact?: boolean;
}

const ProviderStripePayoutStatusCard = ({
  stripeOnboardingStatus,
  stripeAccountId,
  onStatusChange,
  compact = false,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  const handleConnectStripe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "create-connect-account"
      );

      if (error) throw new Error(error.message);
      if (!data?.url) throw new Error("No se recibió enlace de Stripe");

      window.location.href = data.url;
    } catch (err: any) {
      toast.error(err.message || "Error al conectar con Stripe");
      setLoading(false);
    }
  };

  const status = stripeOnboardingStatus || "not_started";

  if (compact) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card
          className={cn(
            "border overflow-hidden cursor-pointer transition-colors active:bg-accent/30",
            status === "enabled"
              ? "border-emerald-200 dark:border-emerald-800/50"
              : "border-amber-200 dark:border-amber-800/50"
          )}
          onClick={() => {
            if (status === "enabled") setShowInfoModal(true);
            else handleConnectStripe();
          }}
        >
          <CardContent className="p-3 flex items-center gap-3">
            <div
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                status === "enabled"
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-amber-100 dark:bg-amber-900/30"
              )}
            >
              {status === "enabled" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {status === "enabled"
                  ? "Pagos activados"
                  : status === "onboarding"
                  ? "Pagos en progreso"
                  : "Activa tus pagos"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {status === "enabled"
                  ? "Depósitos automáticos"
                  : "Conecta Stripe"}
              </p>
            </div>
            {status === "enabled" ? (
              <Badge
                variant="secondary"
                className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px] px-1.5"
              >
                Conectado
              </Badge>
            ) : loading ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
            )}
          </CardContent>
        </Card>

        <StripeInfoModal
          open={showInfoModal}
          onClose={() => setShowInfoModal(false)}
        />
      </motion.div>
    );
  }

  // Full card
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card
        className={cn(
          "border overflow-hidden",
          status === "enabled"
            ? "border-emerald-200 dark:border-emerald-800/50"
            : "border-amber-200 dark:border-amber-800/50"
        )}
      >
        <CardContent className="p-5">
          {/* Icon + Title Row */}
          <div className="flex items-start gap-3 mb-3">
            <div
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                status === "enabled"
                  ? "bg-emerald-100 dark:bg-emerald-900/30"
                  : "bg-amber-100 dark:bg-amber-900/30"
              )}
            >
              {status === "enabled" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">
                  {status === "enabled"
                    ? "Pagos activados"
                    : status === "onboarding"
                    ? "Configuración de pagos en progreso"
                    : "Activa tus pagos"}
                </h3>
                {status === "enabled" && (
                  <Badge
                    variant="secondary"
                    className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 text-[10px]"
                  >
                    Conectado
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {status === "enabled"
                  ? "Ya puedes recibir depósitos automáticos."
                  : status === "onboarding"
                  ? "Completa Stripe para activar depósitos."
                  : "Conecta Stripe para recibir depósitos automáticos."}
              </p>
            </div>
          </div>

          {/* Actions */}
          {status === "enabled" ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs"
              onClick={() => setShowInfoModal(true)}
            >
              <Info className="w-3.5 h-3.5 mr-1.5" />
              Ver detalles
            </Button>
          ) : (
            <div className="space-y-2">
              <Button
                size="sm"
                className="w-full text-xs"
                onClick={handleConnectStripe}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                )}
                {status === "onboarding"
                  ? "Continuar configuración"
                  : "Conectar Stripe"}
              </Button>

              {status === "onboarding" && (
                <p className="text-[10px] text-muted-foreground text-center">
                  En algunos casos Stripe puede tardar en verificar tu
                  información.
                </p>
              )}

              {status === "not_started" && (
                <button
                  onClick={() => setShowInfoModal(true)}
                  className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors text-center py-1"
                >
                  ¿Por qué es necesario?
                </button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <StripeInfoModal
        open={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />
    </motion.div>
  );
};

const StripeInfoModal = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => (
  <Dialog open={open} onOpenChange={onClose}>
    <DialogContent className="max-w-sm">
      <DialogHeader>
        <DialogTitle className="text-base">Pagos con Stripe</DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground">
          Información sobre cómo funcionan tus pagos en Chamby.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-3 text-sm text-foreground/80">
        <p>
          Chamby usa <strong>Stripe</strong> para procesar pagos de forma segura
          y depositar tus ganancias directamente en tu cuenta bancaria.
        </p>
        <ul className="space-y-1.5 text-xs text-muted-foreground list-disc pl-4">
          <li>Tus datos bancarios están protegidos por Stripe.</li>
          <li>Los depósitos se procesan automáticamente después de cada trabajo completado.</li>
          <li>Puedes ver el estado de tus pagos en la sección de Ganancias.</li>
        </ul>
      </div>
    </DialogContent>
  </Dialog>
);

export default ProviderStripePayoutStatusCard;
