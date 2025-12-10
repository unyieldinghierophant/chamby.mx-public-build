import { Outlet, Navigate } from "react-router-dom";
import { ProviderSidebar } from "@/components/provider-portal/ProviderSidebar";
import { ProviderTopBar } from "@/components/provider-portal/ProviderTopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ROUTES } from "@/constants/routes";

const ProviderPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading } = useUserRole();

  // Show loading state while checking auth and roles
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to={ROUTES.PROVIDER_AUTH} replace />;
  }

  // Check if user has provider or admin role
  const hasProviderRole = roles.includes('provider');
  const hasAdminRole = roles.includes('admin');

  // If user doesn't have provider/admin role, redirect to provider auth
  if (!hasProviderRole && !hasAdminRole) {
    return <Navigate to={ROUTES.PROVIDER_AUTH} replace />;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <ProviderSidebar />
        <div className="flex-1 flex flex-col">
          <ProviderTopBar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ProviderPortal;
