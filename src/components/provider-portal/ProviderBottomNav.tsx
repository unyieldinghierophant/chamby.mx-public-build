import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Briefcase, History, User, Home, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAvailableJobsCount } from "@/hooks/useAvailableJobsCount";
import { useProviderNotifications } from "@/hooks/useProviderNotifications";
import { NotificationBottomSheet } from "@/components/provider-portal/NotificationBottomSheet";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  action?: () => void;
  badge?: number;
}

export const ProviderBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { count: availableJobsCount } = useAvailableJobsCount();
  const { notifications, unreadCount, markAsRead } = useProviderNotifications();
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);

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
      badge: availableJobsCount > 0 ? availableJobsCount : undefined,
    },
    {
      id: "notifications",
      label: "Notif",
      icon: Bell,
      action: () => setShowNotificationSheet(true),
      badge: unreadCount > 0 ? unreadCount : undefined,
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

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === "/provider-portal") {
      return location.pathname === "/provider-portal" || location.pathname === "/provider-portal/";
    }
    return location.pathname.startsWith(path);
  };

  const handleNavClick = (item: NavItem) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-14 px-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={cn(
                  "relative flex flex-col items-center justify-center min-w-[56px] h-12 rounded-lg transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground active:bg-muted"
                )}
              >
                <div className="relative">
                  <Icon className={cn("h-5 w-5", active && "text-primary")} />
                  {item.badge && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-[16px] bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1">
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

      {/* Notification Bottom Sheet */}
      <NotificationBottomSheet
        isOpen={showNotificationSheet}
        onClose={() => setShowNotificationSheet(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
      />
    </>
  );
};
