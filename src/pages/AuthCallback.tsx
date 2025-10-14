import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { AuthSuccessOverlay } from "@/components/AuthSuccessOverlay";
import { supabase } from "@/integrations/supabase/client";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Check if this is an OAuth callback by detecting URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token');

  useEffect(() => {
    console.log('AuthCallback mounted', { 
      authLoading, 
      roleLoading, 
      user: !!user, 
      role,
      hasOAuthParams,
      url: window.location.href 
    });

    // If OAuth callback detected, try to explicitly get session for Safari
    if (hasOAuthParams && !user) {
      console.log('OAuth params detected, attempting explicit session recovery...');
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Explicit session check result:', !!session);
      });
    }
  }, []);

  useEffect(() => {
    console.log('Auth state changed', { authLoading, roleLoading, user: !!user, role, retryCount });
    
    // Only show success if we have a user and roles are loaded
    if (!authLoading && !roleLoading && user && role) {
      console.log('Showing success overlay');
      setSuccessMessage("¡Autenticación exitosa!");
      setShowSuccess(true);
    }
  }, [user, role, authLoading, roleLoading, retryCount]);

  const handleSuccessComplete = () => {
    console.log('Success complete, redirecting to:', role === "provider" ? "/provider-dashboard" : "/user-landing");
    if (role === "provider") {
      navigate("/provider-dashboard", { replace: true });
    } else {
      navigate("/user-landing", { replace: true });
    }
  };

  // Safari ITP handling: Wait for session restoration if OAuth callback detected
  useEffect(() => {
    if (!authLoading && !roleLoading && !user && hasOAuthParams && retryCount < 6) {
      console.log(`Waiting for Safari session restoration... attempt ${retryCount + 1}/6`);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Only redirect to login if no OAuth params AND we've waited long enough
    if (!authLoading && !roleLoading && !user && !hasOAuthParams) {
      console.log('No user and no OAuth params, redirecting to login');
      navigate("/auth/user", { replace: true });
    }

    // Last resort: if we've waited 3 seconds and still no user
    if (!authLoading && !roleLoading && !user && hasOAuthParams && retryCount >= 6) {
      console.error('Safari session restoration failed after 3 seconds');
      navigate("/auth/user", { replace: true });
    }
  }, [authLoading, roleLoading, user, hasOAuthParams, retryCount, navigate]);

  // Show loading while determining where to redirect
  if (authLoading || roleLoading || (hasOAuthParams && !user && retryCount < 6)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">
            {hasOAuthParams && !user ? 'Completando autenticación...' : 'Verificando...'}
          </p>
        </div>
      </div>
    );
  }

  // If still no user after all attempts, will be handled by redirect effect above
  if (!user) {
    return null;
  }

  // Show success overlay
  if (showSuccess) {
    return <AuthSuccessOverlay message={successMessage} onComplete={handleSuccessComplete} />;
  }

  // Fallback redirect
  return null;
};

export default AuthCallback;
