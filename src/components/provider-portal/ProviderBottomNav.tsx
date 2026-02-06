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
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={cn(
                "relative flex flex-col items-center justify-center min-w-[60px] h-12 rounded-lg transition-colors",
                active
                  ? "text-primary"
                  : "text-muted-foreground active:bg-muted"
              )}
            >
              <div className="relative">
                <Icon className={cn("h-5 w-5", active && "text-primary")} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-[16px] bg-primary text-primary-foreground text-[9px] font-bold rounded-full flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-0.5",
                active ? "font-semibold text-primary" : "font-medium"
              )}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
