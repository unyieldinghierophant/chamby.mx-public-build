import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock, XCircle, FileText, Upload, User, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface ProviderDetailsDoc {
  verification_status: string | null;
  ine_front_url: string | null;
  ine_back_url: string | null;
  selfie_url: string | null;
  selfie_with_id_url: string | null;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  created_at: string | null;
}

const DOC_ITEMS = [
  { field: 'ine_front_url' as const, label: 'INE frente' },
  { field: 'ine_back_url' as const, label: 'INE reverso' },
  { field: 'selfie_url' as const, label: 'Selfie' },
  { field: 'selfie_with_id_url' as const, label: 'Selfie con INE' },
];

const ProviderVerification = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [details, setDetails] = useState<ProviderDetailsDoc | null>(null);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [userRes, detailsRes] = await Promise.all([
        supabase.from('users').select('full_name, phone, created_at').eq('id', user.id).maybeSingle(),
        supabase.from('provider_details')
          .select('verification_status, ine_front_url, ine_back_url, selfie_url, selfie_with_id_url')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      setProfile(userRes.data);
      setDetails(detailsRes.data as ProviderDetailsDoc | null);
      // Single source of truth: provider_details.verification_status
      setVerified(detailsRes.data?.verification_status === 'verified');
    } catch (error) {
      console.error('Error fetching verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const verificationStatus = details?.verification_status || 'pending';
  const allDocsPresent = details && DOC_ITEMS.every(d => {
    const val = (details as any)[d.field];
    return val && typeof val === 'string' && val.trim() !== '';
  });
  const isInconsistent = verified && !allDocsPresent;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': case 'needs_review': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4" />;
      case 'pending': case 'needs_review': return <Clock className="w-4 h-4" />;
      case 'rejected': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'verified': return 'Verificado';
      case 'pending': return 'En Revisión';
      case 'needs_review': return 'Necesita Revisión';
      case 'rejected': return 'Rechazado';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl space-y-6">
        <Link to="/user-landing" className="inline-flex items-center text-primary hover:text-primary-dark transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Link>

        <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
          <CardHeader>
            <CardTitle className="text-2xl">Estado de Verificación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Status */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Estado del Perfil</h3>
                <Badge className={getStatusColor(verificationStatus)}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(verificationStatus)}
                    {getStatusLabel(verificationStatus)}
                  </span>
                </Badge>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm"><strong>Nombre:</strong> {profile?.full_name || 'No disponible'}</p>
                <p className="text-sm"><strong>Teléfono:</strong> {profile?.phone || 'No disponible'}</p>
                <p className="text-sm"><strong>Fecha de registro:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'No disponible'}</p>
              </div>

              {isInconsistent && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-amber-800 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Verificación inconsistente: tu perfil está marcado como verificado pero faltan documentos. Contacta soporte.
                  </p>
                </div>
              )}

              {verificationStatus === 'rejected' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    Tu perfil ha sido rechazado. Por favor, revisa y vuelve a subir los documentos requeridos.
                  </p>
                </div>
              )}

              {verificationStatus === 'verified' && allDocsPresent ? (
                <Link to="/provider-profile">
                  <Button className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Ver Mi Perfil
                  </Button>
                </Link>
              ) : (
                <Link to="/provider/onboarding">
                  <Button className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {verificationStatus === 'rejected' ? 'Actualizar Documentos' : 'Completar Verificación'}
                  </Button>
                </Link>
              )}
            </div>

            {/* Documents Status — reads from provider_details doc URL fields */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Estado de Documentos</h3>
              <div className="space-y-3">
                {DOC_ITEMS.map((doc) => {
                  const val = details ? (details as any)[doc.field] : null;
                  const isPresent = val && typeof val === 'string' && val.trim() !== '';

                  return (
                    <div key={doc.field} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">{doc.label}</span>
                        </div>
                        <Badge className={isPresent ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}>
                          <span className="flex items-center gap-1">
                            {isPresent ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                            {isPresent ? 'Subido' : 'Faltante'}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {verificationStatus === 'verified' && allDocsPresent && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-800 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Tu perfil ha sido verificado exitosamente. Ya puedes empezar a ofrecer tus servicios.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderVerification;
