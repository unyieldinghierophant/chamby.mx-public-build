import { useState } from "react";
import { Bell, ChevronDown, Menu } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useProfile } from "@/hooks/useProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationBottomSheet } from "@/components/provider-portal/NotificationBottomSheet";
import chambyLogo from "@/assets/chamby-logo-new-horizontal.png";
import { useSidebar } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

export function ProviderTopBar() {
  const { profile } = useProfile();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { notifications, markAsRead } = useNotifications();
  const { toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const [showNotificationSheet, setShowNotificationSheet] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleSignOut = async () => {
    await signOut();
    navigate("/provider-landing");
  };

  const handleBellClick = () => {
    if (isMobile) {
      setShowNotificationSheet(true);
    } else {
      navigate('/provider-portal/notifications');
    }
  };

  return (
    <>
      <header className="h-14 border-b border-border bg-background/95 backdrop-blur-lg px-3 md:px-6 flex items-center justify-between sticky top-0 z-20 w-full max-w-full overflow-hidden">
        <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
          {/* Mobile menu button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden h-8 w-8 flex-shrink-0"
            onClick={toggleSidebar}
          >
            <Menu className="h-4 w-4" />
          </Button>

          {/* Logo - Smaller on mobile */}
          <img 
            src={chambyLogo} 
            alt="Chamby" 
            className="h-7 md:h-12 cursor-pointer flex-shrink-0" 
            onClick={() => navigate('/provider-portal')}
          />
        </div>

        <div className="flex items-center gap-1 md:gap-3 flex-shrink-0">
          {/* Notifications */}
          <Button 
            variant="ghost" 
            size="icon"
            className="relative h-8 w-8 md:h-9 md:w-9"
            onClick={handleBellClick}
          >
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 min-w-[14px] h-[14px] md:min-w-[16px] md:h-[16px] bg-primary text-primary-foreground text-[8px] md:text-[9px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </Button>

          {/* Active requests button - Desktop only */}
          <Button 
            variant="default" 
            size="sm" 
            className="hidden md:flex"
            onClick={() => navigate('/provider-portal/jobs')}
          >
            Ver solicitudes activas
          </Button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-1 px-1 h-8 md:px-1.5 md:h-9">
                <Avatar className="h-6 w-6 md:h-7 md:w-7">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="text-[10px] md:text-xs">
                    {profile?.full_name?.charAt(0) || "P"}
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="h-3 w-3 hidden md:block" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-lg z-50">
              <DropdownMenuItem onClick={() => navigate("/provider-portal/profile")}>
                Mi Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/provider-portal/verification")}>
                Verificación
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/provider-portal/earnings")}>
                Mis Ganancias
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Notification Bottom Sheet */}
      <NotificationBottomSheet
        isOpen={showNotificationSheet}
        onClose={() => setShowNotificationSheet(false)}
        notifications={notifications}
        onMarkAsRead={markAsRead}
      />
    </>
  );
}
