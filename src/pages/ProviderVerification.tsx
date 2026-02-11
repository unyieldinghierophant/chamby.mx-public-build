import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle, Clock, XCircle, FileText, Upload, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  verification_status: string;
  created_at: string;
}

interface Document {
  id: string;
  doc_type: string;
  verification_status: string;
  uploaded_at: string;
}

const ProviderVerification = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchDocuments();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    try {
      // Get user profile
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      // Get provider verification status
      const { data: providerData } = await supabase
        .from('provider_details')
        .select('verification_status')
        .eq('user_id', user.id)
        .single();

      if (userData && providerData) {
        setProfile({
          ...userData,
          verification_status: providerData.verification_status || 'pending'
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('documents')
        .select('*')
        .eq('provider_id', user.id);

      if (data) {
        setDocuments(data);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const documentTypes: Record<string, string> = {
    'id_card': 'Cédula de Identidad',
    'proof_of_address': 'Comprobante de Domicilio',
    'criminal_record': 'Antecedentes Penales',
    'face_photo': 'Foto del Rostro',
    'face_with_id': 'Foto con Cédula'
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
        <Link 
          to="/user-landing" 
          className="inline-flex items-center text-primary hover:text-primary-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver
        </Link>

        <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
          <CardHeader>
            <CardTitle className="text-2xl">Estado de Verificación</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Status Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Estado del Perfil</h3>
                <Badge className={getStatusColor(profile?.verification_status || 'pending')}>
                  <span className="flex items-center gap-1">
                    {getStatusIcon(profile?.verification_status || 'pending')}
                    {profile?.verification_status === 'verified' ? 'Verificado' :
                     profile?.verification_status === 'pending' ? 'En Revisión' :
                     'Rechazado'}
                  </span>
                </Badge>
              </div>

              <div className="p-4 bg-muted/50 rounded-lg space-y-2">
                <p className="text-sm"><strong>Nombre:</strong> {profile?.full_name || 'No disponible'}</p>
                <p className="text-sm"><strong>Teléfono:</strong> {profile?.phone || 'No disponible'}</p>
                <p className="text-sm"><strong>Fecha de registro:</strong> {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'No disponible'}</p>
              </div>

              {profile?.verification_status === 'rejected' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    Tu perfil ha sido rechazado. Por favor, revisa y vuelve a subir los documentos requeridos con la información correcta.
                  </p>
                </div>
              )}

              {profile?.verification_status === 'verified' ? (
                <Link to="/provider-profile">
                  <Button className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Ver Mi Perfil
                  </Button>
                </Link>
              ) : (profile?.verification_status === 'pending' || profile?.verification_status === 'rejected') && (
                <Link to="/provider/onboarding">
                  <Button className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {profile?.verification_status === 'rejected' ? 'Actualizar Documentos' : 'Completar Verificación'}
                  </Button>
                </Link>
              )}
            </div>

            {/* Documents Status Card */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Estado de Documentos</h3>
              {documents.length > 0 ? (
                <div className="space-y-3">
                  {documents.map((doc) => (
                    <div key={doc.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm font-medium">
                            {documentTypes[doc.doc_type] || doc.doc_type}
                          </span>
                        </div>
                        <Badge className={getStatusColor(doc.verification_status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(doc.verification_status)}
                            {doc.verification_status === 'verified' ? 'Verificado' :
                             doc.verification_status === 'pending' ? 'En Revisión' :
                             'Rechazado'}
                          </span>
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 bg-muted/30 rounded-lg">
                  <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No hay documentos subidos aún</p>
                </div>
              )}
            </div>

            {profile?.verification_status === 'verified' && (
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
