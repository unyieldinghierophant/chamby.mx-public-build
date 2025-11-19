import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ProviderSidebar } from "@/components/provider-portal/ProviderSidebar";
import { ProviderTopBar } from "@/components/provider-portal/ProviderTopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";

const ProviderPortal = () => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useProfile();

  // Show loading state while checking auth
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/auth/tasker" replace />;
  }

  // Allow access if login context was 'tasker' (new signups) or if already a tasker
  const loginContext = localStorage.getItem('login_context');
  if (!profile?.is_tasker && loginContext !== 'tasker') {
    return <Navigate to="/become-provider" replace />;
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
