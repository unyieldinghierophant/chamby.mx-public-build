import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { ROUTES } from '@/constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireProvider?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  requireProvider = false,
  requireAdmin = false
}) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading } = useUserRole();

  // Show loading while checking auth and roles
  if (authLoading || ((requireProvider || requireAdmin) && roleLoading)) {
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
    return <Navigate to={ROUTES.USER_AUTH} replace />;
  }

  // For admin-only routes
  if (requireAdmin) {
    if (!user) {
      return <Navigate to={ROUTES.USER_AUTH} replace />;
    }
    
    const hasAdminRole = roles.includes('admin');
    
    if (!hasAdminRole) {
      console.log('[ProtectedRoute] User lacks admin role, redirecting to home');
      return <Navigate to={ROUTES.HOME} replace />;
    }
    
    console.log('[ProtectedRoute] User has admin role, allowing access');
  }

  // For provider-only routes, verify user has provider or admin role in database
  if (requireProvider) {
    if (!user) {
      return <Navigate to={ROUTES.PROVIDER_AUTH} replace />;
    }
    
    // Check if user has provider or admin role in database
    const hasProviderRole = roles.includes('provider');
    const hasAdminRole = roles.includes('admin');
    
    if (!hasProviderRole && !hasAdminRole) {
      console.log('[ProtectedRoute] User lacks provider/admin role, redirecting to /become-provider');
      return <Navigate to={ROUTES.BECOME_PROVIDER} replace />;
    }
    
    console.log('[ProtectedRoute] User has required provider role, allowing access');
  }

  return <>{children}</>;
};

export default ProtectedRoute;