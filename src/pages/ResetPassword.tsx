import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, CheckCircle, Lock, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar';
import { FullPageSkeleton } from '@/components/skeletons';

const passwordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Verify the recovery token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        // Check if we have the required parameters
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        
        // Also check for access_token (newer flow)
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');
        
        console.log('Reset password params:', { tokenHash, type, accessToken: !!accessToken });
        
        if (accessToken && refreshToken) {
          // New flow: set session directly
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });
          
          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('El enlace de recuperación ha expirado o es inválido.');
          } else {
            setVerified(true);
          }
        } else if (tokenHash && type === 'recovery') {
          // Old flow: verify OTP
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: 'recovery'
          });
          
          if (verifyError) {
            console.error('Verify error:', verifyError);
            setError('El enlace de recuperación ha expirado o es inválido.');
          } else {
            setVerified(true);
          }
        } else {
          // Check if user is already authenticated (came from email link)
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setVerified(true);
          } else {
            setError('Enlace de recuperación inválido. Solicita uno nuevo.');
          }
        }
      } catch (err) {
        console.error('Token verification error:', err);
        setError('Error al verificar el enlace. Intenta solicitar uno nuevo.');
      } finally {
        setVerifying(false);
      }
    };
    
    verifyToken();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    try {
      passwordSchema.parse(formData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setFormErrors(errors);
        return;
      }
    }
    
    setLoading(true);
    
    const { error } = await updatePassword(formData.password);
    
    if (error) {
      let errorMessage = error.message;
      
      if (error.message.toLowerCase().includes('weak') || error.message.toLowerCase().includes('easy to guess')) {
        errorMessage = 'La contraseña es muy común o fácil de adivinar. Elige una diferente.';
        setFormErrors({ password: errorMessage });
      } else if (error.message.toLowerCase().includes('same')) {
        errorMessage = 'La nueva contraseña debe ser diferente a la anterior.';
        setFormErrors({ password: errorMessage });
      }
      
      toast.error('Error al actualizar contraseña', { description: errorMessage });
    } else {
      setSuccess(true);
      toast.success('¡Contraseña actualizada exitosamente!');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/user-auth');
      }, 3000);
    }
    
    setLoading(false);
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
    return formErrors[fieldName] ? `${baseClass} border-destructive` : `${baseClass} border-input`;
  };

  // Loading state
  if (verifying) {
    return <FullPageSkeleton />;
  }

  // Error state
  if (error && !verified) {
    return (
      <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md">
          <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
            <CardContent className="pt-8 pb-8 text-center">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">Enlace Expirado</h2>
              <p className="text-muted-foreground mb-6">{error}</p>
              <Link to="/user-auth">
                <Button className="w-full">
                  Solicitar nuevo enlace
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center py-12 px-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
          <CardContent className="pt-8 pb-8 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">¡Contraseña Actualizada!</h2>
            <p className="text-muted-foreground mb-4">
              Tu contraseña ha sido cambiada exitosamente.
            </p>
            <p className="text-sm text-muted-foreground">
              Redirigiendo al inicio de sesión...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset form
  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center text-primary hover:text-primary-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
          <CardHeader className="text-center pb-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold text-foreground">
              Nueva Contraseña
            </CardTitle>
            <p className="text-muted-foreground text-sm mt-2">
              Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className={formErrors.password ? 'text-destructive' : ''}>
                  Nueva Contraseña
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className={getInputClassName('password')}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
                {formErrors.password && (
                  <p className="text-destructive text-sm">{formErrors.password}</p>
                )}
                <PasswordStrengthBar password={formData.password} className="mt-2" />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className={formErrors.confirmPassword ? 'text-destructive' : ''}>
                  Confirmar Contraseña
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className={getInputClassName('confirmPassword')}
                  placeholder="Repite la contraseña"
                  required
                />
                {formErrors.confirmPassword && (
                  <p className="text-destructive text-sm">{formErrors.confirmPassword}</p>
                )}
              </div>

              <Button type="submit" className="w-full h-11" disabled={loading}>
                {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
