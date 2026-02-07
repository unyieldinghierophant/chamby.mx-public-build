import { useState, useEffect } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { Menu } from "lucide-react";
import { ProviderSidebar } from "@/components/provider-portal/ProviderSidebar";
import { ProviderTopBar } from "@/components/provider-portal/ProviderTopBar";
import { ProviderBottomNav } from "@/components/provider-portal/ProviderBottomNav";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { ROUTES } from "@/constants/routes";
import { supabase } from "@/integrations/supabase/client";
import chambyLogo from "@/assets/chamby-logo-new-horizontal.png";

// Floating mobile header component
const MobileFloatingHeader = () => {
  const { toggleSidebar } = useSidebar();
  const navigate = useNavigate();

  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <img 
          src={chambyLogo} 
          alt="Chamby" 
          className="h-7 cursor-pointer" 
          onClick={() => navigate('/provider-portal')}
        />
        
        {/* Hamburger Menu Button - Larger */}
        <button
          onClick={toggleSidebar}
          className="h-10 w-10 flex items-center justify-center rounded-lg bg-muted active:bg-muted/80 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};

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
        .select('skills, zone_served, display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      const isComplete = providerData && 
        providerData.skills && 
        providerData.skills.length > 0;

      setOnboardingComplete(!!isComplete);
      
      // If profile incomplete, redirect to onboarding wizard
      if (!isComplete) {
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
        {/* Mobile Floating Header */}
        <MobileFloatingHeader />
        
        {/* Desktop Top Bar */}
        <ProviderTopBar />
        
        {/* Main Content - Add padding-top for mobile header */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden pt-14 md:pt-0 pb-20 md:pb-0 w-full max-w-full">
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
