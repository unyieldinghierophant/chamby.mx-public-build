import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';

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
  const { profile, loading: profileLoading } = useProfile();

  if (authLoading || (requireTasker && profileLoading)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (requireAuth && !user) {
    return <Navigate to="/auth/user" replace />;
  }

  // For tasker routes, check if user is actually a tasker
  if (requireTasker && !user) {
    return <Navigate to="/auth/tasker" replace />;
  }

  // For tasker routes, verify selected_role is provider or admin
  if (requireTasker && user) {
    const selectedRole = localStorage.getItem('selected_role');
    
    // If no role selected or role is client, redirect to role picker
    if (!selectedRole || selectedRole === 'client') {
      console.log('No provider/admin role selected, redirecting to role picker');
      return <Navigate to="/choose-role" replace />;
    }
    
    // Additional check: if role is provider but not actually a tasker in profile
    const loginContext = localStorage.getItem('login_context');
    if (profile && !profile.is_tasker && loginContext !== 'tasker') {
      console.log('User is not a tasker, redirecting to become-provider');
      return <Navigate to="/become-provider" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;