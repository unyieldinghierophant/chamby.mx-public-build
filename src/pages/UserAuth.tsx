import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Users, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';
import { AuthSuccessOverlay } from '@/components/AuthSuccessOverlay';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const UserAuth = () => {
  const { signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '', password: '', fullName: '', phone: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  
  // View state
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Error states
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

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
      if (error.message.includes('email')) {
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
    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.fullName,
      signupData.phone || undefined,
      false,
      'client'
    );
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Cuenta creada! Revisa tu email para confirmar.');
      setSuccessMessage('¡Registro exitoso! Revisa tu email.');
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

  const getInputClassName = (fieldName: string, errors: Record<string, string>) => {
    const baseClass = "flex h-10 w-full rounded-md border bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm";
    return errors[fieldName] ? `${baseClass} border-red-500` : `${baseClass} border-input`;
  };

  const getLabelClassName = (fieldName: string, errors: Record<string, string>) => {
    const baseClass = "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70";
    return errors[fieldName] ? `${baseClass} text-red-500` : baseClass;
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
    
    const { error } = await signInWithGoogle(false, 'client');
    if (error) {
      toast.error(error.message);
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

  return (
    <>
      {showSuccess && (
        <AuthSuccessOverlay
          message={successMessage}
          onComplete={handleSuccessComplete}
        />
      )}
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
              <CardTitle className="text-3xl font-bold text-foreground">
                Bienvenido
              </CardTitle>
              <p className="text-muted-foreground text-sm">Inicia sesión o crea tu cuenta</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {!showEmailAuth ? (
                <>
                  <div className="space-y-3">
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
                  </div>

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
                </>
              ) : (
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
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                      <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                      <TabsTrigger value="signup">Registrarse</TabsTrigger>
                    </TabsList>

                    {/* Login Tab */}
                    <TabsContent value="login" className="mt-0">
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
                            <p className="text-red-500 text-sm">{loginErrors.email}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="login-password" className={getLabelClassName('password', loginErrors)}>
                            Contraseña
                          </Label>
                          <Input
                            id="login-password"
                            type="password"
                            value={loginData.password}
                            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            className={getInputClassName('password', loginErrors)}
                            required
                          />
                          {loginErrors.password && (
                            <p className="text-red-500 text-sm">{loginErrors.password}</p>
                          )}
                        </div>
                        <Button type="submit" className="w-full h-11" disabled={loading}>
                          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
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
                        <div className="mt-6 p-5 border border-border rounded-lg bg-muted/30">
                          <h3 className="font-semibold mb-3 text-foreground">Recuperar Contraseña</h3>
                          <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-2">
                              <Label htmlFor="reset-email">Email</Label>
                              <Input
                                id="reset-email"
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="tu@email.com"
                                required
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button type="submit" disabled={loading} className="flex-1">
                                {loading ? 'Enviando...' : 'Enviar Enlace'}
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline"
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
                    <TabsContent value="signup" className="mt-0">
                      <form onSubmit={handleSignup} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="signup-name" className={getLabelClassName('fullName', signupErrors)}>
                            Nombre Completo
                          </Label>
                          <Input
                            id="signup-name"
                            value={signupData.fullName}
                            onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                            className={getInputClassName('fullName', signupErrors)}
                            required
                          />
                          {signupErrors.fullName && (
                            <p className="text-red-500 text-sm">{signupErrors.fullName}</p>
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
                            <p className="text-red-500 text-sm">{signupErrors.email}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-phone">
                            Teléfono (opcional)
                          </Label>
                          <Input
                            id="signup-phone"
                            type="tel"
                            value={signupData.phone}
                            onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                            placeholder="10 dígitos"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="signup-password" className={getLabelClassName('password', signupErrors)}>
                            Contraseña
                          </Label>
                          <Input
                            id="signup-password"
                            type="password"
                            value={signupData.password}
                            onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                            className={getInputClassName('password', signupErrors)}
                            required
                          />
                          {signupErrors.password && (
                            <p className="text-red-500 text-sm">{signupErrors.password}</p>
                          )}
                        </div>
                        <Button type="submit" className="w-full h-11" disabled={loading}>
                          {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>
                </>
              )}

              {/* Provider Link */}
              <div className="text-center pt-4 border-t border-border">
                <p className="text-sm text-muted-foreground mb-2">
                  ¿Eres proveedor de servicios?
                </p>
                <Link 
                  to="/provider/onboarding" 
                  className="inline-flex items-center text-primary hover:text-primary-dark transition-colors font-medium text-sm"
                >
                  Regístrate como proveedor
                  <Users className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default UserAuth;
