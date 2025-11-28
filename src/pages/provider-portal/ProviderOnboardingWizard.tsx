import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  EyeOff
} from 'lucide-react';
import authSecurityImage from '@/assets/auth-security.png';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const signupSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
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

const SUGGESTED_SKILLS = [
  'Plomería', 'Electricidad', 'Carpintería', 'Pintura', 
  'Jardinería', 'Limpieza', 'Reparaciones', 'Instalaciones',
  'Mantenimiento', 'Albañilería', 'Herrería', 'Vidriería'
];

const STEP_CONFIG = [
  { id: 1, icon: Sparkles, title: '¡Bienvenido!' },
  { id: 2, icon: Mail, title: 'Crear Cuenta' },
  { id: 3, icon: User, title: 'Perfil' },
  { id: 4, icon: Wrench, title: 'Habilidades' },
  { id: 5, icon: MapPin, title: 'Zona de Trabajo' },
  { id: 6, icon: Calendar, title: 'Disponibilidad' },
  { id: 7, icon: CheckCircle2, title: '¡Listo!' }
];

export default function ProviderOnboardingWizard() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('right');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Signup data
  const [signupData, setSignupData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [signupErrors, setSignupErrors] = useState<Record<string, string>>({});

  // Profile data
  const [profileData, setProfileData] = useState({
    displayName: '',
    phone: '',
    bio: ''
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [workZone, setWorkZone] = useState('');
  const [availability, setAvailability] = useState('weekdays-9-5');

  useEffect(() => {
    // If user is already logged in, skip signup step
    if (user) {
      setCurrentStep(3); // Skip to profile step
      
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
  const [verificationEmail, setVerificationEmail] = useState('');

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
    const { error } = await signUp(
      signupData.email,
      signupData.password,
      signupData.fullName,
      signupData.phone,
      true, // is a provider
      'provider' // role
    );

    if (error) {
      let errorMessage = error.message;
      if (error.message.includes('already registered') || error.message.includes('already exists')) {
        errorMessage = 'Este email ya está registrado.';
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
      // Update provider profile
      const { error: providerError } = await supabase
        .from('providers')
        .update({
          display_name: profileData.displayName,
          skills: selectedSkills,
          zone_served: workZone,
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
        // Signup step - check if form is valid
        if (!user) {
          return signupData.fullName.trim().length > 0 &&
                 signupData.email.trim().length > 0 &&
                 signupData.phone.trim().length > 0 &&
                 signupData.password.length >= 8 &&
                 signupData.password === signupData.confirmPassword;
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 flex items-center justify-center p-4 overflow-hidden relative">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-gradient-mesh opacity-30 pointer-events-none" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      <Card className="w-full max-w-2xl shadow-floating relative z-10 overflow-hidden border-2">
        {/* Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-muted">
          <div 
            className="h-full bg-gradient-button transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step Indicators */}
        <div className="flex justify-between items-center px-8 pt-8 pb-4">
          {STEP_CONFIG.map((step) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center gap-2 flex-1">
                <div className={cn(
                  "w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300",
                  isActive && "bg-primary text-primary-foreground shadow-glow scale-110",
                  isCompleted && "bg-success text-success-foreground",
                  !isActive && !isCompleted && "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={cn(
                  "text-xs font-medium text-center transition-colors hidden sm:block",
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

        {/* Step Content */}
        <div className="px-8 py-6 min-h-[400px]">
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
                    onClick={goToNext}
                    className="group px-8"
                  >
                    Siguiente
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Signup (only if not authenticated) */}
            {currentStep === 2 && !user && (
              <div className="space-y-6">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Crear Cuenta</h2>
                  <p className="text-muted-foreground">Empecemos creando tu cuenta de Chambynauta</p>
                </div>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="fullName" className={signupErrors.fullName ? 'text-destructive' : ''}>
                      Nombre Completo *
                    </Label>
                    <Input
                      id="fullName"
                      placeholder="Ej: Juan Pérez"
                      value={signupData.fullName}
                      onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                      className={signupErrors.fullName ? 'border-destructive' : ''}
                    />
                    {signupErrors.fullName && (
                      <p className="text-destructive text-sm">{signupErrors.fullName}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email" className={signupErrors.email ? 'text-destructive' : ''}>
                      Email *
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        value={signupData.email}
                        onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                        className={cn("pl-10", signupErrors.email && 'border-destructive')}
                      />
                    </div>
                    {signupErrors.email && (
                      <p className="text-destructive text-sm">{signupErrors.email}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone" className={signupErrors.phone ? 'text-destructive' : ''}>
                      Teléfono *
                    </Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        placeholder="+52 1 234 567 8900"
                        value={signupData.phone}
                        onChange={(e) => setSignupData({ ...signupData, phone: e.target.value })}
                        className={cn("pl-10", signupErrors.phone && 'border-destructive')}
                      />
                    </div>
                    {signupErrors.phone && (
                      <p className="text-destructive text-sm">{signupErrors.phone}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className={signupErrors.password ? 'text-destructive' : ''}>
                      Contraseña *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        value={signupData.password}
                        onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                        className={cn("pl-10 pr-10", signupErrors.password && 'border-destructive')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signupErrors.password && (
                      <p className="text-destructive text-sm">{signupErrors.password}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className={signupErrors.confirmPassword ? 'text-destructive' : ''}>
                      Confirmar Contraseña *
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Repite tu contraseña"
                        value={signupData.confirmPassword}
                        onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                        className={cn("pl-10 pr-10", signupErrors.confirmPassword && 'border-destructive')}
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
                      <p className="text-destructive text-sm">{signupErrors.confirmPassword}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Basic Profile (was Step 2) */}
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
                    <Label htmlFor="phone">Teléfono</Label>
                    <Input
                      id="phone"
                      placeholder="Ej: +52 1 234 567 8900"
                      value={profileData.phone}
                      onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
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
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-foreground mb-2">Zona de Trabajo</h2>
                  <p className="text-muted-foreground">¿Dónde ofreces tus servicios? *</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="workZone">Ciudad o zona</Label>
                    <Input
                      id="workZone"
                      placeholder="Ej: Guadalajara, Zapopan, Tlaquepaque..."
                      value={workZone}
                      onChange={(e) => setWorkZone(e.target.value)}
                      className="text-base"
                    />
                    <p className="text-xs text-muted-foreground">
                      Puedes especificar varias zonas separadas por comas
                    </p>
                  </div>

                  <div className="bg-accent/20 rounded-lg p-4 border border-accent">
                    <p className="text-sm text-muted-foreground">
                      💡 <strong>Consejo:</strong> Mientras más amplia sea tu zona de trabajo, más oportunidades tendrás de recibir solicitudes.
                    </p>
                  </div>
                </div>
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
              <div className="text-center space-y-6 py-8">
                <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-success to-success/70 animate-bounce-subtle">
                  <CheckCircle2 className="w-12 h-12 text-success-foreground" />
                </div>
                <h1 className="text-4xl font-bold text-foreground">
                  ¡Todo Listo!
                </h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Tu perfil está completo. Ya puedes comenzar a recibir solicitudes de trabajo.
                </p>
                
                <div className="bg-accent/20 rounded-lg p-6 border border-accent max-w-md mx-auto text-left">
                  <h3 className="font-semibold mb-3">Resumen de tu perfil:</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
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

        {/* Navigation Buttons */}
        <div className="px-8 py-6 border-t bg-muted/30 flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={goToPrevious}
            disabled={currentStep === 1 || saving}
            className={cn(
              "transition-opacity",
              currentStep === 1 && "opacity-0 pointer-events-none"
            )}
          >
            Atrás
          </Button>

          <div className="text-sm text-muted-foreground">
            Paso {currentStep} de {totalSteps}
          </div>

          {currentStep < totalSteps ? (
            <Button
              onClick={() => {
                // If on signup step and not authenticated, handle signup
                if (currentStep === 2 && !user) {
                  handleSignup();
                } else {
                  goToNext();
                }
              }}
              disabled={!canGoNext() || saving}
              className="group"
            >
              {saving ? 'Creando cuenta...' : currentStep === 2 && !user ? 'Crear Cuenta' : 'Siguiente'}
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
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
                navigate(ROUTES.PROVIDER_AUTH + '?tab=login');
              }}
            >
              Entendido
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
