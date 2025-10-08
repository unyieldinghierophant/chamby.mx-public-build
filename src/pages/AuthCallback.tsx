import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { AuthSuccessOverlay } from "@/components/AuthSuccessOverlay";

const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    console.log('AuthCallback mounted', { authLoading, roleLoading, user: !!user, role });
  }, []);

  useEffect(() => {
    console.log('Auth state changed', { authLoading, roleLoading, user: !!user, role });
    
    // Only show success if we have a user and roles are loaded
    if (!authLoading && !roleLoading && user && role) {
      console.log('Showing success overlay');
      setSuccessMessage("¡Autenticación exitosa!");
      setShowSuccess(true);
    }
  }, [user, role, authLoading, roleLoading]);

  const handleSuccessComplete = () => {
    console.log('Success complete, redirecting to:', role === "provider" ? "/provider-dashboard" : "/dashboard/user");
    if (role === "provider") {
      navigate("/provider-dashboard", { replace: true });
    } else {
      navigate("/dashboard/user", { replace: true });
    }
  };

  // Show loading while determining where to redirect
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Verificando...</p>
        </div>
      </div>
    );
  }

  // If no user, redirect to login
  if (!user) {
    navigate("/auth/user", { replace: true });
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
