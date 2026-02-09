import { useLocation, useNavigate } from "react-router-dom";
import { Home, MessageSquare, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSupportMessages } from "@/hooks/useSupportMessages";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
}

export const ProviderBottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadCount: supportUnread } = useSupportMessages();

  const navItems: NavItem[] = [
    { id: "home", label: "Inicio", icon: Home, path: "/provider-portal" },
    { id: "messages", label: "Mensajes", icon: MessageSquare, path: "/provider-portal/messages" },
    { id: "activity", label: "Actividad", icon: Clock, path: "/provider-portal/jobs" },
    { id: "account", label: "Cuenta", icon: User, path: "/provider-portal/account" },
  ];

  const isActive = (item: NavItem) => {
    if (item.id === "home") {
      return location.pathname === "/provider-portal" || location.pathname === "/provider-portal/";
    }
    if (item.id === "activity") {
      return location.pathname === "/provider-portal/jobs";
    }
    if (item.id === "messages") {
      return location.pathname.startsWith("/provider-portal/messages");
    }
    if (item.id === "account") {
      return location.pathname.startsWith("/provider-portal/account") || location.pathname.startsWith("/provider-portal/profile");
    }
    return location.pathname.startsWith(item.path);
  };

  const handleNavClick = (item: NavItem) => {
    navigate(item.path);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 safe-area-bottom">
      <div className="relative mx-3 mb-2">
        {/* Background pill */}
        <div className="bg-background rounded-2xl shadow-[0_-2px_20px_rgba(0,0,0,0.08)] border border-border/50">
          <div className="flex items-end justify-around h-16 px-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex flex-col items-center justify-center py-2 min-w-[56px]"
                >
                  <div className="relative">
                    <motion.div
                      initial={false}
                      animate={active ? { scale: 1 } : { scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary"
                    />
                    <Icon
                      className={cn(
                        "h-[22px] w-[22px] transition-colors duration-200",
                        active ? "text-foreground" : "text-muted-foreground"
                      )}
                    />
                    {item.id === "messages" && supportUnread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-[16px] bg-destructive text-destructive-foreground text-[9px] font-bold rounded-full flex items-center justify-center px-1">
                        {supportUnread > 99 ? '99+' : supportUnread}
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "text-[10px] mt-1 transition-colors duration-200",
                      active ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                    )}
                  >
                    {item.label}
                  </span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};
