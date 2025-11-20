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

const TaskerVerification = () => {
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
    
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    setProfile(data);
  };

  const fetchDocuments = async () => {
    if (!user) return;
    
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single();
      
    if (clientData) {
      const { data: docs } = await supabase
        .from('documents')
        .select('*')
        .eq('client_id', clientData.id);
        
      setDocuments(docs || []);
    }
    
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-600" />;
    }
  };

  const documentTypes = {
    id_card: 'Cédula de Identidad',
    face_photo: 'Foto del Rostro',
    face_with_id: 'Foto con Cédula',
    criminal_record: 'Antecedentes Penales',
    proof_of_address: 'Comprobante de Domicilio'
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <Link 
          to="/user-landing" 
          className="inline-flex items-center text-primary hover:text-primary-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Status Card */}
          <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(profile?.verification_status || 'pending')}
                Estado del Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Badge className={getStatusColor(profile?.verification_status || 'pending')}>
                  {profile?.verification_status === 'verified' ? 'Verificado' :
                   profile?.verification_status === 'rejected' ? 'Rechazado' : 'Pendiente'}
                </Badge>
              </div>
              
              <div className="space-y-2">
                <p><strong>Nombre:</strong> {profile?.full_name || 'No especificado'}</p>
                <p><strong>Email:</strong> {user?.email}</p>
                <p><strong>Teléfono:</strong> {profile?.phone || 'No especificado'}</p>
                <p><strong>Tipo:</strong> Proveedor de servicios</p>
              </div>

              {profile?.verification_status === 'rejected' && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 text-sm">
                    Tu perfil ha sido rechazado. Por favor, revisa y vuelve a subir los documentos requeridos con la información correcta.
                  </p>
                </div>
              )}

              {profile?.verification_status === 'verified' ? (
                <Link to="/tasker-profile">
                  <Button className="w-full">
                    <User className="w-4 h-4 mr-2" />
                    Ver Mi Perfil
                  </Button>
                </Link>
              ) : (profile?.verification_status === 'pending' || profile?.verification_status === 'rejected') && (
                <Link to="/tasker-onboarding">
                  <Button className="w-full">
                    <Upload className="w-4 h-4 mr-2" />
                    {profile?.verification_status === 'rejected' ? 'Actualizar Documentos' : 'Completar Verificación'}
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          {/* Documents Status Card */}
          <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Estado de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(documentTypes).map(([type, name]) => {
                  const doc = documents.find(d => d.doc_type === type);
                  const status = doc?.verification_status || 'not_uploaded';
                  
                  return (
                    <div key={type} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                      <span className="text-sm font-medium">{name}</span>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(status === 'not_uploaded' ? 'pending' : status)}
                        <Badge className={getStatusColor(status === 'not_uploaded' ? 'pending' : status)}>
                          {status === 'approved' ? 'Aprobado' :
                           status === 'rejected' ? 'Rechazado' :
                           status === 'not_uploaded' ? 'No Subido' : 'Pendiente'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {profile?.verification_status === 'verified' && (
          <Card className="mt-6 bg-green-50/80 backdrop-blur-sm shadow-raised border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  ¡Perfil Verificado!
                </h3>
                <p className="text-green-700">
                  Tu cuenta ha sido verificada exitosamente. Ya puedes comenzar a ofrecer tus servicios en la plataforma.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default TaskerVerification;