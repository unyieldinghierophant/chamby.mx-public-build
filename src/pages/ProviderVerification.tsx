import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock, XCircle, FileText, Upload, User, AlertTriangle, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface DocumentRecord {
  doc_type: string;
  verification_status: string | null;
}

interface ProviderDetailsRecord {
  verification_status: string | null;
}

interface ProviderRecord {
  stripe_onboarding_status: string;
}

interface Profile {
  full_name: string | null;
  phone: string | null;
  created_at: string | null;
}

const REQUIRED_DOC_TYPES = [
  { type: 'face_photo', label: 'Foto del rostro' },
  { type: 'id_card', label: 'INE / Identificación' },
  { type: 'criminal_record', label: 'Carta de antecedentes no penales' },
];

const ProviderVerification = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [details, setDetails] = useState<ProviderDetailsRecord | null>(null);
  const [documents, setDocuments] = useState<DocumentRecord[]>([]);
  const [stripeStatus, setStripeStatus] = useState<string>('not_started');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [userRes, detailsRes, docsRes, providerRes] = await Promise.all([
        supabase.from('users').select('full_name, phone, created_at').eq('id', user.id).maybeSingle(),
        supabase.from('provider_details')
          .select('verification_status')
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase.from('documents')
          .select('doc_type, verification_status')
          .eq('provider_id', user.id),
        supabase.from('providers')
          .select('stripe_onboarding_status')
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      setProfile(userRes.data);
      setDetails(detailsRes.data as ProviderDetailsRecord | null);
      setDocuments((docsRes.data as DocumentRecord[]) || []);
      setStripeStatus((providerRes.data as ProviderRecord | null)?.stripe_onboarding_status || 'not_started');
    } catch (error) {
      console.error('Error fetching verification data:', error);
    } finally {
      setLoading(false);
    }
  };

  const verificationStatus = details?.verification_status || 'pending';
  const isVerified = verificationStatus === 'verified';

  const getDocStatus = (docType: string): 'verified' | 'pending' | 'rejected' | 'missing' => {
    // id_card can also match id_front
    const doc = documents.find(d =>
      d.doc_type === docType || (docType === 'id_card' && d.doc_type === 'id_front')
    );
    if (!doc) return 'missing';
    if (doc.verification_status === 'verified' || doc.verification_status === 'approved') return 'verified';
    if (doc.verification_status === 'rejected') return 'rejected';
    return 'pending';
  };

  const allDocsVerified = REQUIRED_DOC_TYPES.every(d => getDocStatus(d.type) === 'verified');

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

  const getDocStatusIcon = (status: 'verified' | 'pending' | 'rejected' | 'missing') => {
    switch (status) {
      case 'verified': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-600" />;
      case 'missing': return <XCircle className="w-4 h-4 text-red-400" />;
    }
  };

  const getDocStatusBadge = (status: 'verified' | 'pending' | 'rejected' | 'missing') => {
    const map = {
      verified: { cls: 'bg-green-100 text-green-800 border-green-200', label: 'Aprobado' },
      pending: { cls: 'bg-yellow-100 text-yellow-800 border-yellow-200', label: 'En revisión' },
      rejected: { cls: 'bg-red-100 text-red-800 border-red-200', label: 'Rechazado' },
      missing: { cls: 'bg-red-100 text-red-800 border-red-200', label: 'Faltante' },
    };
    const { cls, label } = map[status];
    return <Badge className={cls}><span className="flex items-center gap-1">{getDocStatusIcon(status)}{label}</span></Badge>;
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

              {verificationStatus === 'rejected' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    Tu perfil ha sido rechazado. Por favor, revisa y vuelve a subir los documentos requeridos.
                  </p>
                </div>
              )}

              {isVerified && allDocsVerified ? (
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

            {/* Documents Status — reads from documents table with per-doc status */}
            {!(isVerified && allDocsVerified) && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Estado de Documentos</h3>
                <div className="space-y-3">
                  {REQUIRED_DOC_TYPES.map((doc) => {
                    const docStatus = getDocStatus(doc.type);
                    return (
                      <div key={doc.type} className="p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-medium">{doc.label}</span>
                          </div>
                          {getDocStatusBadge(docStatus)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Stripe onboarding status */}
            {isVerified && stripeStatus !== 'enabled' && (
              <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm flex items-center gap-2 text-foreground">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <span>
                    <strong>Completa tu cuenta de Stripe</strong> para recibir pagos por tus servicios.
                  </span>
                </p>
                <Link to="/provider-portal/account">
                  <Button variant="outline" size="sm" className="mt-2">
                    Configurar Stripe
                  </Button>
                </Link>
              </div>
            )}

            {isVerified && allDocsVerified && (
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
