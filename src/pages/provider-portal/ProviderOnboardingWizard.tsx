import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  User, 
  Wrench, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  Plus,
  X,
  Mail,
  Lock,
  Phone,
  Eye,
  EyeOff,
  LogIn
} from 'lucide-react';
import authSecurityImage from '@/assets/auth-security.png';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { PhoneInput } from '@/components/ui/phone-input';
import { isValidMexicanPhone, formatPhoneForStorage, MEXICO_COUNTRY_CODE } from '@/utils/phoneValidation';
import { WorkZonePicker } from '@/components/WorkZonePicker';
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar';

const signupSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string()
    .refine(val => isValidMexicanPhone(val), {
      message: 'El teléfono debe tener exactamente 10 dígitos'
    }),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

const SUGGESTED_SKILLS = [
  'Plomería', 'Electricidad', 'Carpintería', 'Pintura', 
  'Jardinería', 'Limpieza', 'Reparaciones', 'Instalaciones',
  'Mantenimiento', 'Albañilería', 'Herrería', 'Vidriería'
];

const STEP_CONFIG = [
  { id: 1, icon: Sparkles, title: '¡Bienvenido!' },
  { id: 2, icon: Mail, title: 'Cuenta' },
  { id: 3, icon: User, title: 'Perfil' },
  { id: 4, icon: Wrench, title: 'Habilidades' },
  { id: 5, icon: MapPin, title: 'Zona de Trabajo' },
  { id: 6, icon: Calendar, title: 'Disponibilidad' },
  { id: 7, icon: CheckCircle2, title: '¡Listo!' }
];

export default function ProviderOnboardingWizard() {
  const { user, signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Auth mode: 'signup' or 'login'
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('signup');
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);

  // Signup data
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Login data
  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });
  const [loginErrors, setLoginErrors] = useState<Record<string, string>>({});

  // Profile data
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    bio: ''
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [workZone, setWorkZone] = useState('');
  const [workZoneCoords, setWorkZoneCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [workZoneRadius, setWorkZoneRadius] = useState(5); // km
  const [availability, setAvailability] = useState('weekdays-9-5');

  // Memoized callback to prevent infinite re-renders in WorkZonePicker
  const handleWorkZoneChange = useCallback((lat: number, lng: number, radiusKm: number, zoneName: string) => {
    setWorkZoneCoords({ lat, lng });
    setWorkZoneRadius(radiusKm);
    setWorkZone(zoneName);
  }, []);

  // Check URL params for initial mode
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login') {
      setAuthMode('login');
      if (!user) {
        setCurrentStep(2); // Go directly to auth step
      }
    } else if (tab === 'signup') {
      setAuthMode('signup');
    }
  }, [searchParams, user]);

  useEffect(() => {
    // If user is already logged in, skip to profile step
    if (user) {
      setCurrentStep(3);
      
      // Load existing user data
      const loadUserData = async () => {
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (userData) {
          setProfileData({
            displayName: userData.full_name || '',
            phone: userData.phone || '',
            bio: ''
          });
          setSignupData(prev => ({
            ...prev,
            fullName: userData.full_name || '',
            phone: userData.phone || ''
          }));
        }
      };

      loadUserData();
    }
  }, [user]);

  const totalSteps = STEP_CONFIG.length;
  const progress = (currentStep / totalSteps) * 100;

  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showVerificationPending, setShowVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);

  const handleSignup = async () => {
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
        toast.error('Por favor completa todos los campos correctamente');
        return;
      }
    }

    setSaving(true);
    const formattedPhone = formatPhoneForStorage(signupData.phone);
    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.fullName,
      formattedPhone,
      true, // is a provider
      'provider' // role
    );

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        errorMessage = 'Este email ya está registrado. Intenta iniciar sesión.';
      }
      toast.error('Error en el registro', { description: errorMessage });
      setSignupErrors({ email: errorMessage });
      setSaving(false);
      return;
    }

    // Mark as new provider signup
    localStorage.setItem('new_provider_signup', 'true');
    localStorage.setItem('login_context', 'provider');
    
    // Show email verification message
    setVerificationEmail(signupData.email);
    setShowEmailVerification(true);
    
    setSaving(false);
  };

  const handleLogin = async () => {
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
        toast.error('Por favor completa todos los campos');
        return;
      }
    }

    setSaving(true);
    localStorage.setItem('login_context', 'provider');
    
    const { error } = await signIn(loginData.email, loginData.password, 'provider');

    if (error) {
      let errorMessage = error.message;
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email o contraseña incorrectos';
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor verifica tu email antes de iniciar sesión';
        setVerificationEmail(loginData.email);
        setShowVerificationPending(true);
        setSaving(false);
        return;
      }
      
      toast.error('Error al iniciar sesión', { description: errorMessage });
      setLoginErrors({ email: errorMessage });
      setSaving(false);
      return;
    }

    toast.success('¡Bienvenido de vuelta!');
    setSaving(false);
    // Navigation will happen via useEffect when user state updates
  };

  const handleGoogleLogin = async () => {
    setSaving(true);
    localStorage.setItem('login_context', 'provider');
    
    const { error } = await signInWithGoogle(true, 'provider');
    
    if (error) {
      toast.error('Error con Google', { description: error.message });
      setSaving(false);
    }
    // If successful, user will be redirected by Google OAuth flow
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) {
      toast.error('Por favor ingresa tu email');
      return;
    }

    setSaving(true);
    const { error } = await resetPassword(resetEmail);
    
    if (error) {
      toast.error('Error', { description: error.message });
    } else {
      setResetSent(true);
      toast.success('Correo enviado', {
        description: 'Revisa tu bandeja de entrada para restablecer tu contraseña'
      });
    }
    setSaving(false);
  };

  const handleResendVerification = async (email: string) => {
    setSaving(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?login_context=provider`
      }
    });
    
    if (error) {
      toast.error('Error al reenviar', { description: error.message });
    } else {
      toast.success('Correo reenviado', {
        description: 'Revisa tu bandeja de entrada'
      });
    }
    setSaving(false);
  };

  const handleVerifyWithCode = async () => {
    if (!verificationCode.trim() || !verificationEmail) {
      toast.error('Por favor ingresa el código de verificación');
      return;
    }

    setVerifyingCode(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: verificationEmail,
        token: verificationCode.trim(),
        type: 'signup'
      });

      if (error) {
        toast.error('Código inválido', { description: error.message });
      } else {
        toast.success('¡Email verificado!', {
          description: 'Tu cuenta ha sido activada'
        });
        setShowVerificationPending(false);
        setAuthMode('login');
        setLoginData({ email: verificationEmail, password: '' });
      }
    } catch (error: any) {
      toast.error('Error al verificar', { description: error.message });
    } finally {
      setVerifyingCode(false);
    }
  };

  const goToNext = () => {
    if (currentStep < totalSteps) {
      setSlideDirection('right');
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 1) {
      // Skip back to signup if not authenticated
      if (currentStep === 3 && !user) {
        setSlideDirection('left');
        setCurrentStep(2);
        return;
      }
      setSlideDirection('left');
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) 
        ? prev.filter(s => s !== skill)
        : [...prev, skill]
    );
  };

  const addCustomSkill = () => {
    if (customSkill.trim() && !selectedSkills.includes(customSkill.trim())) {
      setSelectedSkills([...selectedSkills, customSkill.trim()]);
      setCustomSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setSelectedSkills(selectedSkills.filter(s => s !== skill));
  };

  const handleFinish = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Update provider profile with zone info
      const { error: providerError } = await supabase
        .from('providers')
        .update({
          display_name: profileData.displayName,
          skills: selectedSkills,
          zone_served: workZone || `${workZoneRadius}km radius`,
          current_latitude: workZoneCoords?.lat || null,
          current_longitude: workZoneCoords?.lng || null,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (providerError) throw providerError;

      // Update user profile
      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: profileData.displayName,
          phone: profileData.phone,
          bio: profileData.bio
        })
        .eq('id', user.id);

      if (userError) throw userError;

      toast.success('¡Perfil completado!', {
        description: 'Tu cuenta está lista para recibir trabajos'
      });

      // Clear the signup flag
      localStorage.removeItem('new_provider_signup');

      // Navigate to provider portal
      setTimeout(() => {
        navigate(ROUTES.PROVIDER_PORTAL);
      }, 1500);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast.error('Error al guardar', {
        description: 'No se pudo completar el perfil. Intenta de nuevo.'
      });
    } finally {
      setSaving(false);
    }
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 2:
        // Auth step
        if (!user) {
          if (authMode === 'signup') {
            return signupData.fullName.trim().length > 0 &&
                   signupData.email.trim().length > 0 &&
                   signupData.phone.trim().length > 0 &&
                   signupData.password.length >= 8 &&
                   signupData.password === signupData.confirmPassword;
          } else {
            return loginData.email.trim().length > 0 &&
                   loginData.password.length > 0;
          }
        }
        return true;
      case 3:
        return profileData.displayName.trim().length > 0;
      case 4:
        return selectedSkills.length > 0;
      case 5:
        return workZone.trim().length > 0;
      default:
        return true;
    }
  };

  // Google icon SVG
  const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-2 sm:p-4 overflow-hidden relative">
      {/* Decorative elements - hidden on mobile for performance */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none hidden sm:block" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse hidden sm:block" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000 hidden sm:block" />

      <Card className="w-full max-w-2xl shadow-floating relative z-10 overflow-hidden border-2 mx-2 sm:mx-0">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 sm:h-2 bg-muted">
          <div 
            className="h-full bg-gradient-button transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Indicators - Compact on mobile */}
        <div className="flex justify-between items-center px-3 sm:px-8 pt-6 sm:pt-8 pb-2 sm:pb-4 overflow-x-auto">
          {STEP_CONFIG.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-1 sm:gap-2 flex-1 min-w-0">
                <div className={cn(
                  "w-9 h-9 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive && "bg-primary text-primary-foreground shadow-glow scale-105 sm:scale-110",
                  isCompleted && "bg-success text-success-foreground",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                </div>
                <span className={cn(
                  "text-[10px] sm:text-xs font-medium text-center transition-colors hidden sm:block truncate w-full px-1",
                  isActive && "text-primary",
                  isCompleted && "text-success",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step Content - Better mobile padding */}
        <div className="px-4 sm:px-8 py-4 sm:py-6 min-h-[350px] sm:min-h-[400px]">
          <div className={cn(
            "animate-fade-in",
            slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left'
          )}>
            {/* Step 1: Welcome */}
            {currentStep === 1 && (
              <div className="text-center space-y-6 py-8">
                <div className="flex justify-center mb-6">
                  <img 
                    src={authSecurityImage} 
                    alt="Seguridad" 
                    className="w-48 h-48 object-contain"
                  />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-hero bg-clip-text text-transparent">
                  ¡Bienvenido a Chamby!
                </h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Estás a unos pasos de comenzar a recibir trabajos. Vamos a configurar tu perfil profesional.
                </p>
                <div className="flex justify-center pt-6">
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={goToNext}
                    className="group px-8 border-2 border-primary bg-white hover:bg-primary hover:text-white transition-all"
                  >
                    Siguiente
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Auth (Signup or Login) */}
            {currentStep === 2 && !user && (
              <div className="space-y-4 sm:space-y-6">
                <div className="text-center mb-4 sm:mb-6">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-1 sm:mb-2">
                    {authMode === 'signup' ? 'Crear Cuenta' : 'Iniciar Sesión'}
                  </h2>
                  <p className="text-sm sm:text-base text-muted-foreground">
                    {authMode === 'signup' 
                      ? 'Empecemos creando tu cuenta de Chambynauta' 
                      : 'Bienvenido de vuelta, ingresa tus datos'}
                  </p>
                </div>

                {/* Google Sign-in Button */}
                <Button
                  variant="outline"
                  className="w-full py-5 sm:py-6 text-sm sm:text-base border-2 hover:bg-muted/50"
                  onClick={handleGoogleLogin}
                  disabled={saving}
                >
                  <GoogleIcon />
                  Continuar con Google
                </Button>

                <div className="relative">
                  <Separator />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-3 sm:px-4 text-xs sm:text-sm text-muted-foreground">
                    o con email
                  </span>
                </div>

                {/* Auth Mode Toggle */}
                <div className="flex rounded-lg border-2 p-1 bg-muted/30">
                  <button
                    className={cn(
                      "flex-1 py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-all",
                      authMode === 'signup' 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setAuthMode('signup')}
                  >
                    Registrarse
                  </button>
                  <button
                    className={cn(
                      "flex-1 py-2 px-3 sm:px-4 rounded-md text-sm font-medium transition-all",
                      authMode === 'login' 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setAuthMode('login')}
                  >
                    Iniciar Sesión
                  </button>
                </div>
                
                {/* Signup Form */}
                {authMode === 'signup' && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="fullName" className={cn("text-sm", signupErrors.fullName && 'text-destructive')}>
                        Nombre Completo *
                      </Label>
                      <Input
                        id="fullName"
                        placeholder="Ej: Juan Pérez"
                        value={signupData.fullName}
                        onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                        className={cn("h-11", signupErrors.fullName && 'border-destructive')}
                      />
                      {signupErrors.fullName && (
                        <p className="text-destructive text-xs sm:text-sm">{signupErrors.fullName}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className={cn("text-sm", signupErrors.email && 'text-destructive')}>
                        Email *
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="tu@email.com"
                          value={signupData.email}
                          onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                          className={cn("pl-9 sm:pl-10 h-11", signupErrors.email && 'border-destructive')}
                        />
                      </div>
                      {signupErrors.email && (
                        <p className="text-destructive text-xs sm:text-sm">{signupErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className={cn("text-sm", signupErrors.phone && 'text-destructive')}>
                        Teléfono *
                      </Label>
                      <PhoneInput
                        id="phone"
                        value={signupData.phone}
                        onChange={(value) => setSignupData({ ...signupData, phone: value })}
                        error={!!signupErrors.phone}
                      />
                      {signupErrors.phone && (
                        <p className="text-destructive text-xs sm:text-sm">{signupErrors.phone}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className={signupErrors.password ? 'text-destructive' : ''}>
                        Contraseña *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Crea una contraseña segura"
                          value={signupData.password}
                          onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                          className={cn("pl-9 sm:pl-10 pr-10 h-11", signupErrors.password && 'border-destructive')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <PasswordStrengthBar password={signupData.password} />
                      {signupErrors.password && (
                        <p className="text-destructive text-sm">{signupErrors.password}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="confirmPassword" className={cn("text-sm", signupErrors.confirmPassword && 'text-destructive')}>
                        Confirmar Contraseña *
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          placeholder="Repite tu contraseña"
                          value={signupData.confirmPassword}
                          onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                          className={cn("pl-9 sm:pl-10 pr-10 h-11", signupErrors.confirmPassword && 'border-destructive')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {signupErrors.confirmPassword && (
                        <p className="text-destructive text-xs sm:text-sm">{signupErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Login Form */}
                {authMode === 'login' && (
                  <div className="space-y-3 sm:space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="loginEmail" className={cn("text-sm", loginErrors.email && 'text-destructive')}>
                        Email
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <Input
                          id="loginEmail"
                          type="email"
                          placeholder="tu@email.com"
                          value={loginData.email}
                          onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                          className={cn("pl-9 sm:pl-10 h-11", loginErrors.email && 'border-destructive')}
                        />
                      </div>
                      {loginErrors.email && (
                        <p className="text-destructive text-xs sm:text-sm">{loginErrors.email}</p>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="loginPassword" className={cn("text-sm", loginErrors.password && 'text-destructive')}>
                        Contraseña
                      </Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground" />
                        <Input
                          id="loginPassword"
                          type={showPassword ? "text" : "password"}
                          placeholder="Tu contraseña"
                          value={loginData.password}
                          onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                          className={cn("pl-9 sm:pl-10 pr-10 h-11", loginErrors.password && 'border-destructive')}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {loginErrors.password && (
                        <p className="text-destructive text-xs sm:text-sm">{loginErrors.password}</p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(loginData.email);
                        setShowResetPassword(true);
                      }}
                      className="text-sm text-primary hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                )}

                {/* Link to user auth */}
                <p className="text-center text-xs sm:text-sm text-muted-foreground pt-2">
                  ¿Buscas servicios?{' '}
                  <button
                    type="button"
                    onClick={() => navigate(ROUTES.USER_AUTH)}
                    className="text-primary hover:underline font-medium"
                  >
                    Regístrate como cliente
                  </button>
                </p>
              </div>
            )}

            {/* Step 3: Basic Profile */}
            {currentStep === 3 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Perfil Básico</h2>
                  <p className="text-muted-foreground">Cuéntanos un poco sobre ti</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Nombre para mostrar *</Label>
                    <Input
                      id="displayName"
                      placeholder="Ej: Juan Pérez"
                      value={profileData.displayName}
                      onChange={(e) => setProfileData({ ...profileData, displayName: e.target.value })}
                      className="text-base"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bio">Descripción breve (opcional)</Label>
                    <Textarea
                      id="bio"
                      placeholder="Ej: Electricista con 10 años de experiencia..."
                      value={profileData.bio}
                      onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                      className="text-base resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Skills Selection */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Tus Habilidades</h2>
                  <p className="text-muted-foreground">Selecciona los servicios que ofreces *</p>
                </div>

                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    {SUGGESTED_SKILLS.map((skill) => (
                      <Badge
                        key={skill}
                        variant={selectedSkills.includes(skill) ? "default" : "outline"}
                        className={cn(
                          "cursor-pointer px-4 py-2 text-sm transition-all duration-200",
                          selectedSkills.includes(skill) 
                            ? "bg-primary text-primary-foreground shadow-soft hover:shadow-raised scale-105" 
                            : "hover:bg-accent hover:border-primary"
                        )}
                        onClick={() => toggleSkill(skill)}
                      >
                        {skill}
                        {selectedSkills.includes(skill) && (
                          <CheckCircle2 className="w-3 h-3 ml-2" />
                        )}
                      </Badge>
                    ))}
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-sm text-muted-foreground mb-2 block">
                      ¿Ofreces algo más?
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Escribe una habilidad personalizada"
                        value={customSkill}
                        onChange={(e) => setCustomSkill(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addCustomSkill())}
                        className="text-base"
                      />
                      <Button 
                        type="button" 
                        onClick={addCustomSkill}
                        disabled={!customSkill.trim()}
                        size="icon"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {selectedSkills.length > 0 && (
                    <div className="pt-4 border-t">
                      <Label className="text-sm text-muted-foreground mb-2 block">
                        Seleccionadas ({selectedSkills.length})
                      </Label>
                      <div className="flex flex-wrap gap-2">
                        {selectedSkills.map((skill) => (
                          <Badge
                            key={skill}
                            className="bg-success text-success-foreground px-3 py-1.5 flex items-center gap-2"
                          >
                            {skill}
                            <X 
                              className="w-3 h-3 cursor-pointer hover:text-destructive" 
                              onClick={() => removeSkill(skill)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Step 5: Work Zone */}
            {currentStep === 5 && (
              <div className="space-y-6">
                <div className="text-center mb-6">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Zona de Trabajo</h2>
                  <p className="text-muted-foreground">Define el área donde ofreces tus servicios</p>
                </div>

                <WorkZonePicker
                  onZoneChange={handleWorkZoneChange}
                  initialLat={workZoneCoords?.lat}
                  initialLng={workZoneCoords?.lng}
                  initialRadius={workZoneRadius * 1000}
                />
              </div>
            )}

            {/* Step 6: Availability */}
            {currentStep === 6 && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Disponibilidad</h2>
                  <p className="text-muted-foreground">¿Cuándo puedes trabajar?</p>
                </div>

                <div className="space-y-3">
                  <div 
                    className={cn(
                      "border-2 rounded-lg p-4 cursor-pointer transition-all",
                      availability === 'weekdays-9-5' 
                        ? "border-primary bg-primary/5 shadow-soft" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setAvailability('weekdays-9-5')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        availability === 'weekdays-9-5' ? "border-primary" : "border-muted-foreground"
                      )}>
                        {availability === 'weekdays-9-5' && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Lunes a Viernes, 9:00 - 17:00</p>
                        <p className="text-sm text-muted-foreground">Horario de oficina</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={cn(
                      "border-2 rounded-lg p-4 cursor-pointer transition-all",
                      availability === 'flexible' 
                        ? "border-primary bg-primary/5 shadow-soft" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setAvailability('flexible')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        availability === 'flexible' ? "border-primary" : "border-muted-foreground"
                      )}>
                        {availability === 'flexible' && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Flexible</p>
                        <p className="text-sm text-muted-foreground">Disponible cualquier día y horario</p>
                      </div>
                    </div>
                  </div>

                  <div 
                    className={cn(
                      "border-2 rounded-lg p-4 cursor-pointer transition-all",
                      availability === 'weekends' 
                        ? "border-primary bg-primary/5 shadow-soft" 
                        : "border-border hover:border-primary/50"
                    )}
                    onClick={() => setAvailability('weekends')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                        availability === 'weekends' ? "border-primary" : "border-muted-foreground"
                      )}>
                        {availability === 'weekends' && (
                          <div className="w-3 h-3 rounded-full bg-primary" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold">Solo fines de semana</p>
                        <p className="text-sm text-muted-foreground">Sábados y domingos</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center pt-2">
                  Podrás modificar tu disponibilidad más adelante desde tu perfil
                </p>
              </div>
            )}

            {/* Step 7: Completion */}
            {currentStep === 7 && (
              <div className="text-center space-y-4 sm:space-y-6 py-4 sm:py-8">
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-success to-success/70 animate-bounce-subtle">
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12 text-success-foreground" />
                </div>
                <h1 className="text-2xl sm:text-4xl font-bold text-foreground">
                  ¡Todo Listo!
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg max-w-md mx-auto px-2">
                  Tu perfil está completo. Ya puedes comenzar a recibir solicitudes de trabajo.
                </p>
                
                <div className="bg-accent/20 rounded-lg p-4 sm:p-6 border border-accent max-w-md mx-auto text-left">
                  <h3 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Resumen de tu perfil:</h3>
                  <ul className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li>✓ Nombre: {profileData.displayName}</li>
                    <li>✓ Habilidades: {selectedSkills.length} seleccionadas</li>
                    <li>✓ Zona: {workZone}</li>
                    <li>✓ Disponibilidad configurada</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Buttons - Mobile optimized */}
        <div className={cn(
          "px-4 sm:px-8 py-4 sm:py-6 border-t bg-muted/30 justify-between items-center gap-2",
          currentStep === 1 ? "hidden sm:flex" : "flex"
        )}>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPrevious}
            disabled={currentStep === 1 || saving}
            className={cn(
              "transition-opacity text-sm px-3 sm:px-4",
              currentStep === 1 && "opacity-0 pointer-events-none"
            )}
          >
            Atrás
          </Button>

          <div className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
            Paso {currentStep} de {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <Button
              size="sm"
              onClick={() => {
                // If on auth step and not authenticated
                if (currentStep === 2 && !user) {
                  if (authMode === 'signup') {
                    handleSignup();
                  } else {
                    handleLogin();
                  }
                } else {
                  goToNext();
                }
              }}
              disabled={!canGoNext() || saving}
              className="group text-sm px-3 sm:px-4"
            >
              {saving ? 'Procesando...' : currentStep === 2 && !user 
                ? (authMode === 'signup' ? 'Crear Cuenta' : 'Iniciar Sesión')
                : 'Siguiente'}
              {currentStep === 2 && authMode === 'login' && !user ? (
                <LogIn className="w-4 h-4 ml-2" />
              ) : (
                <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
              )}
            </Button>
          ) : (
            <Button
              onClick={handleFinish}
              disabled={saving}
              className="bg-success hover:bg-success/90"
            >
              {saving ? 'Guardando...' : 'Ir al Portal'}
            </Button>
          )}
        </div>
      </Card>

      {/* Email Verification Modal */}
      <Dialog open={showEmailVerification} onOpenChange={setShowEmailVerification}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Verifica tu correo
            </DialogTitle>
            <DialogDescription className="space-y-3 pt-2">
              <p>
                Hemos enviado un correo de verificación a:
              </p>
              <p className="font-semibold text-foreground">{verificationEmail}</p>
              <p>
                Por favor revisa tu bandeja de entrada y haz clic en el enlace de verificación para activar tu cuenta.
              </p>
              <div className="bg-accent/20 border border-accent rounded-lg p-3 text-sm">
                <p className="font-medium text-foreground mb-1">💡 Consejo:</p>
                <p>Si no ves el correo, revisa tu carpeta de spam o correo no deseado.</p>
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setShowEmailVerification(false);
                setShowVerificationPending(true);
              }}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verification Pending Full Screen */}
      {showVerificationPending && (
        <div className="fixed inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-floating border-2">
            <div className="p-8 text-center space-y-6">
              <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Mail className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">Revisa tu correo 📧</h2>
                <p className="text-muted-foreground">
                  Te enviamos un enlace de verificación a{' '}
                  <span className="font-semibold text-foreground">{verificationEmail}</span>
                </p>
              </div>
              <p className="text-sm text-muted-foreground">
                Haz clic en el enlace del correo o ingresa el código de verificación abajo.
              </p>
              
              {/* Manual Code Verification */}
              <div className="space-y-3 pt-2 border-t border-border">
                <p className="text-sm font-medium text-foreground pt-3">O ingresa el código del correo:</p>
                <Input
                  placeholder="Código de verificación"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  className="text-center text-lg tracking-widest font-mono"
                  maxLength={6}
                />
                <Button
                  onClick={handleVerifyWithCode}
                  className="w-full"
                  disabled={verifyingCode || !verificationCode.trim()}
                >
                  {verifyingCode ? 'Verificando...' : 'Verificar con código'}
                </Button>
              </div>

              <div className="space-y-3 pt-2">
                <Button
                  onClick={() => handleResendVerification(verificationEmail)}
                  variant="outline"
                  className="w-full"
                  disabled={saving}
                >
                  Reenviar correo de verificación
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowVerificationPending(false);
                    setAuthMode('login');
                    setLoginData({ email: verificationEmail, password: '' });
                  }}
                  className="w-full"
                >
                  Ya verifiqué, ir a iniciar sesión
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Password Reset Modal */}
      <Dialog open={showResetPassword} onOpenChange={(open) => {
        setShowResetPassword(open);
        if (!open) setResetSent(false);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restablecer contraseña</DialogTitle>
            <DialogDescription>
              {resetSent 
                ? 'Te hemos enviado un correo con instrucciones para restablecer tu contraseña.'
                : 'Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.'}
            </DialogDescription>
          </DialogHeader>
          {!resetSent ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="resetEmail">Email</Label>
                <Input
                  id="resetEmail"
                  type="email"
                  placeholder="tu@email.com"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowResetPassword(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleResetPassword} disabled={saving}>
                  {saving ? 'Enviando...' : 'Enviar enlace'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-end">
              <Button onClick={() => setShowResetPassword(false)}>
                Entendido
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
