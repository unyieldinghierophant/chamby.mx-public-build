import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Mail, Loader2, User, Phone, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthSuccessOverlay } from '@/components/AuthSuccessOverlay';
import { PhoneInput } from '@/components/ui/phone-input';
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar';
import { isValidMexicanPhone, formatPhoneForStorage } from '@/utils/phoneValidation';
import logo from '@/assets/chamby-logo-new-horizontal.png';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().refine(val => isValidMexicanPhone(val), {
    message: 'El teléfono debe tener exactamente 10 dígitos'
  }),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const Login = () => {
  const { signIn, signUp, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Determine initial mode from URL
  const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
  
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);
  
  // View state
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  
  // Error states
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Sync mode with URL params
  useEffect(() => {
    const urlMode = searchParams.get('mode');
    if (urlMode === 'signup' && mode !== 'signup') {
      setMode('signup');
    } else if (urlMode !== 'signup' && mode === 'signup') {
      // URL doesn't have signup mode but state does - sync URL
    }
  }, [searchParams]);

  const toggleMode = (newMode: 'login' | 'signup') => {
    setMode(newMode);
    setShowEmailForm(false);
    setShowResetForm(false);
    setLoginErrors({});
    setSignupErrors({});
    // Update URL without navigation
    if (newMode === 'signup') {
      setSearchParams({ mode: 'signup' });
    } else {
      setSearchParams({});
    }
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
    const { error } = await signIn(loginData.email, loginData.password, 'client');
    
    if (error) {
      toast.error(error.message);
      if (error.message.includes('email') || error.message.includes('Invalid')) {
        setLoginErrors({ email: 'Email o contraseña incorrectos' });
      } else if (error.message.includes('password')) {
        setLoginErrors({ password: 'Email o contraseña incorrectos' });
      }
    } else {
      setSuccessMessage('¡Inicio de sesión exitoso!');
      setShowSuccess(true);
    }
    
    setLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupErrors({});
    
    try {
      signupSchema.parse(signupData);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            errors[err.path[0] as string] = err.message;
          }
        });
        setSignupErrors(errors);
        return;
      }
    }
    
    setLoading(true);
    const formattedPhone = formatPhoneForStorage(signupData.phone);
    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.fullName,
      formattedPhone,
      false, // isProvider = false for clients
      'client'
    );
    
    if (error) {
      let errorMessage = error.message;
      let errorField = 'email';
      
      if (error.message.toLowerCase().includes('weak') || error.message.toLowerCase().includes('password')) {
        errorMessage = 'Elige una contraseña más segura. Añade números o símbolos.';
        errorField = 'password';
      } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
        errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
        errorField = 'email';
      }
      
      toast.error('Error en el registro', { description: errorMessage });
      setSignupErrors({ [errorField]: errorMessage });
    } else {
      setVerificationEmail(signupData.email);
      setShowEmailVerification(true);
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

  const getInputClassName = (fieldName: string, errorState: Record<string, string>) => {
    const baseClass = "flex h-12 w-full rounded-lg border bg-background px-4 py-3 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";
    return errorState[fieldName] ? `${baseClass} border-destructive` : `${baseClass} border-input`;
  };

  const handleGoogleLogin = async () => {
    localStorage.removeItem('selected_role');
    localStorage.setItem('login_context', 'client');
    
    // Store return path before OAuth redirect
    const returnTo = (location.state as { returnTo?: string })?.returnTo;
    if (returnTo) {
      sessionStorage.setItem('auth_return_to', returnTo);
      localStorage.setItem('auth_return_to', returnTo);
    }
    
    setGoogleLoading(true);
    const { error } = await signInWithGoogle(false, 'client');
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSuccessComplete = () => {
    const storedReturnTo =
      localStorage.getItem('auth_return_to') ||
      sessionStorage.getItem('auth_return_to');
    const stateReturnTo = (location.state as { returnTo?: string })?.returnTo;
    const returnTo = storedReturnTo || stateReturnTo || '/user-landing';

    if (storedReturnTo) {
      localStorage.removeItem('auth_return_to');
      sessionStorage.removeItem('auth_return_to');
    }

    navigate(returnTo);
  };

  // Email verification dialog
  if (showEmailVerification) {
    return (
      <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Verifica tu email</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <p className="text-muted-foreground">
              Hemos enviado un enlace de verificación a:
            </p>
            <p className="font-semibold text-foreground">{verificationEmail}</p>
            <p className="text-sm text-muted-foreground">
              Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.
            </p>
            <div className="pt-4 space-y-3">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setShowEmailVerification(false);
                  toggleMode('login');
                }}
              >
                Volver a iniciar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {showSuccess && (
        <AuthSuccessOverlay
          message={successMessage}
          onComplete={handleSuccessComplete}
        />
      )}
      <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex flex-col">
        {/* Header */}
        <header className="p-4">
          <Link 
            to="/" 
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Volver
          </Link>
        </header>

        {/* Main content - centered properly on mobile */}
        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md">
            <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
              <CardHeader className="text-center pb-2">
                <div className="flex justify-center mb-4">
                  <img src={logo} alt="Chamby" className="h-40 w-auto" loading="eager" decoding="async" />
                </div>
                <CardTitle className="text-2xl font-bold text-foreground">
                  {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
                </CardTitle>
                <p className="text-muted-foreground text-sm mt-1">
                  {mode === 'login' 
                    ? 'Accede a tu cuenta de Chamby' 
                    : 'Regístrate para solicitar servicios'}
                </p>
              </CardHeader>
              
              <CardContent className="space-y-5 pt-4">
                {!showEmailForm ? (
                  <>
                    {/* Google Sign In */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 text-base font-medium"
                      onClick={handleGoogleLogin}
                      disabled={googleLoading}
                    >
                      {googleLoading ? (
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
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

                    {/* Email Sign In/Up */}
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-12 text-base font-medium"
                      onClick={() => setShowEmailForm(true)}
                    >
                      <Mail className="w-5 h-5 mr-2" />
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
                        setSignupErrors({});
                      }}
                      className="-mt-2 mb-2"
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver
                    </Button>

                    {mode === 'login' ? (
                      /* Email Login Form */
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
                            className={getInputClassName('email', loginErrors)}
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
                            className={getInputClassName('password', loginErrors)}
                            placeholder="••••••••"
                            required
                          />
                          {loginErrors.password && (
                            <p className="text-destructive text-sm">{loginErrors.password}</p>
                          )}
                        </div>
                        
                        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
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
                    ) : (
                      /* Email Signup Form */
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className={signupErrors.fullName ? 'text-destructive' : ''}>
                            Nombre completo
                          </Label>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="signup-name"
                              type="text"
                              value={signupData.fullName}
                              onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                              className={`pl-10 ${getInputClassName('fullName', signupErrors)}`}
                              placeholder="Juan Pérez"
                              required
                            />
                          </div>
                          {signupErrors.fullName && (
                            <p className="text-destructive text-sm">{signupErrors.fullName}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-email" className={signupErrors.email ? 'text-destructive' : ''}>
                            Email
                          </Label>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="signup-email"
                              type="email"
                              value={signupData.email}
                              onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                              className={`pl-10 ${getInputClassName('email', signupErrors)}`}
                              placeholder="tu@email.com"
                              required
                            />
                          </div>
                          {signupErrors.email && (
                            <p className="text-destructive text-sm">{signupErrors.email}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-phone" className={signupErrors.phone ? 'text-destructive' : ''}>
                            Teléfono
                          </Label>
                          <PhoneInput
                            value={signupData.phone}
                            onChange={(value) => setSignupData({ ...signupData, phone: value })}
                            error={!!signupErrors.phone}
                          />
                          {signupErrors.phone && (
                            <p className="text-destructive text-sm">{signupErrors.phone}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className={signupErrors.password ? 'text-destructive' : ''}>
                            Contraseña
                          </Label>
                          <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                            <Input
                              id="signup-password"
                              type="password"
                              value={signupData.password}
                              onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                              className={`pl-10 ${getInputClassName('password', signupErrors)}`}
                              placeholder="••••••••"
                              required
                            />
                          </div>
                          <PasswordStrengthBar password={signupData.password} />
                          {signupErrors.password && (
                            <p className="text-destructive text-sm">{signupErrors.password}</p>
                          )}
                        </div>
                        
                        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
                          {loading ? (
                            <>
                              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                              Creando cuenta...
                            </>
                          ) : (
                            'Crear Cuenta'
                          )}
                        </Button>
                      </form>
                    )}

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

                {/* Toggle between login/signup */}
                <div className="text-center pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    {mode === 'login' ? (
                      <>
                        ¿No tienes cuenta?{' '}
                        <button 
                          onClick={() => toggleMode('signup')}
                          className="text-primary font-medium hover:underline"
                        >
                          Regístrate aquí
                        </button>
                      </>
                    ) : (
                      <>
                        ¿Ya tienes cuenta?{' '}
                        <button 
                          onClick={() => toggleMode('login')}
                          className="text-primary font-medium hover:underline"
                        >
                          Inicia sesión
                        </button>
                      </>
                    )}
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

export default Login;