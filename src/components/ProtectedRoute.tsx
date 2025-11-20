import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireTasker?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  requireTasker = false 
}) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading } = useUserRole();

  // Show loading while checking auth and roles
  if (authLoading || (requireTasker && roleLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if auth is required and user is not logged in
  if (requireAuth && !user) {
    return <Navigate to="/auth/user" replace />;
  }

  // For tasker-only routes, verify user has provider or admin role in database
  if (requireTasker) {
    if (!user) {
      return <Navigate to="/auth/tasker" replace />;
    }
    
    // Check if user has provider or admin role in database
    const hasProviderRole = roles.includes('provider');
    const hasAdminRole = roles.includes('admin');
    
    if (!hasProviderRole && !hasAdminRole) {
      console.log('[ProtectedRoute] User lacks provider/admin role, redirecting to /become-provider');
      return <Navigate to="/become-provider" replace />;
    }
    
    console.log('[ProtectedRoute] User has required tasker role, allowing access');
  }

  return <>{children}</>;
};

export default ProtectedRoute;