import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Briefcase,
  Calendar,
  Map,
  CreditCard,
  ShieldCheck,
  User,
  HeadphonesIcon,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import chambyLogo from "@/assets/chamby-logo-new.png";
import { useAvailableJobsCount } from "@/hooks/useAvailableJobsCount";

const menuItems = [
  { title: "Dashboard", url: "/provider-portal", icon: LayoutDashboard, end: true },
  { title: "Trabajos", url: "/provider-portal/jobs", icon: Briefcase },
  { title: "Calendario", url: "/provider-portal/calendar", icon: Calendar },
  { title: "Mapa", url: "/provider-portal/map", icon: Map },
  { title: "Pagos", url: "/provider-portal/payments", icon: CreditCard },
  { title: "Verificación", url: "/provider-portal/verification", icon: ShieldCheck },
  { title: "Perfil", url: "/provider-portal/profile", icon: User },
  { title: "Soporte", url: "/provider-portal/support", icon: HeadphonesIcon },
];

export function ProviderSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { count: availableJobsCount } = useAvailableJobsCount();

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="h-16 px-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <img src={chambyLogo} alt="Chamby" className="h-40" />
        )}
        <SidebarTrigger />
      </div>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Menú Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.end}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary/10 text-primary font-medium"
                          : "hover:bg-muted/50"
                      }
                    >
                      <div className="relative">
                        <item.icon className="h-4 w-4" />
                        {item.title === "Trabajos" && availableJobsCount > 0 && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-ping" />
                        )}
                      </div>
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1">
                          <span>{item.title}</span>
                          {item.title === "Trabajos" && availableJobsCount > 0 && (
                            <Badge 
                              variant="secondary" 
                              className="ml-auto bg-yellow-500/20 text-yellow-700 animate-pulse"
                            >
                              {availableJobsCount}
                            </Badge>
                          )}
                        </div>
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
