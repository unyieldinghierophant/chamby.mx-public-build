import React from 'react';
import { useNavigate } from 'react-router-dom';
import { XCircle, ArrowLeft, RotateCcw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { ModernButton } from '@/components/ui/modern-button';
import MobileBottomNav from '@/components/MobileBottomNav';

const PaymentCanceled = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background mobile-pb-nav">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/user-landing')}
              className="flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Inicio</span>
            </button>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Pago Cancelado</h1>
              <p className="text-sm text-muted-foreground">No se realizó ningún cargo</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="p-8">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            
            <h2 className="text-2xl font-bold text-foreground mb-4">
              Solicitud Cancelada
            </h2>
            
            <p className="text-muted-foreground mb-8 leading-relaxed">
              Tu solicitud fue cancelada. Puedes crear una nueva solicitud de servicio 
              cuando estés listo.
            </p>

            <div className="space-y-3">
              <ModernButton 
                onClick={() => navigate(-2)} // Go back to booking page
                className="w-full"
                size="lg"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Intentar Nuevamente
              </ModernButton>
              
              <ModernButton 
                variant="outline"
                onClick={() => navigate('/user-landing')}
                className="w-full"
                size="lg"
              >
                Buscar Otros Servicios
              </ModernButton>
              
              <ModernButton 
                variant="outline"
                onClick={() => navigate('/user-landing')}
                className="w-full"
              >
                Volver al Inicio
              </ModernButton>
            </div>
          </CardContent>
        </Card>
      </div>

      <MobileBottomNav />
    </div>
  );
};

export default PaymentCanceled;