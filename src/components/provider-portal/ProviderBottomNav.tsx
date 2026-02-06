import { useLocation, useNavigate } from "react-router-dom";
import { Briefcase, History, User, MoreHorizontal, Home } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvailableJobsCount } from "@/hooks/useAvailableJobsCount";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  badge?: number;
}

export const ProviderBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { count: availableJobsCount } = useAvailableJobsCount();

  const navItems: NavItem[] = [
    {
      id: "home",
      label: "Inicio",
      icon: Home,
      path: "/provider-portal",
    },
    {
      id: "jobs",
      label: "Trabajos",
      icon: Briefcase,
      path: "/provider-portal/available-jobs",
      badge: availableJobsCount,
    },
    {
      id: "history",
      label: "Historial",
      icon: History,
      path: "/provider-portal/jobs",
    },
    {
      id: "profile",
      label: "Perfil",
      icon: User,
      path: "/provider-portal/profile",
    },
  ];

  const isActive = (path: string) => {
    if (path === "/provider-portal") {
      return location.pathname === "/provider-portal" || location.pathname === "/provider-portal/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around py-2 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all duration-200",
                active
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-6 w-6 mb-1", active && "scale-110")} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 min-w-[18px] h-[18px] bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[11px] font-medium",
                active && "font-semibold"
              )}>
                {item.label}
              </span>
              {active && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
