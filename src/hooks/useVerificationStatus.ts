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
        // Get client data first
        const { data: clientData } = await supabase
          .from('clients')
          .select('id')
          .eq('email', user.email)
          .single();

        if (!clientData) {
          setIsVerified(false);
          setLoading(false);
          return;
        }

        // Check if all required documents are verified
        const { data: documents } = await supabase
          .from('documents')
          .select('doc_type, verification_status')
          .eq('client_id', clientData.id);

        const requiredDocs = ['id_card', 'proof_of_address', 'criminal_record'];
        const verifiedDocs = documents?.filter(doc => doc.verification_status === 'verified') || [];
        const verifiedDocTypes = verifiedDocs.map(doc => doc.doc_type);

        const allRequiredVerified = requiredDocs.every(docType => 
          verifiedDocTypes.includes(docType)
        );

        setIsVerified(allRequiredVerified);
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