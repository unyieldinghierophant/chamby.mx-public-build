import { useLocation, useNavigate } from "react-router-dom";
import { Home, MessageSquare, Clock, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useSupportMessages } from "@/hooks/useSupportMessages";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
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
      <div className="relative mx-0 mb-0">
        <div className="bg-white" style={{ borderTop: '1px solid #f1f5f9', boxShadow: '0 -8px 32px rgba(0,0,0,0.06)' }}>
          <div className="grid grid-cols-4 py-2.5 pb-[22px]">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item);

              return (
                <motion.button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  whileTap={{ scale: 0.9 }}
                  className="relative flex flex-col items-center gap-1 py-1"
                >
                  {/* Icon wrap with active background */}
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors duration-150"
                    style={{
                      background: active ? 'rgba(12,85,173,0.1)' : 'transparent',
                    }}
                  >
                    <Icon
                      className="w-[21px] h-[21px]"
                      style={{ color: active ? '#0c55ad' : '#94a3b8' }}
                    />
                  </div>
                  
                  {/* Notification dot for messages */}
                  {item.id === "messages" && supportUnread > 0 && (
                    <div
                      className="absolute top-[2px] rounded-full"
                      style={{
                        right: 'calc(50% - 14px)',
                        width: 7,
                        height: 7,
                        background: '#ff4d6a',
                        border: '2px solid white',
                      }}
                    />
                  )}

                  <span
                    className="text-[10.5px] transition-colors duration-150"
                    style={{
                      fontWeight: active ? 800 : 600,
                      color: active ? '#0c55ad' : '#94a3b8',
                    }}
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
