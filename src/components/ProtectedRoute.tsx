import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { ROUTES } from '@/constants/routes';
import { GenericPageSkeleton } from '@/components/skeletons';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireProvider?: boolean;
  requireAdmin?: boolean;
  requireClient?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireAuth = true, 
  requireProvider = false,
  requireAdmin = false,
  requireClient = false,
}) => {
  const { user, loading: authLoading } = useAuth();
  const { roles, loading: roleLoading } = useUserRole();
  const location = useLocation();

  // Helper to store intended destination before redirecting to login
  const storeReturnPath = () => {
    const returnPath = location.pathname + location.search;
    sessionStorage.setItem('auth_return_to', returnPath);
    localStorage.setItem('auth_return_to', returnPath);
  };

  // Show loading while checking auth
  if (authLoading) {
    return <GenericPageSkeleton />;
  }

  // Redirect to login if auth is required and user is not logged in
  if (requireAuth && !user) {
    storeReturnPath();
    // Send to provider auth if they were trying to access a provider route
    if (requireProvider) {
      return <Navigate to={ROUTES.PROVIDER_AUTH} replace />;
    }
    return <Navigate to={ROUTES.USER_AUTH} replace />;
  }

  // If user is authenticated and any role check is needed, wait for roles to load
  if (user && (requireProvider || requireAdmin || requireClient) && roleLoading) {
    return <GenericPageSkeleton />;
  }

  const hasProviderRole = roles.includes('provider');
  const hasAdminRole = roles.includes('admin');
  const hasClientRole = roles.includes('client');

  // Helper: determine the best dashboard to redirect to based on actual roles
  const getRoleDashboard = () => {
    if (hasAdminRole) return '/admin';
    if (hasProviderRole) return ROUTES.PROVIDER_PORTAL;
    return ROUTES.USER_LANDING;
  };

  // For admin-only routes
  if (requireAdmin) {
    if (!user) {
      storeReturnPath();
      return <Navigate to={ROUTES.USER_AUTH} replace />;
    }
    if (!hasAdminRole) {
      // Redirect to the user's actual dashboard instead of home
      const dest = hasProviderRole ? ROUTES.PROVIDER_PORTAL : ROUTES.USER_LANDING;
      return <Navigate to={dest} replace />;
    }
  }

  // For provider-only routes
  if (requireProvider) {
    if (!user) {
      storeReturnPath();
      return <Navigate to={ROUTES.PROVIDER_AUTH} replace />;
    }
    // Admins can also access provider routes
    if (!hasProviderRole && !hasAdminRole) {
      // Client trying to access provider route → send to client dashboard
      return <Navigate to={ROUTES.USER_LANDING} replace />;
    }
  }

  // For client-only routes
  if (requireClient) {
    if (!user) {
      storeReturnPath();
      return <Navigate to={ROUTES.USER_AUTH} replace />;
    }
    // Admins can also access client routes
    if (!hasClientRole && !hasAdminRole) {
      // Provider trying to access client route → send to provider dashboard
      return <Navigate to={ROUTES.PROVIDER_PORTAL} replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;
