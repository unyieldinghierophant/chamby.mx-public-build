import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { useProviderProfile } from "@/hooks/useProviderProfile";
import {
  User,
  Star,
  FileText,
  DollarSign,
  ChevronRight,
  BadgeCheck,
  LogOut,
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
  const { profile: providerProfile } = useProviderProfile(user?.id);
  const navigate = useNavigate();

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
  ];

  return (
    <div className="px-4 py-6 max-w-lg mx-auto pb-28">
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
                  {providerProfile.rating.toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  ({providerProfile.total_reviews || 0} reseñas)
                </span>
              </div>
            )}
          </div>
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
