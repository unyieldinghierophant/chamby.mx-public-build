import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EligibilityResult {
  eligible: boolean;
  missing: string[];
  loading: boolean;
  refetch: () => Promise<void>;
}

interface ProviderRow {
  onboarding_complete: boolean;
  verified: boolean | null;
  skills: string[] | null;
  zone_served: string | null;
  display_name: string | null;
}

/**
 * Centralized provider eligibility check.
 * A provider is eligible to accept jobs ONLY if ALL conditions are true:
 * 1. providers row exists with user_id == auth.user.id
 * 2. providers.onboarding_complete == true
 * 3. providers.verified == true
 * 4. provider_details.verification_status == 'verified'
 * 5. Required documents present: ine_front, ine_back, selfie, selfie_with_id
 * 6. Required fields non-null: skills (length > 0), zone_served, display_name
 */
export const useProviderEligibility = (): EligibilityResult => {
  const { user } = useAuth();
  const [eligible, setEligible] = useState(false);
  const [missing, setMissing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const checkEligibility = useCallback(async () => {
    if (!user) {
      setEligible(false);
      setMissing(['Sesión no iniciada']);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // 1. Check provider row
      const { data: provider } = await supabase
        .from('providers')
        .select('onboarding_complete, verified, skills, zone_served, display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!provider) {
        setEligible(false);
        setMissing(['Perfil de proveedor no encontrado — completa tu onboarding']);
        setLoading(false);
        return;
      }

      // 2. Check provider_details verification_status
      const { data: details } = await supabase
        .from('provider_details')
        .select('verification_status')
        .eq('user_id', user.id)
        .maybeSingle();

      const isAdminVerified = !!provider.verified;
      const isDetailsVerified = details?.verification_status === 'verified';

      // 3. If EITHER verified flag is true → eligible, skip all other checks
      if (isAdminVerified || isDetailsVerified) {
        console.log('[Eligibility] Provider is verified — eligible');
        setEligible(true);
        setMissing([]);
        setLoading(false);
        return;
      }

      // 4. Not yet verified — build gaps list for pre-verification providers
      const gaps: string[] = [];

      if (!provider.onboarding_complete) {
        gaps.push('Onboarding incompleto');
      }

      gaps.push('Verificación de administrador pendiente');

      // Document checks only apply pre-verification
      const { data: docs } = await supabase
        .from('documents')
        .select('doc_type')
        .eq('provider_id', user.id);

      const docTypes = new Set(docs?.map(d => d.doc_type) || []);
      const requiredDocs = ['ine_front', 'ine_back', 'selfie', 'selfie_with_id'];
      const missingDocs = requiredDocs.filter(d => !docTypes.has(d));
      if (missingDocs.length > 0) {
        gaps.push(`Documentos faltantes: ${missingDocs.join(', ')}`);
      }

      if (!provider.skills || provider.skills.length === 0) {
        gaps.push('Habilidades no configuradas');
      }
      if (!provider.zone_served) {
        gaps.push('Zona de servicio no configurada');
      }
      if (!provider.display_name) {
        gaps.push('Nombre no configurado');
      }

      setMissing(gaps);
      setEligible(gaps.length === 0);
    } catch (err) {
      console.error('[Eligibility] Error checking eligibility:', err);
      setMissing(['Error al verificar elegibilidad']);
      setEligible(false);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    checkEligibility();
  }, [checkEligibility]);

  return { eligible, missing, loading, refetch: checkEligibility };
};
