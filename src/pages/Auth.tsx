import { useState, useEffect } from 'react';
import { Navigate, useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Briefcase } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const Auth = () => {
  const { user, signUp, signIn, resetPassword } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const roleParam = searchParams.get('role');
  const [activeTab, setActiveTab] = useState(() => {
    if (roleParam === 'provider') return 'tasker';
    if (roleParam === 'client') return 'user';
    return 'login';
  });
  
  // Form states
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [userSignupData, setUserSignupData] = useState({
    email: '', password: '', fullName: '', phone: ''
  });
  const [taskerSignupData, setTaskerSignupData] = useState({
    email: '', password: '', fullName: '', phone: ''
  });
  const [resetEmail, setResetEmail] = useState('');
  const [showResetForm, setShowResetForm] = useState(false);

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
    setLoading(true);
    
    const { error } = await signIn(loginData.email, loginData.password);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Bienvenido de vuelta!');
    }
    
    setLoading(false);
  };

  const handleUserSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(
      userSignupData.email,
      userSignupData.password,
      userSignupData.fullName,
      userSignupData.phone,
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

  const handleTaskerSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const { error } = await signUp(
      taskerSignupData.email,
      taskerSignupData.password,
      taskerSignupData.fullName,
      taskerSignupData.phone,
      true, // is a tasker
      'provider' // role
    );
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success('¡Cuenta de tasker creada! Revisa tu email y completa tu perfil con los documentos requeridos.');
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

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <Link 
          to="/user-landing" 
          className="inline-flex items-center text-primary hover:text-primary-dark mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver al inicio
        </Link>

        <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-foreground">
              Acceder a Chamby
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
                <TabsTrigger value="user">
                  <Users className="w-4 h-4 mr-1" />
                  Usuario
                </TabsTrigger>
                <TabsTrigger value="tasker">
                  <Briefcase className="w-4 h-4 mr-1" />
                  Tasker
                </TabsTrigger>
              </TabsList>

              {/* Login Tab */}
              <TabsContent value="login">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
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
                    <h3 className="font-medium mb-3">Recuperar Contraseña</h3>
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

              {/* User Signup Tab */}
              <TabsContent value="user">
                <div className="mb-4">
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    <Users className="w-4 h-4 mr-2" />
                    Registro de Usuario
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Para contratar servicios en la plataforma
                  </p>
                </div>
                <form onSubmit={handleUserSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="user-name">Nombre Completo</Label>
                    <Input
                      id="user-name"
                      value={userSignupData.fullName}
                      onChange={(e) => setUserSignupData({ ...userSignupData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-email">Email</Label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userSignupData.email}
                      onChange={(e) => setUserSignupData({ ...userSignupData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-phone">Teléfono</Label>
                    <Input
                      id="user-phone"
                      type="tel"
                      value={userSignupData.phone}
                      onChange={(e) => setUserSignupData({ ...userSignupData, phone: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="user-password">Contraseña</Label>
                    <Input
                      id="user-password"
                      type="password"
                      value={userSignupData.password}
                      onChange={(e) => setUserSignupData({ ...userSignupData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta de Usuario'}
                  </Button>
                </form>
              </TabsContent>

              {/* Tasker Signup Tab */}
              <TabsContent value="tasker">
                <div className="mb-4">
                  <Badge variant="secondary" className="w-full justify-center py-2">
                    <Briefcase className="w-4 h-4 mr-2" />
                    Registro de Tasker
                  </Badge>
                  <p className="text-sm text-muted-foreground mt-2 text-center">
                    Para ofrecer servicios en la plataforma
                  </p>
                </div>
                <form onSubmit={handleTaskerSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="tasker-name">Nombre Completo</Label>
                    <Input
                      id="tasker-name"
                      value={taskerSignupData.fullName}
                      onChange={(e) => setTaskerSignupData({ ...taskerSignupData, fullName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tasker-email">Email</Label>
                    <Input
                      id="tasker-email"
                      type="email"
                      value={taskerSignupData.email}
                      onChange={(e) => setTaskerSignupData({ ...taskerSignupData, email: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tasker-phone">Teléfono</Label>
                    <Input
                      id="tasker-phone"
                      type="tel"
                      value={taskerSignupData.phone}
                      onChange={(e) => setTaskerSignupData({ ...taskerSignupData, phone: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tasker-password">Contraseña</Label>
                    <Input
                      id="tasker-password"
                      type="password"
                      value={taskerSignupData.password}
                      onChange={(e) => setTaskerSignupData({ ...taskerSignupData, password: e.target.value })}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Creando cuenta...' : 'Crear Cuenta de Tasker'}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Después del registro, necesitarás subir documentos de verificación
                  </p>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;