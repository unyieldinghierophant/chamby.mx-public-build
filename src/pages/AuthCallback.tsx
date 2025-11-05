import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AuthSuccessOverlay } from "@/components/AuthSuccessOverlay";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

const AuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [rolesChecked, setRolesChecked] = useState(false);

  // Check if this is an OAuth callback or email confirmation
  const urlParams = new URLSearchParams(window.location.search);
  const hasOAuthParams = urlParams.has('code') || urlParams.has('access_token');
  const confirmationType = searchParams.get('type');
  const isEmailConfirmation = confirmationType === 'signup' || confirmationType === 'email';

  // Initial mount effect
  useEffect(() => {
    console.log('AuthCallback mounted', { 
      authLoading, 
      user: !!user, 
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

  // Check roles and handle multi-role scenario
  useEffect(() => {
    const checkUserRoles = async () => {
      if (!authLoading && user && !rolesChecked) {
        console.log('Checking user roles for multi-role handling...');
        
        try {
          const { data: userRoles, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          if (error) {
            console.error('Error fetching roles:', error);
            setRolesChecked(true);
            setSuccessMessage("¡Autenticación exitosa!");
            setShowSuccess(true);
            return;
          }

          const roles = userRoles?.map(r => r.role) || [];
          const selectedRole = localStorage.getItem('selected_role');
          
          console.log('User roles:', roles, 'Selected role:', selectedRole);

          // Multiple roles and no selection? Go to role picker immediately
          if (roles.length > 1 && !selectedRole) {
            console.log('Multiple roles detected, redirecting to role selection');
            navigate('/choose-role', { replace: true });
            return;
          }

          // Single role or already selected - show success
          setRolesChecked(true);
          setSuccessMessage("¡Autenticación exitosa!");
          setShowSuccess(true);
        } catch (error) {
          console.error('Error during role check:', error);
          setRolesChecked(true);
          setSuccessMessage("¡Autenticación exitosa!");
          setShowSuccess(true);
        }
      }
    };

    checkUserRoles();
  }, [authLoading, user, rolesChecked, navigate]);

  // Safari ITP handling effect
  useEffect(() => {
    if (!authLoading && !user && hasOAuthParams && retryCount < 6) {
      console.log(`Waiting for Safari session restoration... attempt ${retryCount + 1}/6`);
      const timer = setTimeout(() => {
        setRetryCount(prev => prev + 1);
      }, 500);
      return () => clearTimeout(timer);
    }

    // Only redirect to login if no OAuth params AND we've waited long enough
    if (!authLoading && !user && !hasOAuthParams) {
      console.log('No user and no OAuth params, redirecting to login');
      navigate("/auth/user", { replace: true });
    }

    // Last resort: if we've waited 3 seconds and still no user
    if (!authLoading && !user && hasOAuthParams && retryCount >= 6) {
      console.error('Safari session restoration failed after 3 seconds');
      navigate("/auth/user", { replace: true });
    }
  }, [authLoading, user, hasOAuthParams, retryCount, navigate]);

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
    console.log('[AuthCallback] Success animation complete, determining redirect...');
    
    try {
      const loginContext = sessionStorage.getItem('login_context') || localStorage.getItem('login_context');
      const returnTo = sessionStorage.getItem('auth_return_to') || localStorage.getItem('auth_return_to');
      
      console.log('[AuthCallback] Login context:', loginContext);
      console.log('[AuthCallback] Return to:', returnTo);
      
      // Clear the stored values
      sessionStorage.removeItem('login_context');
      localStorage.removeItem('login_context');
      sessionStorage.removeItem('auth_return_to');
      localStorage.removeItem('auth_return_to');

      if (returnTo) {
        console.log('[AuthCallback] Redirecting to stored return path:', returnTo);
        navigate(returnTo);
        return;
      }

      // Check user's roles from user_roles table
      if (user) {
        const { data: userRoles, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);

        if (error) {
          console.error('[AuthCallback] Error fetching roles:', error);
          navigate('/user-landing');
          return;
        }

        console.log('[AuthCallback] User roles:', userRoles);

        const roles = userRoles?.map(r => r.role) || [];

        // If user has multiple roles, redirect to role selection
        if (roles.length > 1) {
          console.log('[AuthCallback] Multiple roles detected, showing role selection');
          navigate('/choose-role');
          return;
        }

        // If single role, redirect accordingly
        if (roles.length === 1) {
          const role = roles[0];
          localStorage.setItem('selected_role', role);
          
          if (role === 'provider') {
            console.log('[AuthCallback] Redirecting to provider portal');
            navigate('/provider-portal');
          } else if (role === 'admin') {
            console.log('[AuthCallback] Redirecting to admin dashboard');
            navigate('/admin');
          } else {
            console.log('[AuthCallback] Redirecting to user landing');
            navigate('/user-landing');
          }
          return;
        }

        // No roles found, default to user landing
        console.log('[AuthCallback] No roles found, redirecting to user landing');
        navigate('/user-landing');
      } else {
        console.log('[AuthCallback] No user found, redirecting to home');
        navigate('/');
      }
    } catch (error) {
      console.error('[AuthCallback] Error during redirect:', error);
      navigate('/');
    }
  };

  // Show loading while determining where to redirect
  if (authLoading || (hasOAuthParams && !user && retryCount < 6) || (user && !rolesChecked)) {
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
