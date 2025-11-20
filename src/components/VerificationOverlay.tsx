import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ModernButton } from "@/components/ui/modern-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, FileText, Home, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Document {
  doc_type: string;
  verification_status: string;
}

interface VerificationOverlayProps {
  onClose: () => void;
}

const VerificationOverlay = ({ onClose }: VerificationOverlayProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocuments = async () => {
      if (!user) return;

      try {
        const { data: docs } = await supabase
          .from('documents')
          .select('doc_type, verification_status')
          .eq('client_id', user.id);

        setDocuments(docs || []);
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [user]);

  const requiredDocs = [
    { type: 'id_card', label: 'Identificación Oficial', icon: FileText },
    { type: 'proof_of_address', label: 'Comprobante de Domicilio', icon: Home },
    { type: 'criminal_record', label: 'Antecedentes No Penales', icon: Shield }
  ];

  const getDocStatus = (docType: string) => {
    const doc = documents.find(d => d.doc_type === docType);
    return doc?.verification_status || 'missing';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-700 border-green-200">Verificado</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">Pendiente</Badge>;
      default:
        return <Badge className="bg-red-100 text-red-700 border-red-200">Faltante</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600">Cargando estado de verificación...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <CardTitle className="text-center">
            Completa tu Verificación para Listar Servicios
          </CardTitle>
          <p className="text-center text-gray-600">
            Necesitas completar tu verificación antes de poder ofrecer servicios en Chamby
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {requiredDocs.map((doc) => {
              const status = getDocStatus(doc.type);
              const Icon = doc.icon;
              
              return (
                <div key={doc.type} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Icon className="h-6 w-6 text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900">{doc.label}</h4>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(status)}
                    {getStatusBadge(status)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-4 pt-4">
            <ModernButton 
              variant="outline" 
              onClick={onClose}
              className="flex-1"
            >
              Cerrar
            </ModernButton>
            <ModernButton 
              onClick={() => navigate('/tasker-onboarding')}
              className="flex-1"
            >
              Completar Verificación
            </ModernButton>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificationOverlay;