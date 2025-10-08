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

const TaskerOnboarding = () => {
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
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    setProfile(data);
  };

  const checkExistingDocuments = async () => {
    if (!user) return;
    
    const { data: clientData } = await supabase
      .from('clients')
      .select('id')
      .eq('email', user.email)
      .single();
      
    if (clientData) {
      const { data: docs } = await supabase
        .from('documents')
        .select('doc_type')
        .eq('client_id', clientData.id);
        
      if (docs) {
        setDocuments(prev => prev.map(doc => ({
          ...doc,
          uploaded: docs.some(d => d.doc_type === doc.type)
        })));
      }
    }
  };

  // Redirect if not authenticated
  if (loading) return <div>Cargando...</div>;
  if (!user) return <Navigate to="/auth/tasker" replace />;
  
  // Check if user is a tasker from user_metadata first, then from profile
  const isTasker = user.user_metadata?.is_tasker || profile?.is_tasker;
  
  // Only redirect if we have profile data and user is definitely not a tasker
  if (profile && !isTasker && !user.user_metadata?.is_tasker) {
    return <Navigate to="/user-landing" replace />;
  }

  const handleFileSelect = (docType: string, file: File) => {
    setDocuments(prev => prev.map(doc => 
      doc.type === docType ? { ...doc, file } : doc
    ));
  };

  const uploadDocument = async (document: DocumentUpload) => {
    if (!document.file || !user) return;

    setUploading(true);

    try {
      // First, ensure client record exists
      let { data: clientData } = await supabase
        .from('clients')
        .select('id')
        .eq('email', user.email)
        .single();

      if (!clientData) {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert({
            email: user.email,
            phone: profile?.phone || '',
          })
          .select('id')
          .single();

        if (clientError) throw clientError;
        clientData = newClient;
      }

      // Upload file to storage
      const fileName = `${user.id}/${document.type}_${Date.now()}.${document.file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('user-documents')
        .upload(fileName, document.file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('user-documents')
        .getPublicUrl(fileName);

      // Save document record
      const { error: docError } = await supabase
        .from('documents')
        .insert({
          client_id: clientData.id,
          doc_type: document.type,
          file_url: publicUrl
        });

      if (docError) throw docError;

      // Update local state
      setDocuments(prev => prev.map(doc => 
        doc.type === document.type ? { ...doc, uploaded: true, file: undefined } : doc
      ));

      toast.success(`${document.name} subido correctamente`);
    } catch (error: any) {
      toast.error(`Error al subir ${document.name}: ${error.message}`);
    }

    setUploading(false);
  };

  const handleBankAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !bankAccount.trim()) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          bio: bankAccount, // We'll use bio field to store bank account for now
          verification_status: 'pending'
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('Información bancaria guardada. Tu perfil está siendo revisado.');
      setCurrentStep(3);
    } catch (error: any) {
      toast.error(`Error: ${error.message}`);
    }
  };

  const totalDocs = documents.length;
  const uploadedDocs = documents.filter(doc => doc.uploaded).length;
  const progress = (uploadedDocs / totalDocs) * 100;

  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-raised">
          <CardHeader className="text-center">
            <CheckCircle className="w-16 h-16 text-primary mx-auto mb-4" />
            <CardTitle className="text-2xl">¡Perfil Completado!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Hemos recibido todos tus documentos. Nuestro equipo los revisará en las próximas 24-48 horas.
            </p>
            <Badge variant="secondary" className="w-full justify-center py-2">
              Estado: Pendiente de Verificación
            </Badge>
            <Link to="/user-landing">
              <Button className="w-full">
                Ir al Inicio
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link 
          to="/user-landing" 
          className="inline-flex items-center text-primary hover:text-primary-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
          <CardHeader>
            <CardTitle className="text-2xl text-center">
              Completar Perfil de Tasker
            </CardTitle>
            <div className="mt-4">
              <Progress value={currentStep === 1 ? progress : 100} className="w-full" />
              <p className="text-sm text-muted-foreground mt-2 text-center">
                {currentStep === 1 
                  ? `Paso 1/2: Documentos (${uploadedDocs}/${totalDocs})`
                  : 'Paso 2/2: Información Bancaria'
                }
              </p>
            </div>
          </CardHeader>
          <CardContent>
            {currentStep === 1 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Subir Documentos de Verificación</h3>
                  <p className="text-muted-foreground">
                    Todos los documentos son requeridos para activar tu cuenta
                  </p>
                </div>

                <div className="grid gap-4">
                  {documents.map((document) => (
                    <Card key={document.type} className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {document.icon}
                          <div>
                            <h4 className="font-medium">{document.name}</h4>
                            <p className="text-sm text-muted-foreground">
                              {document.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {document.uploaded ? (
                            <Badge variant="secondary">
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Subido
                            </Badge>
                          ) : (
                            <>
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleFileSelect(document.type, file);
                                }}
                                className="hidden"
                                id={`file-${document.type}`}
                              />
                              <label htmlFor={`file-${document.type}`}>
                                <Button variant="outline" size="sm" asChild>
                                  <span className="cursor-pointer">
                                    <Upload className="w-4 h-4 mr-1" />
                                    Seleccionar
                                  </span>
                                </Button>
                              </label>
                              {document.file && (
                                <Button
                                  size="sm"
                                  onClick={() => uploadDocument(document)}
                                  disabled={uploading}
                                >
                                  {uploading ? 'Subiendo...' : 'Subir'}
                                </Button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {uploadedDocs === totalDocs && (
                  <Button 
                    onClick={() => setCurrentStep(2)} 
                    className="w-full"
                  >
                    Continuar con Información Bancaria
                  </Button>
                )}
              </div>
            )}

            {currentStep === 2 && (
              <form onSubmit={handleBankAccountSubmit} className="space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold">Información Bancaria</h3>
                  <p className="text-muted-foreground">
                    Para recibir pagos por tus servicios
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bank-account">Número de Cuenta Bancaria</Label>
                  <Input
                    id="bank-account"
                    value={bankAccount}
                    onChange={(e) => setBankAccount(e.target.value)}
                    placeholder="Ej: 1234567890"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Esta información será verificada y utilizada para procesar tus pagos
                  </p>
                </div>

                <Button type="submit" className="w-full">
                  Completar Registro
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TaskerOnboarding;