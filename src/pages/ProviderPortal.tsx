import { useState } from "react";
import { Outlet } from "react-router-dom";
import { ProviderSidebar } from "@/components/provider-portal/ProviderSidebar";
import { ProviderTopBar } from "@/components/provider-portal/ProviderTopBar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { ROUTES } from "@/constants/routes";

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
    return <Navigate to={ROUTES.PROVIDER_AUTH} replace />;
  }

  // Check if user has provider role
  const loginContext = localStorage.getItem('login_context');
  const hasProviderRole = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'provider')
      .single();
    
    return !!data;
  };

  // If not a provider and not in provider login context, redirect
  if (loginContext !== 'provider' && profile) {
    hasProviderRole().then(isProvider => {
      if (!isProvider) {
        window.location.href = ROUTES.PROVIDER_AUTH;
      }
    });
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
