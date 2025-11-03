import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { AuthSuccessOverlay } from "@/components/AuthSuccessOverlay";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  // Check if this is an OAuth callback or email confirmation
  const urlParams = new URLSearchParams(window.location.search);
  const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token');
  const confirmationType = searchParams.get('type');
  const isEmailConfirmation = confirmationType === 'signup' || confirmationType === 'email';

  // Initial mount effect
  useEffect(() => {
    console.log('AuthCallback mounted', { 
      authLoading, 
      roleLoading, 
      user: !!user, 
      role,
      hasOAuthParams,
      isEmailConfirmation,
      url: window.location.href 
    });

    // Detect email confirmation success
    if (isEmailConfirmation) {
      setEmailConfirmed(true);
    }

    // If OAuth callback detected, try to explicitly get session for Safari
    if (hasOAuthParams && !user) {
      console.log('OAuth params detected, attempting explicit session recovery...');
      supabase.auth.getSession().then(({ data: { session } }) => {
        console.log('Explicit session check result:', !!session);
      });
    }
  }, []);

  // Auth state change effect
  useEffect(() => {
    console.log('Auth state changed', { authLoading, roleLoading, user: !!user, role, retryCount });
    
    // Only show success if we have a user and roles are loaded
    if (!authLoading && !roleLoading && user && role) {
      console.log('Showing success overlay');
      setSuccessMessage("¡Autenticación exitosa!");
      setShowSuccess(true);
    }
  }, [user, role, authLoading, roleLoading, retryCount]);

  // Safari ITP handling effect
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

  // Auto-redirect after 5 seconds for email confirmation
  useEffect(() => {
    if (emailConfirmed && !user) {
      const timer = setTimeout(() => {
        // Check if they were signing up as tasker or client
        const loginContext = sessionStorage.getItem('login_context');
        const targetAuth = loginContext === 'tasker' ? '/auth/tasker?tab=login' : '/auth/user?tab=login';
        navigate(targetAuth, { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [emailConfirmed, user, navigate]);

  const handleSuccessComplete = async () => {
    // Check for stored return path and login context
    const returnTo = sessionStorage.getItem('auth_return_to');
    const loginContext = sessionStorage.getItem('login_context');
    
    // Clear after reading
    sessionStorage.removeItem('auth_return_to');
    sessionStorage.removeItem('login_context');
    
    // Check if user is a tasker
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_tasker')
      .eq('user_id', user?.id)
      .single();
    
    const isTasker = profile?.is_tasker || false;
    
    // Route based on login context first, then role
    let defaultPath = "/user-landing";
    
    if (loginContext === 'tasker') {
      // User logged in from tasker portal
      if (isTasker) {
        defaultPath = "/provider-portal";
      } else {
        // Not a tasker yet, send to become-provider page
        defaultPath = "/become-provider";
      }
    } else if (loginContext === 'client') {
      // User logged in from client portal
      defaultPath = "/user-landing";
    } else {
      // No login context - use role-based routing (fallback)
      if (role === "provider" && isTasker) {
        defaultPath = "/provider-portal";
      } else if (role === "provider") {
        defaultPath = "/provider-portal";
      }
    }
    
    const targetPath = returnTo || defaultPath;
    
    console.log('Success complete, redirecting to:', targetPath, { role, isTasker, loginContext });
    navigate(targetPath, { replace: true });
  };

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

  // Show email confirmation success screen
  if (emailConfirmed && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-main bg-gradient-mesh p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-2xl">¡Email verificado exitosamente!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-muted-foreground">
              Ya puedes iniciar sesión con tu cuenta
            </p>
            <Button
              onClick={() => {
                const loginContext = sessionStorage.getItem('login_context');
                const targetAuth = loginContext === 'tasker' ? '/auth/tasker?tab=login' : '/auth/user?tab=login';
                navigate(targetAuth, { replace: true });
              }}
              className="w-full"
            >
              Iniciar Sesión
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Serás redirigido automáticamente en 5 segundos...
            </p>
          </CardContent>
        </Card>
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
