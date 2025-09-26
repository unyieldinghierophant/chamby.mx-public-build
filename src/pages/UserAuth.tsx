import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

const UserAuth = () => {
  const { user, signUp, signIn, resetPassword } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [signupData, setSignupData] = useState({
    email: '', password: '', fullName: '', phone: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);
  
  // Error states
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Handle role-based redirects after authentication
  useEffect(() => {
    if (user && !roleLoading && role) {
      if (role === 'provider') {
        navigate('/provider-dashboard');
      } else if (role === 'client') {
        navigate('/search');
      }
    }
  }, [user, role, roleLoading, navigate]);

  // Show loading while checking user role
  if (user && roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

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
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      toast.error(error.message);
      if (error.message.includes('email')) {
        setLoginErrors({ email: 'Email o contraseña incorrectos' });
      } else if (error.message.includes('password')) {
        setLoginErrors({ password: 'Email o contraseña incorrectos' });
      }
    } else {
      toast.success('¡Bienvenido de vuelta!');
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
      signupData.phone,
      false, // is not a tasker
      'client' // role
    );
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
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
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
              <Users className="w-6 h-6 text-primary" />
              Usuario - Chamby
            </CardTitle>
            <p className="text-muted-foreground">Para contratar servicios</p>
          </CardHeader>
          <CardContent>
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
                        <h3 className="font-medium">Recuperar Contraseña</h3>
                      </div>
                      <form onSubmit={handleResetPassword} className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="reset-email">Email</Label>
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
                      <Label htmlFor="signup-phone" className={getLabelClassName('phone', signupErrors)}>
                        Teléfono
                      </Label>
                      <Input
                        id="signup-phone"
                        type="tel"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className={getInputClassName('phone', signupErrors)}
                        placeholder="+52 55 1234 5678"
                        required
                      />
                      {signupErrors.phone && (
                        <p className="text-red-500 text-sm">{signupErrors.phone}</p>
                      )}
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
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            
            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                ¿Eres proveedor de servicios?{' '}
                <Link to="/auth/tasker" className="text-primary hover:text-primary-dark font-medium">
                  Registrate como Tasker
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserAuth;