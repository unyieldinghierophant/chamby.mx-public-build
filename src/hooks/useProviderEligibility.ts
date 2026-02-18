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
 * Canonical document requirements — must match the verification page exactly.
 * Each entry maps a canonical key to:
 *   - label: display string shown in the eligibility modal
 *   - docTypes: accepted doc_type values in the `documents` table
 */
const CANONICAL_DOCS = [
  { key: 'foto_rostro', label: 'Foto del rostro', docTypes: ['face_photo'] },
  { key: 'ine_id', label: 'INE/ID', docTypes: ['id_card', 'id_front'] },
  { key: 'carta_antecedentes', label: 'Carta de antecedentes no penales', docTypes: ['criminal_record'] },
] as const;

/**
 * Centralized provider eligibility check.
 * A provider is eligible ONLY if ALL conditions are true:
 * 1. providers row exists
 * 2. providers.onboarding_complete == true
 * 3. All 3 canonical documents exist in the `documents` table
 *    — OR admin has set provider_details.verification_status = 'verified'
 * 4. Required fields: skills (length > 0), zone_served, display_name
 * 5. Admin verification (provider_details.verification_status === 'verified')
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

      // 2. Check provider_details for admin verification status
      const { data: details } = await supabase
        .from('provider_details')
        .select('verification_status')
        .eq('user_id', user.id)
        .maybeSingle();

      const adminVerified = provider.verified === true || details?.verification_status === 'verified';

      // 3. Check documents table for canonical docs
      const { data: docs } = await supabase
        .from('documents')
        .select('doc_type')
        .eq('provider_id', user.id);

      const uploadedDocTypes = new Set((docs || []).map(d => d.doc_type));

      // Build gaps list
      const gaps: string[] = [];

      if (!provider.onboarding_complete) {
        gaps.push('Onboarding incompleto');
      }

      // Check canonical documents (skip if admin already verified)
      if (!adminVerified) {
        for (const canonical of CANONICAL_DOCS) {
          const hasSome = canonical.docTypes.some(dt => uploadedDocTypes.has(dt));
          if (!hasSome) {
            gaps.push(`Documento faltante: ${canonical.label}`);
          }
        }
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

      // Admin verification gate
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
