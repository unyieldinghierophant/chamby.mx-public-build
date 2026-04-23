import { useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import ProviderStripePayoutStatusCard from "@/components/provider-portal/ProviderStripePayoutStatusCard";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  User,
  Star,
  FileText,
  DollarSign,
  ChevronRight,
  BadgeCheck,
  LogOut,
  Trash2,
  Loader2,
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  onClick?: () => void;
  badge?: string;
  hidden?: boolean;
  destructive?: boolean;
}

const ProviderAccount = () => {
  const { user, signOut } = useAuth();
  const { profile } = useProfile();
  const { profile: providerProfile, refetch } = useProviderProfile(user?.id);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [verifyingStripe, setVerifyingStripe] = useState(false);

  // On return from Stripe: call sync-stripe-status, refresh the provider
  // profile, then strip the `stripe_connected` query param so a browser
  // back/forward doesn't retrigger the sync. useRef-style guard prevents
  // double-fire under React 18 StrictMode.
  useEffect(() => {
    if (searchParams.get("stripe_connected") !== "true") return;
    let cancelled = false;
    setVerifyingStripe(true);

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("sync-stripe-status");
        if (cancelled) return;
        if (error) {
          toast.error(error.message || "No se pudo verificar el estado de tu cuenta de Stripe.");
        } else if (data?.payouts_enabled) {
          toast.success("¡Pagos activados! Ya puedes recibir transferencias.");
        } else {
          toast.warning("Stripe requiere información adicional para activar tu cuenta.");
        }
        await refetch();
      } catch (e: any) {
        if (!cancelled) toast.error(e?.message || "Error al verificar tu cuenta de Stripe.");
      } finally {
        if (!cancelled) {
          setVerifyingStripe(false);
          // Remove ?stripe_connected=true from the URL without a page reload.
          const url = new URL(window.location.href);
          url.searchParams.delete("stripe_connected");
          window.history.replaceState({}, "", url.toString());
        }
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const menuSections: { title: string; items: MenuItem[] }[] = [
    {
      title: "Mi Cuenta",
      items: [
        {
          label: "Editar Perfil",
          icon: User,
          path: "/provider-portal/profile",
        },
        {
          label: "Reseñas y Calificaciones",
          icon: Star,
          path: "/provider-portal/reviews",
          badge: providerProfile?.total_reviews
            ? `${providerProfile.total_reviews}`
            : undefined,
        },
      ],
    },
    {
      title: "Finanzas",
      items: [
        {
          label: "Mis Facturas",
          icon: FileText,
          path: "/provider/invoices",
        },
        {
          label: "Ganancias",
          icon: DollarSign,
          path: "/provider/earnings",
        },
      ],
    },
    {
      title: "",
      items: [
        {
          label: "Cerrar Sesión",
          icon: LogOut,
          onClick: handleSignOut,
          destructive: true,
        },
      ],
    },
    {
      title: "Zona de Peligro",
      items: [
        {
          label: "Eliminar mi cuenta",
          icon: Trash2,
          path: "/provider-portal/account/delete",
          destructive: true,
        },
      ],
    },
  ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-28">
      {/* Full-page overlay while we re-sync with Stripe after OAuth return. */}
      {verifyingStripe && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-foreground">
            Verificando tu cuenta de Stripe...
          </p>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Profile Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-border">
              <AvatarImage
                src={providerProfile?.avatar_url || profile?.avatar_url}
                alt={profile?.full_name || "Provider"}
              />
              <AvatarFallback className="text-lg font-bold bg-primary/10 text-primary">
                {getInitials(
                  profile?.full_name ||
                    providerProfile?.display_name ||
                    "CH"
                )}
              </AvatarFallback>
            </Avatar>
            {providerProfile?.verified && (
              <div className="absolute -bottom-0.5 -right-0.5 bg-background rounded-full p-0.5">
                <BadgeCheck className="w-5 h-5 text-primary fill-primary/20" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate font-jakarta">
              {profile?.full_name || providerProfile?.display_name || "Mi Cuenta"}
            </h1>
            <p className="text-sm text-muted-foreground truncate">
              Proveedor
            </p>
            {providerProfile?.rating != null && providerProfile.rating > 0 && (
              <div className="flex items-center gap-1 mt-0.5">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span className="text-sm font-medium">
                  {Number(providerProfile.rating ?? 0).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({providerProfile.total_reviews || 0} reseñas)
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Stripe Payout Status */}
        <div className="mb-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
            Pagos
          </p>
          <ProviderStripePayoutStatusCard
            stripeOnboardingStatus={providerProfile?.stripe_onboarding_status || "not_started"}
            stripeAccountId={providerProfile?.stripe_account_id || null}
            stripePayoutsEnabled={(providerProfile as any)?.stripe_payouts_enabled ?? false}
            stripeCurrentlyDue={((providerProfile as any)?.stripe_requirements_currently_due as string[]) ?? []}
            onStatusChange={refetch}
          />
        </div>

        {/* Menu Sections */}
        <div className="space-y-4">
          {menuSections.map((section, sIdx) => (
            <div key={sIdx}>
              {section.title && (
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  {section.title}
                </p>
              )}
              <div className="rounded-xl border border-border bg-card overflow-hidden">
                {section.items
                  .filter((item) => !item.hidden)
                  .map((item, iIdx) => {
                    const Icon = item.icon;
                    return (
                      <button
                        key={iIdx}
                        onClick={() => {
                          if (item.onClick) item.onClick();
                          else if (item.path) navigate(item.path);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors active:bg-accent/50
                          ${iIdx > 0 ? "border-t border-border" : ""}
                          ${item.destructive ? "text-destructive" : "text-foreground"}
                        `}
                      >
                        <Icon
                          className={`w-5 h-5 flex-shrink-0 ${
                            item.destructive
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }`}
                        />
                        <span className="flex-1 text-sm font-medium">
                          {item.label}
                        </span>
                        {item.badge && (
                          <span className="px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground">
                            {item.badge}
                          </span>
                        )}
                        {!item.destructive && (
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        )}
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default ProviderAccount;
