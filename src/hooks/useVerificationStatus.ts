import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const useVerificationStatus = () => {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Check provider verification status
        const { data: providerData } = await supabase
          .from('provider_profiles')
          .select('verified, verification_status')
          .eq('user_id', user.id)
          .single();

        if (!providerData) {
          setIsVerified(false);
          setLoading(false);
          return;
        }

        setIsVerified(providerData.verified && providerData.verification_status === 'verified');
      } catch (error) {
        console.error('Error checking verification status:', error);
        setIsVerified(false);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [user]);

  return { isVerified, loading };
};