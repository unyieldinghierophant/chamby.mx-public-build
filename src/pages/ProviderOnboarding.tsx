import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  FileText, 
  Home, 
  Shield, 
  User,
  ArrowLeft,
  Camera
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface DocumentUpload {
  type: 'id_card' | 'proof_of_address' | 'criminal_record' | 'face_photo' | 'face_with_id';
  name: string;
  description: string;
  icon: React.ReactNode;
  file?: File;
  uploaded: boolean;
}

const ProviderOnboarding = () => {
  const { user, loading } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [profile, setProfile] = useState<any>(null);
  const [bankAccount, setBankAccount] = useState('');
  
  const [documents, setDocuments] = useState<DocumentUpload[]>([
    {
      type: 'id_card',
      name: 'Cédula de Identidad',
      description: 'Foto clara de tu cédula por ambos lados',
      icon: <FileText className="w-5 h-5" />,
      uploaded: false
    },
    {
      type: 'face_photo',
      name: 'Foto del Rostro',
      description: 'Selfie clara de tu rostro',
      icon: <User className="w-5 h-5" />,
      uploaded: false
    },
    {
      type: 'face_with_id',
      name: 'Foto con Cédula en Mano',
      description: 'Selfie sosteniendo tu cédula junto a tu rostro',
      icon: <Camera className="w-5 h-5" />,
      uploaded: false
    },
    {
      type: 'criminal_record',
      name: 'Antecedentes Penales',
      description: 'Certificado de antecedentes penales vigente',
      icon: <Shield className="w-5 h-5" />,
      uploaded: false
    },
    {
      type: 'proof_of_address',
      name: 'Comprobante de Domicilio',
      description: 'Recibo de servicios o estado de cuenta reciente',
      icon: <Home className="w-5 h-5" />,
      uploaded: false
    }
  ]);

  useEffect(() => {
    if (user) {
      fetchProfile();
      checkExistingDocuments();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();
      
    setProfile(data);
  };

  const checkExistingDocuments = async () => {
    if (!user) return;
    
    const { data } = await supabase
      .from('documents')
      .select('doc_type')
      .eq('client_id', user.id);
    
    if (data) {
      setDocuments(prev => prev.map(doc => ({
        ...doc,
        uploaded: data.some(d => d.doc_type === doc.type)
      })));
    }
  };

  // Redirect if not authenticated
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/auth/provider" replace />;
  
  // Check if user is a provider from user_metadata first, then from profile
  const isProvider = user.user_metadata?.is_provider || user.user_metadata?.is_tasker || profile?.is_provider;
  
  // Only redirect if we have profile data and user is definitely not a provider
  if (profile && !isProvider && !user.user_metadata?.is_provider && !user.user_metadata?.is_tasker) {
    return <Navigate to="/user-landing" replace />;
  }

  const handleFileSelect = (docType: string, file: File) => {
    setDocuments(prev => prev.map(doc => 
      doc.type === docType ? { ...doc, file } : doc
    ));
  };

  const uploadDocument = async (doc: DocumentUpload) => {
    if (!doc.file || !user) return;
    
    setUploading(true);
    try {
      // Upload file to storage
      const fileExt = doc.file.name.split('.').pop();
      const fileName = `${user.id}/${doc.type}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, doc.file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-documents')
        .getPublicUrl(fileName);
      
      // Save document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          client_id: user.id,
          doc_type: doc.type,
          file_url: urlData.publicUrl,
          verification_status: 'pending'
        });
      
      if (dbError) throw dbError;
      
      setDocuments(prev => prev.map(d => 
        d.type === doc.type ? { ...d, uploaded: true, file: undefined } : d
      ));
      
      toast.success(`${doc.name} subido correctamente`);
    } catch (error: any) {
      toast.error(`Error al subir ${doc.name}: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleBankAccountSubmit = async () => {
    if (!user || !bankAccount) {
      toast.error('Por favor ingresa tu número de cuenta');
      return;
    }

    try {
      const { error } = await supabase
        .from('provider_details')
        .update({ 
          verification_status: 'pending'
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Información enviada correctamente');
      setCurrentStep(3);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const uploadedDocs = documents.filter(d => d.uploaded).length;
  const totalDocs = documents.length;
  const progress = (uploadedDocs / totalDocs) * 100;

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <Link 
          to="/" 
          className="inline-flex items-center text-primary hover:text-primary-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Completar Perfil de Proveedor
            </CardTitle>
            <div className="mt-4">
              <Progress value={currentStep === 1 ? progress : 100} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {currentStep === 1 
                  ? `Paso 1/2: Documentos (${uploadedDocs}/${totalDocs})`
                  : currentStep === 2
                  ? 'Paso 2/2: Información Bancaria'
                  : 'Completado'
                }
              </p>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <div className="space-y-4">
                {documents.map((doc) => (
                  <Card key={doc.type} className={doc.uploaded ? 'border-green-500' : ''}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {doc.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold flex items-center gap-2">
                            {doc.name}
                            {doc.uploaded && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </h3>
                          <p className="text-sm text-muted-foreground">{doc.description}</p>
                          {doc.file && !doc.uploaded && (
                            <p className="text-sm text-primary mt-1">
                              Archivo seleccionado: {doc.file.name}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col gap-2">
                          <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleFileSelect(doc.type, file);
                            }}
                            className="hidden"
                            id={`file-${doc.type}`}
                          />
                          <Label
                            htmlFor={`file-${doc.type}`}
                            className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Seleccionar
                          </Label>
                          {doc.file && !doc.uploaded && (
                            <Button
                              size="sm"
                              onClick={() => uploadDocument(doc)}
                              disabled={uploading}
                            >
                              Subir
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  className="w-full"
                  onClick={() => setCurrentStep(2)}
                  disabled={uploadedDocs < totalDocs}
                >
                  Continuar a Información Bancaria
                </Button>
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="bank-account">Número de Cuenta Bancaria</Label>
                  <Input
                    id="bank-account"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Ingresa tu número de cuenta"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Para recibir pagos por tus servicios
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                  >
                    Volver
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleBankAccountSubmit}
                  >
                    Enviar para Verificación
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div className="text-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                <h3 className="text-xl font-semibold">¡Perfil Completo!</h3>
                <p className="text-muted-foreground">
                  Tu información ha sido enviada para verificación. Te notificaremos cuando esté aprobada.
                </p>
                <Link to="/user-landing">
                  <Button className="w-full">
                    Ir al Inicio
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ProviderOnboarding;
