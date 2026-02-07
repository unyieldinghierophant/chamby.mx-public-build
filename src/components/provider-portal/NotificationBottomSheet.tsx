import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Bell, ChevronRight, CheckCircle, AlertCircle, Briefcase, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
  link?: string | null;
}

interface NotificationBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
}

export const NotificationBottomSheet = ({ 
  isOpen, 
  onClose, 
  notifications,
  onMarkAsRead
}: NotificationBottomSheetProps) => {
  const navigate = useNavigate();
  
  // Show only last 3 notifications
  const recentNotifications = notifications.slice(0, 3);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'job_assigned':
      case 'new_job':
        return <Briefcase className="w-4 h-4 text-primary" />;
      case 'payment':
        return <DollarSign className="w-4 h-4 text-green-600" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      default:
        return <Bell className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      onClose();
    }
  };

  const handleViewAll = () => {
    navigate('/provider-portal/notifications');
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader className="border-b border-border pb-3">
          <DrawerTitle className="flex items-center gap-2 text-base">
            <Bell className="w-4 h-4" />
            Notificaciones
          </DrawerTitle>
        </DrawerHeader>

        <div className="p-4 space-y-2 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-12 h-12 rounded-full bg-muted mx-auto flex items-center justify-center mb-2">
                <Bell className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                No tienes notificaciones
              </p>
            </div>
          ) : (
            <>
              {recentNotifications.map((notification) => (
                <button
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={cn(
                    "w-full text-left p-3 rounded-lg transition-colors",
                    notification.read 
                      ? "bg-muted/50" 
                      : "bg-primary/5 border border-primary/20"
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm line-clamp-1",
                        !notification.read && "font-medium"
                      )}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notification.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {formatDistanceToNow(new Date(notification.created_at), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </p>
                    </div>
                    {!notification.read && (
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              ))}

              <Button
                variant="outline"
                className="w-full mt-2"
                onClick={handleViewAll}
              >
                Ver todas las notificaciones
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
