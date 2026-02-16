import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface EligibilityResult {
  eligible: boolean;
  missing: string[];
  loading: boolean;
  refetch: () => Promise<void>;
}

const DOC_LABELS: Record<string, string> = {
  ine_front_url: 'INE frente',
  ine_back_url: 'INE reverso',
  selfie_url: 'Selfie',
  selfie_with_id_url: 'Selfie con INE',
};

const REQUIRED_DOC_FIELDS = ['ine_front_url', 'ine_back_url', 'selfie_url', 'selfie_with_id_url'] as const;

/**
 * Centralized provider eligibility check.
 * A provider is eligible ONLY if ALL conditions are true:
 * 1. providers row exists
 * 2. providers.onboarding_complete == true
 * 3. All 4 required doc URL fields in provider_details are non-null/non-empty
 * 4. Required fields: skills (length > 0), zone_served, display_name
 *
 * NOTE: providers.verified does NOT bypass document checks.
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

      // 2. Check provider_details for doc URLs
      const { data: details } = await supabase
        .from('provider_details')
        .select('verification_status, ine_front_url, ine_back_url, selfie_url, selfie_with_id_url')
        .eq('user_id', user.id)
        .maybeSingle();

      // Build gaps list
      const gaps: string[] = [];

      if (!provider.onboarding_complete) {
        gaps.push('Onboarding incompleto');
      }

      // Check all 4 required document URLs
      if (details) {
        const detailsAny = details as any;
        for (const field of REQUIRED_DOC_FIELDS) {
          const val = detailsAny[field];
          if (!val || (typeof val === 'string' && val.trim() === '')) {
            gaps.push(`Documento faltante: ${DOC_LABELS[field]}`);
          }
        }
      } else {
        gaps.push('Documentos faltantes: INE frente, INE reverso, Selfie, Selfie con INE');
      }

      // Check required profile fields
      if (!provider.skills || provider.skills.length === 0) {
        gaps.push('Habilidades no configuradas');
      }
      if (!provider.zone_served) {
        gaps.push('Zona de servicio no configurada');
      }
      if (!provider.display_name) {
        gaps.push('Nombre no configurado');
      }

      // Verification by admin is informational but does NOT override doc requirements
      if (!provider.verified && details?.verification_status !== 'verified') {
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
