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
import chambyLogo from "@/assets/chamby-logo-new.png";

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

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <div className="p-4 border-b border-border flex items-center justify-between">
        {!collapsed && (
          <img src={chambyLogo} alt="Chamby" className="h-8" />
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
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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
