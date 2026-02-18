import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EligibilityResult {
  eligible: boolean;
  missing: string[];
  loading: boolean;
  refetch: () => Promise<void>;
}

/**
 * Canonical eligibility rule (Option A):
 * eligible_to_accept_jobs = provider_details.verification_status === 'verified'
 *
 * Admin is the single gate. Admin must only set 'verified' after confirming
 * the 3 canonical docs (face_photo, id_card/id_front, criminal_record) are present.
 *
 * Additional profile completeness checks (onboarding, skills, zone, name) are
 * still enforced so the provider can actually function.
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
        .select('onboarding_complete, skills, zone_served, display_name')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!provider) {
        setEligible(false);
        setMissing(['Perfil de proveedor no encontrado — completa tu onboarding']);
        setLoading(false);
        return;
      }

      // 2. Single source of truth: provider_details.verification_status
      const { data: details } = await supabase
        .from('provider_details')
        .select('verification_status')
        .eq('user_id', user.id)
        .maybeSingle();

      const adminVerified = details?.verification_status === 'verified';

      // Build gaps list
      const gaps: string[] = [];

      if (!provider.onboarding_complete) {
        gaps.push('Onboarding incompleto');
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
      if (!adminVerified) {
        gaps.push('Verificación de administrador pendiente');
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
