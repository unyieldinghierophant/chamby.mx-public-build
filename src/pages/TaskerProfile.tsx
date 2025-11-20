import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsProvider } from '@/hooks/useIsProvider';

const TaskerProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isProvider, loading: roleLoading } = useIsProvider();

  // Show loading while checking authentication and roles
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!user) return <Navigate to="/auth/tasker" replace />;
  
  // Redirect to user landing if not a provider
  if (!isProvider) return <Navigate to="/user-landing" replace />;

  // Redirect providers to the provider portal profile edit page
  return <Navigate to="/provider-portal/profile" replace />;
};

export default TaskerProfile;
