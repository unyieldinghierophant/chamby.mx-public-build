import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useIsProvider } from '@/hooks/useIsProvider';
import { ROUTES } from '@/constants/routes';
import { GenericPageSkeleton } from '@/components/skeletons';

const ProviderProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const { isProvider, loading: roleLoading } = useIsProvider();

  // Show loading while checking authentication and roles
  if (authLoading || roleLoading) {
    return <GenericPageSkeleton />;
  }
  
  // Redirect to login if not authenticated
  if (!user) return <Navigate to={ROUTES.PROVIDER_AUTH} replace />;
  
  // Redirect to user landing if not a provider
  if (!isProvider) return <Navigate to={ROUTES.USER_LANDING} replace />;

  // Redirect providers to the provider portal profile edit page
  return <Navigate to={ROUTES.PROVIDER_PROFILE} replace />;
};

export default ProviderProfile;
