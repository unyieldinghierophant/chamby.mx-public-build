import { useState, useEffect } from 'react';
import { Navigate, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Briefcase, Phone, Mail, FileCheck, Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthSuccessOverlay } from '@/components/AuthSuccessOverlay';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número')
    .regex(/[^A-Za-z0-9]/, 'Debe contener al menos un carácter especial'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

// Password strength calculator
const calculatePasswordStrength = (password: string): { strength: number; label: string; color: string } => {
  let strength = 0;
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;
  if (/[A-Z]/.test(password)) strength++;
  if (/[a-z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[^A-Za-z0-9]/.test(password)) strength++;
  
  if (strength <= 2) return { strength, label: 'Débil', color: 'bg-red-500' };
  if (strength <= 4) return { strength, label: 'Regular', color: 'bg-yellow-500' };
  return { strength, label: 'Fuerte', color: 'bg-green-500' };
};

const ProviderAuth = () => {
  const { user, signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  
  // Check for tab parameter in URL
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam === 'login' ? 'login' : 'signup');
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '', password: '', fullName: '', phone: '', confirmPassword: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  
  // View state
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showEmailVerificationModal, setShowEmailVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  
  // Error states
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});
  
  // Password visibility states
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Password strength
  const passwordStrength = calculatePasswordStrength(signupData.password);

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
      // Check for unconfirmed email
      if (error.message.includes('Email not confirmed') || error.message.includes('email_not_confirmed')) {
        setLoginErrors({ 
          email: '⚠️ Email no verificado. Por favor verifica tu correo electrónico antes de iniciar sesión.' 
        });
        toast.error('Email no verificado', {
          description: 'Revisa tu bandeja de entrada o spam para el correo de verificación.',
          action: {
            label: 'Reenviar',
            onClick: () => handleResendVerification(loginData.email)
          }
        });
      } else {
        toast.error('Email o contraseña incorrectos');
        setLoginErrors({ email: 'Email o contraseña incorrectos' });
      }
    } else {
      setSuccessMessage('¡Inicio de sesión exitoso!');
      setShowSuccess(true);
    }
    
    setLoading(false);
  };

  const handleResendVerification = async (email: string) => {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    });
    
    if (error) {
      toast.error('Error al reenviar correo');
    } else {
      toast.success('Correo de verificación reenviado');
    }
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
    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.fullName,
      signupData.phone,
      true, // is a provider
      'provider' // role
    );
    
    if (error) {
      // Translate common error messages to Spanish
      let errorMessage = error.message;
      let errorField = 'email';
      
      // Check if it's a password-related error
      if (error.message.toLowerCase().includes('password')) {
        errorField = 'password';
        if (error.message.includes('weak') || error.message.includes('easy to guess')) {
          errorMessage = 'La contraseña es débil y fácil de adivinar, por favor elige una diferente.';
        } else if (error.message.includes('short')) {
          errorMessage = 'La contraseña es demasiado corta.';
        } else {
          errorMessage = 'La contraseña no cumple con los requisitos de seguridad.';
        }
      } else if (error.message.includes('already registered') || error.message.includes('already exists')) {
        errorMessage = 'Este email ya está registrado.';
      } else if (error.message.includes('invalid email')) {
        errorMessage = 'El email no es válido.';
      }
      
      toast.error('Error en el registro', {
        description: errorMessage
      });
      setSignupErrors({ [errorField]: errorMessage });
    } else {
      // Show email verification modal instead of success overlay
      setVerificationEmail(signupData.email);
      setShowEmailVerificationModal(true);
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

  const getInputClassName = (fieldName: string, errors: Record<string, string>) => {
    const baseClass = "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
    return errors[fieldName] ? `${baseClass} border-red-500` : `${baseClass} border-input`;
  };

  const getLabelClassName = (fieldName: string, errors: Record<string, string>) => {
    const baseClass = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
    return errors[fieldName] ? `${baseClass} text-red-600` : baseClass;
  };

  const handleGoogleLogin = async () => {
    // Clear any previous role selection to force fresh role picker
    localStorage.removeItem('selected_role');
    
    // Store return path before OAuth redirect
    const returnTo = (location.state as { returnTo?: string })?.returnTo;
    if (returnTo) {
      sessionStorage.setItem('auth_return_to', returnTo);
      localStorage.setItem('auth_return_to', returnTo); // Backup for OAuth
    }
    
    const { error } = await signInWithGoogle(true, 'provider'); // true = provider, 'provider' = login context
    if (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      {showSuccess && (
        <AuthSuccessOverlay
          message={successMessage}
          onComplete={() => {
            const returnTo = (location.state as { returnTo?: string })?.returnTo || '/provider-portal';
            navigate(returnTo);
          }}
        />
      )}
      <div className="show-recaptcha min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center text-primary hover:text-primary-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Briefcase className="w-6 h-6 text-primary" />
              Chambynauta - Chamby
            </CardTitle>
            <p className="text-muted-foreground">Para ofrecer servicios profesionales</p>
          </CardHeader>
          <CardContent>
            {!showEmailAuth ? (
              // OAuth Buttons View
              <div className="space-y-4">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base"
                  onClick={handleGoogleLogin}
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
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

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 text-base"
                  onClick={() => setShowEmailAuth(true)}
                >
                  <Mail className="w-5 h-5 mr-2" />
                  Continuar con Email
                </Button>
              </div>
            ) : (
              // Email Auth View
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowEmailAuth(false)}
                  className="mb-2"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Volver
                </Button>

              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Inicio de Sesión</TabsTrigger>
                  <TabsTrigger value="signup">Registro</TabsTrigger>
                </TabsList>

                {/* Login Tab */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className={getLabelClassName('email', loginErrors)}>
                        Email
                      </Label>
                      <Input
                        id="login-email"
                        type="email"
                        value={loginData.email}
                        onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        className={getInputClassName('email', loginErrors)}
                        required
                      />
                      {loginErrors.email && (
                        <p className="text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {loginErrors.email}
                        </p>
                      )}
                    </div>
                     <div className="space-y-2">
                      <Label htmlFor="login-password" className={getLabelClassName('password', loginErrors)}>
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className={getInputClassName('password', loginErrors)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {loginErrors.password && (
                        <p className="text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {loginErrors.password}
                        </p>
                      )}
                    </div>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                    </Button>
                    <div className="text-center">
                      <button
                        type="button"
                        onClick={() => setShowResetForm(true)}
                        className="text-sm text-primary hover:text-primary-dark transition-colors"
                      >
                        ¿Olvidaste tu contraseña?
                      </button>
                    </div>
                  </form>

                  {/* Reset Password Form */}
                  {showResetForm && (
                    <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2 mb-3">
                        <Mail className="w-4 h-4 text-primary" />
                        <h4 className="font-medium">Recuperar Contraseña</h4>
                      </div>
                      <form onSubmit={handleResetPassword} className="space-y-3">
                        <div>
                          <Label htmlFor="reset-email" className="text-sm">
                            Email
                          </Label>
                          <Input
                            id="reset-email"
                            type="email"
                            value={resetEmail}
                            onChange={(e) => setResetEmail(e.target.value)}
                            placeholder="Ingresa tu email"
                            required
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" size="sm" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar'}
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
                </TabsContent>

                {/* Signup Tab */}
                <TabsContent value="signup">
                  <div className="mb-4">
                    <Badge variant="secondary" className="w-full justify-center py-2">
                      <Briefcase className="w-4 h-4 mr-2" />
                      Registro de Chambynauta Profesional
                    </Badge>
                  </div>
                  
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-fullName" className={getLabelClassName('fullName', signupErrors)}>
                        Nombre Completo
                      </Label>
                      <Input
                        id="signup-fullName"
                        type="text"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        className={getInputClassName('fullName', signupErrors)}
                        required
                      />
                      {signupErrors.fullName && (
                        <p className="text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {signupErrors.fullName}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className={getLabelClassName('email', signupErrors)}>
                        Email
                      </Label>
                      <Input
                        id="signup-email"
                        type="email"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className={getInputClassName('email', signupErrors)}
                        required
                      />
                      {signupErrors.email && (
                        <p className="text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {signupErrors.email}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-phone" className={getLabelClassName('phone', signupErrors)}>
                        Teléfono
                      </Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className={getInputClassName('phone', signupErrors)}
                        required
                      />
                      {signupErrors.phone && (
                        <p className="text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {signupErrors.phone}
                        </p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className={getLabelClassName('password', signupErrors)}>
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-password"
                          type={showPassword ? "text" : "password"}
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className={getInputClassName('password', signupErrors)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signupErrors.password && (
                        <p className="text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {signupErrors.password}
                        </p>
                      )}
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: passwordStrength.color }}></div>
                        <p className="text-xs text-muted-foreground">
                          Fuerza: <span className="font-medium">{passwordStrength.label}</span>
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirmPassword" className={getLabelClassName('confirmPassword', signupErrors)}>
                        Confirmar Contraseña
                      </Label>
                      <div className="relative">
                        <Input
                          id="signup-confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          className={getInputClassName('confirmPassword', signupErrors)}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signupErrors.confirmPassword && (
                        <p className="text-red-600 text-sm flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          {signupErrors.confirmPassword}
                        </p>
                      )}
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta de Chambynauta'}
                    </Button>
                    <p className="text-xs text-muted-foreground text-center">
                      Al registrarte, aceptas completar el proceso de verificación con documentos oficiales
                    </p>
                  </form>
                </TabsContent>
              </Tabs>
            </>
            )}
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Buscas contratar servicios?{' '}
                <Link to="/auth/user" className="text-primary hover:text-primary-dark font-medium">
                  Registrate como Usuario
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Email Verification Modal */}
      <Dialog open={showEmailVerificationModal} onOpenChange={setShowEmailVerificationModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              ¡Registro exitoso! 📧
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-4">
              <p className="text-base">
                Te hemos enviado un correo de verificación a{' '}
                <span className="font-semibold text-foreground">{verificationEmail}</span>
              </p>
              <p>
                Por favor revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta de Chambynauta.
              </p>
              <p className="text-sm text-muted-foreground">
                Si no ves el correo, revisa tu carpeta de spam.
              </p>
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              onClick={() => handleResendVerification(verificationEmail)}
              variant="outline"
              className="w-full"
            >
              Reenviar correo
            </Button>
            <Button
              onClick={() => {
                setShowEmailVerificationModal(false);
                setActiveTab('login');
              }}
              className="w-full"
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </>
  );
};

export default ProviderAuth;
