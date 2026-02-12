import { useState, useEffect } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { ProviderSidebar } from "@/components/provider-portal/ProviderSidebar";
import { ProviderTopBar } from "@/components/provider-portal/ProviderTopBar";
import { ProviderBottomNav } from "@/components/provider-portal/ProviderBottomNav";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ROUTES } from "@/constants/routes";
import { supabase } from "@/integrations/supabase/client";


const ProviderPortalContent = () => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [checkingOnboarding, setCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  // Check if provider has completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user || authLoading || roleLoading) {
        return;
      }

      const hasProviderRole = roles.includes('provider');
      const hasAdminRole = roles.includes('admin');

      if (!hasProviderRole && !hasAdminRole) {
        setCheckingOnboarding(false);
        return;
      }

      // Check if provider profile is complete
      const { data: providerData } = await supabase
        .from('providers')
        .select('skills, zone_served, display_name, onboarding_complete')
        .eq('user_id', user.id)
        .maybeSingle();

      const hasSkills = providerData && 
        providerData.skills && 
        providerData.skills.length > 0;

      // Self-heal: if skills exist but onboarding_complete is false, fix the flag
      if (hasSkills && !providerData.onboarding_complete) {
        console.log('[ProviderPortal] Self-healing: skills exist but onboarding_complete=false, fixing...');
        await supabase
          .from('providers')
          .update({ onboarding_complete: true, onboarding_step: 'completed' })
          .eq('user_id', user.id);
      }

      setOnboardingComplete(!!hasSkills);
      
      // If profile incomplete, redirect to onboarding wizard
      if (!hasSkills) {
        navigate(ROUTES.PROVIDER_ONBOARDING_WIZARD, { replace: true });
        return;
      }

      setCheckingOnboarding(false);
    };

    checkOnboardingStatus();
  }, [user, authLoading, roleLoading, roles, navigate]);

  // Show loading state while checking auth, roles, and onboarding
  if (authLoading || roleLoading || checkingOnboarding) {
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
    <div className="min-h-screen flex w-full max-w-full bg-background overflow-x-hidden">
      <ProviderSidebar />
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Desktop Top Bar */}
        <ProviderTopBar />
        
        {/* Main Content - No extra top padding on mobile since floating header removed */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-0 pb-20 md:pb-0 w-full max-w-full">
          <Outlet />
        </main>
        
        {/* Mobile Bottom Navigation */}
        <ProviderBottomNav />
      </div>
    </div>
  );
};

const ProviderPortal = () => {
  return (
    <SidebarProvider>
      <ProviderPortalContent />
    </SidebarProvider>
  );
};

export default ProviderPortal;
