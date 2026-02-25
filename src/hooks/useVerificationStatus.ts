import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type VerificationStatus = 'pending' | 'verified' | 'rejected' | null;

export const useVerificationStatus = () => {
  const { user } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Read from provider_details (canonical source of truth)
        const { data: detailsData } = await supabase
          .from('provider_details')
          .select('verification_status')
          .eq('user_id', user.id)
          .maybeSingle();

        const status = (detailsData?.verification_status as VerificationStatus) ?? null;
        setVerificationStatus(status);
        setIsVerified(status === 'verified');
      } catch (error) {
        console.error('Error checking verification status:', error);
        setIsVerified(false);
        setVerificationStatus(null);
      } finally {
        setLoading(false);
      }
    };

    checkVerificationStatus();
  }, [user]);

  return { isVerified, verificationStatus, loading };
};