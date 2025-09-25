import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  AlertTriangle, 
  ArrowLeft, 
  Trash2,
  Shield,
  Clock,
  Download
} from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import { toast } from 'sonner';

const AccountDeletion = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [confirmChecks, setConfirmChecks] = useState({
    understand: false,
    dataLoss: false,
    noRecover: false
  });
  const [isDeleting, setIsDeleting] = useState(false);

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const handleCheckChange = (key: string, checked: boolean) => {
    setConfirmChecks(prev => ({
      ...prev,
      [key]: checked
    }));
  };

  const canDelete = () => {
    return (
      confirmText.toLowerCase() === 'eliminar mi cuenta' &&
      Object.values(confirmChecks).every(Boolean)
    );
  };

  const handleDeleteAccount = async () => {
    if (!canDelete()) return;

    setIsDeleting(true);
    
    try {
      // Simulate account deletion process
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast.success('Tu cuenta ha sido eliminada exitosamente');
      await signOut();
      navigate('/');
    } catch (error) {
      toast.error('Error al eliminar la cuenta. Intenta nuevamente.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="mb-8">
            <Link to="/profile/general" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4">
              <ArrowLeft className="w-4 h-4" />
              Volver a Configuración General
            </Link>
            <h1 className="text-3xl font-bold text-destructive mb-2">Eliminar Mi Cuenta</h1>
            <p className="text-muted-foreground">
              Esta acción es permanente e irreversible
            </p>
          </div>

          <div className="space-y-6">
            {/* Warning Card */}
            <Card className="bg-destructive/5 border-destructive/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <AlertTriangle className="w-8 h-8 text-destructive mt-1" />
                  <div>
                    <h3 className="text-lg font-semibold text-destructive mb-2">
                      ⚠️ Advertencia Importante
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Eliminar tu cuenta resultará en la pérdida permanente de todos tus datos. 
                      Esta acción no se puede deshacer bajo ninguna circunstancia.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* What will be deleted */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trash2 className="w-5 h-5 text-destructive" />
                  Qué se eliminará permanentemente
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    Tu perfil personal y toda la información asociada
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    Historial completo de reservas y servicios
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    Todas las conversaciones y mensajes
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    Métodos de pago guardados
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    Reseñas y calificaciones
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-destructive rounded-full" />
                    Configuraciones y preferencias
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Alternative Options */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Considera estas alternativas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-primary" />
                      <h4 className="font-medium">Desactivar temporalmente</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Oculta tu perfil sin perder tus datos. Puedes reactivarlo cuando quieras.
                    </p>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Download className="w-4 h-4 text-primary" />
                      <h4 className="font-medium">Exportar datos</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Descarga una copia de todos tus datos antes de eliminar tu cuenta.
                    </p>
                    <Link to="/profile/data-export" className="mt-2 inline-block">
                      <Button variant="outline" size="sm">
                        Exportar ahora
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deletion Confirmation */}
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-destructive/20">
              <CardHeader>
                <CardTitle className="text-destructive">Confirmar eliminación</CardTitle>
                <CardDescription>
                  Para continuar, debes confirmar que entiendes las consecuencias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="understand"
                      checked={confirmChecks.understand}
                      onCheckedChange={(checked) => handleCheckChange('understand', checked as boolean)}
                    />
                    <Label htmlFor="understand" className="text-sm cursor-pointer">
                      Entiendo que esta acción eliminará permanentemente mi cuenta y todos los datos asociados
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="dataLoss"
                      checked={confirmChecks.dataLoss}
                      onCheckedChange={(checked) => handleCheckChange('dataLoss', checked as boolean)}
                    />
                    <Label htmlFor="dataLoss" className="text-sm cursor-pointer">
                      Acepto que perderé acceso a todas mis reservas, mensajes y configuraciones
                    </Label>
                  </div>
                  
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      id="noRecover"
                      checked={confirmChecks.noRecover}
                      onCheckedChange={(checked) => handleCheckChange('noRecover', checked as boolean)}
                    />
                    <Label htmlFor="noRecover" className="text-sm cursor-pointer">
                      Comprendo que esta acción no se puede deshacer y no podré recuperar mi cuenta
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-text" className="text-sm">
                    Para confirmar, escribe <strong>"eliminar mi cuenta"</strong> a continuación:
                  </Label>
                  <Input
                    id="confirm-text"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="eliminar mi cuenta"
                    className="font-mono"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    variant="destructive"
                    onClick={handleDeleteAccount}
                    disabled={!canDelete() || isDeleting}
                    className="flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeleting ? 'Eliminando cuenta...' : 'Eliminar mi cuenta permanentemente'}
                  </Button>
                  
                  <Link to="/profile/general">
                    <Button variant="outline" disabled={isDeleting}>
                      Cancelar
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AccountDeletion;