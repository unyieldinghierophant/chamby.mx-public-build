import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthSuccessOverlay } from '@/components/AuthSuccessOverlay';
import logo from '@/assets/chamby-logo-new-horizontal.png';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const ProviderLogin = () => {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // View state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Error states
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  const checkProviderOnboardingComplete = async (userId: string): Promise<boolean> => {
    const { data: provider } = await supabase
      .from('providers')
      .select('skills, zone_served')
      .eq('user_id', userId)
      .single();
    
    return !!(provider?.skills?.length && provider?.zone_served);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginErrors({});
    
    try {
      loginSchema.parse(loginData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setLoginErrors(errors);
        return;
      }
    }
    
    setLoading(true);
    const { error } = await signIn(loginData.email, loginData.password, 'provider');
    
    if (error) {
      toast.error(error.message);
      if (error.message.includes('email') || error.message.includes('Invalid')) {
        setLoginErrors({ email: 'Email o contraseña incorrectos' });
      } else if (error.message.includes('password')) {
        setLoginErrors({ password: 'Email o contraseña incorrectos' });
      }
    } else {
      setSuccessMessage('¡Bienvenido de vuelta, Chambynauta!');
      setShowSuccess(true);
    }
    
    setLoading(false);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Se ha enviado un email de recuperación. Revisa tu bandeja de entrada.');
      setShowResetForm(false);
      setResetEmail('');
    }
    
    setLoading(false);
  };

  const getInputClassName = (fieldName: string) => {
    const baseClass = "flex h-12 w-full rounded-lg border bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    return loginErrors[fieldName] ? `${baseClass} border-destructive` : `${baseClass} border-input`;
  };

  const handleGoogleLogin = async () => {
    localStorage.removeItem('selected_role');
    localStorage.setItem('login_context', 'provider');
    localStorage.setItem('pending_role', 'provider');
    
    setGoogleLoading(true);
    const { error } = await signInWithGoogle(true, 'provider');
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSuccessComplete = async () => {
    // Check if provider has completed onboarding
    const { data: { user } } = await supabase.auth.getUser();
    
    if (user) {
      const isOnboardingComplete = await checkProviderOnboardingComplete(user.id);
      
      if (isOnboardingComplete) {
        navigate('/provider-portal');
      } else {
        // Redirect to onboarding wizard to complete profile
        navigate('/auth/provider');
      }
    } else {
      navigate('/provider-portal');
    }
  };

  return (
    <>
      {showSuccess && (
        <AuthSuccessOverlay
          message={successMessage}
          onComplete={handleSuccessComplete}
        />
      )}
      <div className="min-h-screen min-h-[100dvh] bg-gradient-main bg-gradient-mesh flex flex-col overflow-x-hidden">
        {/* Header */}
        <header className="p-3 sm:p-4 flex-shrink-0">
          <Link 
            to="/provider-landing" 
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2" />
            Volver
          </Link>
        </header>

        {/* Main content */}
        <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-4 sm:py-8 pb-6 sm:pb-12 overflow-y-auto">
          <div className="w-full max-w-sm sm:max-w-md">
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
              <CardHeader className="text-center pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="flex justify-center mb-3 sm:mb-4">
                  <img src={logo} alt="Chamby" className="h-14 sm:h-20 w-auto" />
                </div>
                <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                  Iniciar Sesión
                </CardTitle>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  Accede a tu cuenta de Chambynauta
                </p>
              </CardHeader>
              
              <CardContent className="space-y-4 sm:space-y-5 pt-3 sm:pt-4 px-4 sm:px-6">
                {!showEmailForm ? (
                  <>
                    {/* Google Sign In */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium"
                      onClick={handleGoogleLogin}
                      disabled={googleLoading}
                    >
                      {googleLoading ? (
                        <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                      ) : (
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 mr-2" viewBox="0 0 24 24">
                          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                        </svg>
                      )}
                      Continuar con Google
                    </Button>

                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">o</span>
                      </div>
                    </div>

                    {/* Email Sign In */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 sm:h-12 text-sm sm:text-base font-medium"
                      onClick={() => setShowEmailForm(true)}
                    >
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                      Continuar con Email
                    </Button>
                  </>
                ) : (
                  <>
                    {/* Back button */}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowEmailForm(false);
                        setShowResetForm(false);
                        setLoginErrors({});
                      }}
                      className="-mt-2 mb-2"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver
                    </Button>

                    {/* Email Login Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="login-email" className={loginErrors.email ? 'text-destructive' : ''}>
                          Email
                        </Label>
                        <Input
                          id="login-email"
                          type="email"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className={getInputClassName('email')}
                          placeholder="tu@email.com"
                          required
                        />
                        {loginErrors.email && (
                          <p className="text-destructive text-sm">{loginErrors.email}</p>
                        )}
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="login-password" className={loginErrors.password ? 'text-destructive' : ''}>
                          Contraseña
                        </Label>
                        <Input
                          id="login-password"
                          type="password"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className={getInputClassName('password')}
                          placeholder="••••••••"
                          required
                        />
                        {loginErrors.password && (
                          <p className="text-destructive text-sm">{loginErrors.password}</p>
                        )}
                      </div>
                      
                      <Button type="submit" className="w-full h-11 sm:h-12 text-sm sm:text-base font-semibold" disabled={loading}>
                        {loading ? (
                          <>
                            <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" />
                            Iniciando sesión...
                          </>
                        ) : (
                          'Iniciar Sesión'
                        )}
                      </Button>
                      
                      {!showResetForm && (
                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => setShowResetForm(true)}
                            className="text-sm text-muted-foreground hover:text-primary transition-colors"
                          >
                            ¿Olvidaste tu contraseña?
                          </button>
                        </div>
                      )}
                    </form>

                    {/* Reset Password Form */}
                    {showResetForm && (
                      <div className="mt-4 p-4 border border-border rounded-lg bg-muted/30">
                        <h3 className="font-semibold mb-3 text-foreground text-sm">Recuperar Contraseña</h3>
                        <form onSubmit={handleResetPassword} className="space-y-3">
                          <div className="space-y-2">
                            <Label htmlFor="reset-email" className="text-sm">Email</Label>
                            <Input
                              id="reset-email"
                              type="email"
                              value={resetEmail}
                              onChange={(e) => setResetEmail(e.target.value)}
                              placeholder="tu@email.com"
                              className="h-10"
                              required
                            />
                          </div>
                          <div className="flex gap-2">
                            <Button type="submit" disabled={loading} size="sm" className="flex-1">
                              {loading ? 'Enviando...' : 'Enviar Enlace'}
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setShowResetForm(false);
                                setResetEmail('');
                              }}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </form>
                      </div>
                    )}
                  </>
                )}

                {/* Sign up link */}
                <div className="text-center pt-3 sm:pt-4 border-t border-border pb-1">
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    ¿No tienes cuenta?{' '}
                    <Link 
                      to="/auth/provider" 
                      className="text-primary font-medium hover:underline"
                    >
                      Regístrate como Chambynauta
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProviderLogin;
