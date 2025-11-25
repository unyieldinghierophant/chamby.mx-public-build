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

  // Check roles and automatically select based on login context
  useEffect(() => {
    const checkUserRoles = async () => {
      if (!authLoading && user && !rolesChecked) {
        console.log('[AuthCallback] Checking user roles for automatic selection...');
        
        try {
          const { data: userRoles, error } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id);

          if (error) {
            console.error('[AuthCallback] Error fetching roles:', error);
            setRolesChecked(true);
            setSuccessMessage("¡Autenticación exitosa!");
            setShowSuccess(true);
            return;
          }

          let roles = userRoles?.map(r => r.role) || [];
          const loginContext = localStorage.getItem('login_context');

          console.log('[AuthCallback] User roles:', roles);
          console.log('[AuthCallback] Login context:', loginContext);

          // 🔥 AUTO-CREATE PROVIDER ROLE AND RECORDS if coming from /auth/provider
          if (loginContext === 'provider' && !roles.includes('provider')) {
            console.log('[AuthCallback] Auto-creating provider role for provider signup');
            
            // Check if provider record exists
            const { data: existingProvider } = await supabase
              .from('providers')
              .select('id')
              .eq('user_id', user.id)
              .maybeSingle();
            
            let providerId = existingProvider?.id;
            
            // Create provider record if doesn't exist
            if (!existingProvider) {
              const { data: newProvider, error: providerError } = await supabase
                .from('providers')
                .insert({
                  user_id: user.id,
                  display_name: user.user_metadata?.full_name,
                  business_email: user.email,
                  business_phone: user.user_metadata?.phone,
                })
                .select()
                .single();
              
              if (providerError) {
                console.error('[AuthCallback] Error creating provider record:', providerError);
              } else {
                providerId = newProvider.id;
                console.log('[AuthCallback] Provider record created successfully');
              }
            }
            
            // Create provider_details if we have a provider ID
            if (providerId) {
              const { error: detailsError } = await supabase
                .from('provider_details')
                .insert({
                  provider_id: providerId,
                  user_id: user.id,
                  verification_status: 'pending'
                });
              
              if (detailsError && detailsError.code !== '23505') {
                console.error('[AuthCallback] Error creating provider_details:', detailsError);
              }
            }
            
            // Insert provider role
            const { error: insertError } = await supabase
              .from('user_roles')
              .insert({
                user_id: user.id,
                role: 'provider'
              });

            if (insertError && insertError.code !== '23505') { // Ignore duplicate error
              console.error('[AuthCallback] Error creating provider role:', insertError);
            } else {
              // Add to roles array
              roles.push('provider');
              console.log('[AuthCallback] Provider role created successfully');
            }
          }

          // ✨ AUTOMATIC ROLE SELECTION - No more /choose-role redirect
          let selectedRole: string;

          // If login_context is set, use it to determine role preference
          if (loginContext === 'provider') {
            // User came from provider login - prefer provider role
            if (roles.includes('provider')) {
              selectedRole = 'provider';
            } else if (roles.includes('admin')) {
              selectedRole = 'admin';
            } else if (roles.includes('client')) {
              selectedRole = 'client';
            } else {
              selectedRole = 'client'; // Default fallback
            }
          } else {
            // User came from client login (or no context) - prefer client role
            if (roles.includes('client')) {
              selectedRole = 'client';
            } else if (roles.includes('provider')) {
              selectedRole = 'provider';
            } else if (roles.includes('admin')) {
              selectedRole = 'admin';
            } else {
              selectedRole = 'client'; // Default fallback
            }
          }

          console.log('[AuthCallback] Auto-selected role based on context:', selectedRole);
          localStorage.setItem('selected_role', selectedRole);

          // Show success overlay and continue
          setRolesChecked(true);
          setSuccessMessage("¡Autenticación exitosa!");
          setShowSuccess(true);
        } catch (error) {
          console.error('[AuthCallback] Error during role check:', error);
          setRolesChecked(true);
          setSuccessMessage("¡Autenticación exitosa!");
          setShowSuccess(true);
        }
      }
    };

    checkUserRoles();
  }, [authLoading, user, rolesChecked]);

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
        // Check if they were signing up as provider or client
        const loginContext = sessionStorage.getItem('login_context');
        const targetAuth = loginContext === 'provider' ? '/auth/provider?tab=login' : '/auth/user?tab=login';
        navigate(targetAuth, { replace: true });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [emailConfirmed, user, navigate]);

  const handleSuccessComplete = () => {
    try {
      console.log('[AuthCallback] Success complete, cleaning up and redirecting');
      
      // Get selected role (should be set by now)
      const selectedRole = localStorage.getItem('selected_role');
      console.log('[AuthCallback] Selected role:', selectedRole);
      
      // Check for stored return path AFTER role is determined
      const returnTo = sessionStorage.getItem('auth_return_to') || localStorage.getItem('auth_return_to');
      
      // Clear stored values (after reading them)
      sessionStorage.removeItem('auth_return_to');
      localStorage.removeItem('auth_return_to');
      localStorage.removeItem('auth_source'); // Clean up debug flag
      sessionStorage.removeItem('pending_oauth');
      sessionStorage.removeItem('oauth_retry_count');
      localStorage.removeItem('login_context');
      
      if (returnTo) {
        console.log('[AuthCallback] Redirecting to stored path:', returnTo);
        navigate(returnTo, { replace: true });
        return;
      }

      // Redirect based on selected role
      if (selectedRole === 'provider' || selectedRole === 'admin') {
        console.log('[AuthCallback] Redirecting to provider portal');
        navigate('/provider-portal', { replace: true });
      } else {
        console.log('[AuthCallback] Redirecting to user landing');
        navigate('/user-landing', { replace: true });
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
                const targetAuth = loginContext === 'provider' ? '/auth/provider?tab=login' : '/auth/user?tab=login';
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
