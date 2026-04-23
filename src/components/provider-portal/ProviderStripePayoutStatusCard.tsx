import { useState, useEffect, useRef } from "react";
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  CreditCard,
  CheckCircle,
  ArrowRight,
  Loader2,
  Info,
  ExternalLink,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  FlaskConical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

/**
 * Narrow the (status, payouts_enabled) pair down to a single UI state.
 * Keeps rendering simple and makes each case easy to reason about.
 */
type UiState = "not_started" | "onboarding" | "enabled_active" | "enabled_requires_info";

function resolveUiState(status: string, payoutsEnabled: boolean): UiState {
  if (status === "enabled") return payoutsEnabled ? "enabled_active" : "enabled_requires_info";
  if (status === "onboarding") return "onboarding";
  return "not_started";
}

/** Is the loaded Stripe publishable key in test mode? */
const IS_STRIPE_TEST_MODE = (() => {
  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
  return typeof key === "string" && key.startsWith("pk_test_");
})();

/* ── Human-friendly mapping of Stripe requirement keys ── */
const REQUIREMENT_LABELS: Record<string, string> = {
  "individual.first_name": "Nombre",
  "individual.last_name": "Apellido",
  "individual.dob.day": "Fecha de nacimiento (día)",
  "individual.dob.month": "Fecha de nacimiento (mes)",
  "individual.dob.year": "Fecha de nacimiento (año)",
  "individual.address.line1": "Dirección (línea 1)",
  "individual.address.city": "Ciudad",
  "individual.address.state": "Estado",
  "individual.address.postal_code": "Código postal",
  "individual.address.country": "País",
  "individual.email": "Correo electrónico",
  "individual.phone": "Teléfono",
  "individual.id_number": "CURP / RFC",
  "individual.verification.document": "Documento de identidad (INE)",
  "individual.verification.additional_document": "Comprobante de domicilio",
  "external_account": "Cuenta bancaria (CLABE)",
  "tos_acceptance.date": "Aceptar términos de servicio",
  "tos_acceptance.ip": "Aceptar términos de servicio",
  "business_profile.url": "Sitio web del negocio",
  "business_profile.mcc": "Categoría del negocio",
};

function getRequirementLabel(key: string): string {
  return REQUIREMENT_LABELS[key] || key.replace(/[._]/g, " ");
}

interface Props {
  stripeOnboardingStatus: string;
  stripeAccountId: string | null;
  stripePayoutsEnabled?: boolean;
  stripeCurrentlyDue?: string[];
  onStatusChange?: () => void;
  compact?: boolean;
}

const ProviderStripePayoutStatusCard = ({
  stripeOnboardingStatus,
  stripeAccountId,
  stripePayoutsEnabled = false,
  stripeCurrentlyDue = [],
  onStatusChange,
  compact = false,
}: Props) => {
  const [loading, setLoading] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const syncAttempted = useRef(false);

  // Auto-sync when card loads if provider has stripe_account_id but fields look stale
  useEffect(() => {
    if (syncAttempted.current) return;
    if (!stripeAccountId) return;
    // If status is not "enabled" and we have no currently_due data, trigger a sync
    const isStale =
      stripeOnboardingStatus !== "enabled" &&
      stripeCurrentlyDue.length === 0 &&
      !stripePayoutsEnabled;
    if (!isStale) return;

    syncAttempted.current = true;
    setSyncing(true);

    supabase.functions
      .invoke("sync-stripe-status")
      .then(() => {
        onStatusChange?.();
      })
      .catch(() => {
        // Silently fail — card still works with existing data
      })
      .finally(() => setSyncing(false));
  }, [stripeAccountId, stripeOnboardingStatus, stripeCurrentlyDue, stripePayoutsEnabled, onStatusChange]);

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

  /** Manual "Verificar estado" — re-queries Stripe and refreshes the card. */
  const handleManualSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-stripe-status");
      if (error) throw new Error(error.message);
      if (data?.payouts_enabled) {
        toast.success("Tu cuenta está activa para recibir pagos.");
      } else if (data?.onboarding_status === "enabled") {
        toast.warning("Stripe requiere información adicional para activar tus pagos.");
      } else {
        toast.message("Estado actualizado. Completa la verificación para recibir pagos.");
      }
      onStatusChange?.();
    } catch (err: any) {
      toast.error(err.message || "No se pudo verificar el estado en Stripe.");
    } finally {
      setSyncing(false);
    }
  };

  const status = stripeOnboardingStatus || "not_started";
  const hasRequirements = stripeCurrentlyDue.length > 0;
  const uiState = resolveUiState(status, stripePayoutsEnabled);

  /* ── Compact card ── */
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
              : hasRequirements
              ? "border-orange-200 dark:border-orange-800/50"
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
                  : hasRequirements
                  ? "bg-orange-100 dark:bg-orange-900/30"
                  : "bg-amber-100 dark:bg-amber-900/30"
              )}
            >
              {status === "enabled" ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : hasRequirements ? (
                <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
              ) : (
                <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-foreground truncate">
                {status === "enabled"
                  ? "Pagos activados"
                  : hasRequirements
                  ? "Verificación pendiente"
                  : status === "onboarding"
                  ? "Pagos en progreso"
                  : "Activa tus pagos"}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {syncing
                  ? "Actualizando estatus…"
                  : status === "enabled"
                  ? "Depósitos automáticos"
                  : hasRequirements
                  ? `${stripeCurrentlyDue.length} dato(s) faltante(s)`
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

        <StripeInfoModal open={showInfoModal} onClose={() => setShowInfoModal(false)} />
      </motion.div>
    );
  }

  /* ── Full card ── */
  // Per-state palette — see resolveUiState() above.
  const palette: Record<UiState, {
    border: string;
    iconBg: string;
    iconColor: string;
    icon: typeof CheckCircle;
    title: string;
    subtitle: string;
    badgeLabel?: string;
    badgeClass?: string;
    primaryLabel: string;
    primaryAction: () => void | Promise<void>;
  }> = {
    not_started: {
      border: "border-border",
      iconBg: "bg-muted",
      iconColor: "text-muted-foreground",
      icon: CreditCard,
      title: "Activa tus pagos",
      subtitle: "Configura tu cuenta de pagos para recibir transferencias.",
      primaryLabel: "Configurar pagos",
      primaryAction: handleConnectStripe,
    },
    onboarding: {
      border: "border-amber-200 dark:border-amber-800/50",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      icon: AlertTriangle,
      title: "Configuración en progreso",
      subtitle: "Tu cuenta está siendo verificada.",
      primaryLabel: hasRequirements ? "Completar verificación" : "Continuar configuración",
      primaryAction: handleConnectStripe,
    },
    enabled_active: {
      border: "border-emerald-200 dark:border-emerald-800/50",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      icon: CheckCircle,
      title: "Pagos activos",
      subtitle: "Los fondos se depositan automáticamente en tu cuenta bancaria registrada.",
      badgeLabel: "Conectado",
      badgeClass: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400",
      primaryLabel: "Ver detalles",
      primaryAction: () => setShowInfoModal(true),
    },
    enabled_requires_info: {
      border: "border-amber-200 dark:border-amber-800/50",
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
      icon: AlertTriangle,
      title: "Stripe requiere información adicional",
      subtitle: "Completa los datos pendientes para activar tus pagos.",
      primaryLabel: "Completar verificación",
      primaryAction: handleConnectStripe,
    },
  };
  const p = palette[uiState];
  const PrimaryIcon = p.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-3"
    >
      {/* Test-mode banner — only shows when the Vite key starts with pk_test_ */}
      {IS_STRIPE_TEST_MODE && (
        <div className="flex items-start gap-2 rounded-lg border border-amber-200 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-900/10 p-3">
          <FlaskConical className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
            Stripe está en modo de prueba. Los pagos reales no serán procesados hasta activar modo producción.
          </p>
        </div>
      )}

      <Card className={cn("border overflow-hidden", p.border)}>
        <CardContent className="p-5">
          {/* Icon + title row */}
          <div className="flex items-start gap-3 mb-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", p.iconBg)}>
              <PrimaryIcon className={cn("w-5 h-5", p.iconColor)} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-foreground">{p.title}</h3>
                {p.badgeLabel && (
                  <Badge variant="secondary" className={cn("text-[10px]", p.badgeClass)}>
                    {p.badgeLabel}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {syncing ? "Actualizando estatus de Stripe…" : p.subtitle}
              </p>
            </div>
          </div>

          {/* Requirements list — only meaningful when not yet enabled */}
          {hasRequirements && uiState !== "enabled_active" && (
            <div className="mb-3 rounded-lg bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800/30 p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs font-semibold text-orange-700 dark:text-orange-400">
                  Datos faltantes
                </span>
                <WhyTooltip />
              </div>
              <ul className="space-y-1">
                {stripeCurrentlyDue.slice(0, 6).map((key) => (
                  <li
                    key={key}
                    className="text-[11px] text-orange-600 dark:text-orange-300 flex items-center gap-1.5"
                  >
                    <span className="w-1 h-1 rounded-full bg-orange-400 flex-shrink-0" />
                    {getRequirementLabel(key)}
                  </li>
                ))}
                {stripeCurrentlyDue.length > 6 && (
                  <li className="text-[11px] text-orange-500 dark:text-orange-400 pl-2.5">
                    +{stripeCurrentlyDue.length - 6} más…
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Actions — primary + always-visible "Verificar estado" */}
          <div className="space-y-2">
            <Button
              size="sm"
              className="w-full text-xs"
              variant={uiState === "enabled_active" ? "outline" : "default"}
              onClick={() => p.primaryAction()}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : uiState === "enabled_active" ? (
                <Info className="w-3.5 h-3.5 mr-1.5" />
              ) : (
                <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              )}
              {p.primaryLabel}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              onClick={handleManualSync}
              disabled={syncing}
            >
              {syncing ? (
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
              ) : (
                <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              )}
              Verificar estado
            </Button>

            {uiState === "onboarding" && !hasRequirements && (
              <p className="text-[10px] text-muted-foreground text-center">
                En algunos casos Stripe puede tardar en verificar tu información.
              </p>
            )}

            {uiState === "not_started" && (
              <button
                onClick={() => setShowInfoModal(true)}
                className="w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors text-center py-1"
              >
                ¿Por qué es necesario?
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <StripeInfoModal open={showInfoModal} onClose={() => setShowInfoModal(false)} />
    </motion.div>
  );
};

/* ── Tooltip explaining why Stripe asks for data ── */
const WhyTooltip = () => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger asChild>
        <HelpCircle className="w-3 h-3 text-orange-400 cursor-help" />
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-[220px] text-xs">
        Stripe requiere estos datos por regulación (KYC). Chamby no los solicita directamente.
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

/* ── Info modal ── */
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
