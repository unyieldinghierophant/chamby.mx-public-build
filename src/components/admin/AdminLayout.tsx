import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  DollarSign, 
  MessageSquare, 
  Settings, 
  Shield,
  LogOut,
  Menu
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
} from '@/components/ui/sidebar';

interface AdminLayoutProps {
  children: ReactNode;
}

const menuItems = [
  { 
    title: 'Dashboard', 
    icon: LayoutDashboard, 
    path: '/admin/dashboard',
    description: 'Overview & KPIs'
  },
  { 
    title: 'Users & Providers', 
    icon: Users, 
    path: '/admin/users',
    description: 'Manage users'
  },
  { 
    title: 'Jobs & Bookings', 
    icon: Briefcase, 
    path: '/admin/jobs',
    description: 'View all jobs'
  },
  { 
    title: 'Payments', 
    icon: DollarSign, 
    path: '/admin/payments',
    description: 'Escrow & payouts'
  },
  { 
    title: 'Support', 
    icon: MessageSquare, 
    path: '/admin/support',
    description: 'Disputes & tickets'
  },
  { 
    title: 'Content', 
    icon: Settings, 
    path: '/admin/content',
    description: 'CMS & categories'
  },
  { 
    title: 'Admin Roles', 
    icon: Shield, 
    path: '/admin/roles',
    description: 'Permissions'
  },
];

export const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border">
          <div className="p-6 border-b border-border">
            <Link to="/admin/dashboard" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-foreground">Chamby Admin</h2>
                <p className="text-xs text-muted-foreground">Control Panel</p>
              </div>
            </Link>
          </div>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>Main Menu</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    return (
                      <SidebarMenuItem key={item.path}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <Link to={item.path} className="flex items-center gap-3">
                            <item.icon className="w-4 h-4" />
                            <div className="flex flex-col">
                              <span className="font-medium">{item.title}</span>
                              <span className="text-xs text-muted-foreground">
                                {item.description}
                              </span>
                            </div>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <div className="p-4 border-t border-border mt-auto">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2" 
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          </div>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger>
                <Button variant="ghost" size="icon">
                  <Menu className="w-5 h-5" />
                </Button>
              </SidebarTrigger>
              <h1 className="text-xl font-semibold text-foreground">
                {menuItems.find(item => item.path === location.pathname)?.title || 'Admin Panel'}
              </h1>
            </div>
            
            <div className="flex items-center gap-4">
              <Link to="/" target="_blank">
                <Button variant="outline" size="sm">
                  View Site
                </Button>
              </Link>
            </div>
          </header>

          <div className="flex-1 p-6 overflow-auto">
            {children}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};
