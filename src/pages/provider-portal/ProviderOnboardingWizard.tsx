import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { 
  Sparkles, 
  User, 
  Wrench, 
  MapPin, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  LogIn,
  Zap,
  Droplets,
  Hammer,
  Paintbrush,
  Leaf,
  Sparkle,
  Settings,
  Home,
  Wrench as WrenchIcon,
  Square,
  Scissors,
  GlassWater,
  FileCheck
} from 'lucide-react';
import chambyLogo from '@/assets/chamby-logo-new.png';
import providerCharacter from '@/assets/walking-provider.png';

// Preload images immediately
const preloadLogo = new window.Image();
preloadLogo.src = chambyLogo;
const preloadCharacter = new window.Image();
preloadCharacter.src = providerCharacter;
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/constants/routes';
import { z } from 'zod';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

import { PhoneInput } from '@/components/ui/phone-input';
import { isValidMexicanPhone, formatPhoneForStorage } from '@/utils/phoneValidation';
import { WorkZonePicker } from '@/components/WorkZonePicker';
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar';
import { DocumentsStep } from '@/components/provider-portal/DocumentsStep';
import { useFormPersistence } from '@/hooks/useFormPersistence';

const FORM_STORAGE_KEY = 'provider_onboarding';

const signupSchema = z.object({
  fullName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  phone: z.string()
    .refine(val => isValidMexicanPhone(val), {
      message: 'El teléfono debe tener exactamente 10 dígitos'
    }),
  password: z.string()
    .min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Las contraseñas no coinciden",
  path: ["confirmPassword"]
});

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'La contraseña es requerida')
});

// Skills with icons and colors for visual grid
const SKILL_OPTIONS = [
  { name: 'Plomería', icon: Droplets, bgColor: 'bg-blue-100', iconColor: 'text-blue-600' },
  { name: 'Electricidad', icon: Zap, bgColor: 'bg-yellow-100', iconColor: 'text-yellow-600' },
  { name: 'Carpintería', icon: Hammer, bgColor: 'bg-amber-100', iconColor: 'text-amber-700' },
  { name: 'Pintura', icon: Paintbrush, bgColor: 'bg-pink-100', iconColor: 'text-pink-600' },
  { name: 'Jardinería', icon: Leaf, bgColor: 'bg-green-100', iconColor: 'text-green-600' },
  { name: 'Limpieza', icon: Sparkle, bgColor: 'bg-purple-100', iconColor: 'text-purple-600' },
  { name: 'Reparaciones', icon: Settings, bgColor: 'bg-gray-100', iconColor: 'text-gray-600' },
  { name: 'Instalaciones', icon: Home, bgColor: 'bg-indigo-100', iconColor: 'text-indigo-600' },
  { name: 'Mantenimiento', icon: WrenchIcon, bgColor: 'bg-orange-100', iconColor: 'text-orange-600' },
  { name: 'Albañilería', icon: Square, bgColor: 'bg-stone-200', iconColor: 'text-stone-700' },
  { name: 'Herrería', icon: Scissors, bgColor: 'bg-slate-200', iconColor: 'text-slate-700' },
  { name: 'Vidriería', icon: GlassWater, bgColor: 'bg-cyan-100', iconColor: 'text-cyan-600' },
];

// Step labels for progress track (mobile-optimized)
const PROGRESS_STEPS = [
  { id: 2, label: 'CUENTA' },
  { id: 3, label: 'PERFIL' },
  { id: 4, label: 'HABILIDADES' },
  { id: 5, label: 'ZONA' },
  { id: 6, label: 'DOCS' },
];

export default function ProviderOnboardingWizard() {
  const { user, signUp, signIn, signInWithGoogle, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [currentStep, setCurrentStep] = useState(2);
  const [slideDirection, setSlideDirection] = useState<'forward' | 'backward'>('forward');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const hasRestoredForm = useRef(false);
  const hasCheckedOnboarding = useRef(false); // Track if we've already checked onboarding status

  // Form persistence
  const { saveFormData, loadFormData, clearFormData } = useFormPersistence(FORM_STORAGE_KEY);

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
    bio: '',
    avatarUrl: ''
  });
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [workZone, setWorkZone] = useState('');
  const [workZoneCoords, setWorkZoneCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [workZoneRadius, setWorkZoneRadius] = useState(5);
  const [availability, setAvailability] = useState('weekdays-9-5');

  // Note: useBlocker removed as it requires data router (createBrowserRouter)
  // Form persistence with auto-save handles progress preservation instead

  // Restore form data on mount (once)
  useEffect(() => {
    if (hasRestoredForm.current) return;
    hasRestoredForm.current = true;
    
    const savedData = loadFormData();
    if (savedData) {
      if (savedData.currentStep && savedData.currentStep > 2) {
        setCurrentStep(savedData.currentStep);
      }
      if (savedData.profileData) setProfileData(savedData.profileData);
      if (savedData.selectedSkills) setSelectedSkills(savedData.selectedSkills);
      if (savedData.workZone) setWorkZone(savedData.workZone);
      if (savedData.workZoneCoords) setWorkZoneCoords(savedData.workZoneCoords);
      if (savedData.workZoneRadius) setWorkZoneRadius(savedData.workZoneRadius);
      if (savedData.availability) setAvailability(savedData.availability);
    }
  }, [loadFormData]);

  // Auto-save form data on step change
  useEffect(() => {
    if (currentStep > 2) {
      saveFormData({
        currentStep,
        profileData,
        selectedSkills,
        workZone,
        workZoneCoords,
        workZoneRadius,
        availability,
      });
    }
  }, [currentStep, profileData, selectedSkills, workZone, workZoneCoords, workZoneRadius, availability, saveFormData]);

  const handleWorkZoneChange = useCallback((lat: number, lng: number, radiusKm: number, zoneName: string) => {
    setWorkZoneCoords({ lat, lng });
    setWorkZoneRadius(radiusKm);
    setWorkZone(zoneName);
  }, []);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'login') {
      setAuthMode('login');
      if (!user) {
        setCurrentStep(2);
      }
    } else if (tab === 'signup') {
      setAuthMode('signup');
    }
  }, [searchParams, user]);

  // Track if user has completed onboarding
  const [hasProviderRole, setHasProviderRole] = useState(false);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  // Reset onboarding check when user changes (new session after email verification)
  const lastCheckedUserId = useRef<string | null>(null);
  
  useEffect(() => {
    if (user && lastCheckedUserId.current !== user.id) {
      hasCheckedOnboarding.current = false;
      lastCheckedUserId.current = user.id;
    }
  }, [user]);

  // Map step numbers to DB step names
  const STEP_NAME_MAP: Record<number, string> = {
    2: 'auth', 3: 'profile', 4: 'skills', 5: 'zone', 6: 'documents', 7: 'review', 8: 'complete'
  };
  const STEP_NUMBER_MAP: Record<string, number> = {
    'auth': 2, 'profile': 3, 'skills': 4, 'zone': 5, 'documents': 6, 'review': 7, 'complete': 8, 'completed': 8
  };

  // Debug state for dev mode
  const [debugInfo, setDebugInfo] = useState<{ userId?: string; onboardingComplete?: boolean; dbStep?: string | null }>({});

  useEffect(() => {
    if (user) {
      if (hasCheckedOnboarding.current && currentStep !== 2) {
        return;
      }
      
      const checkOnboardingStatus = async () => {
        setCheckingStatus(true);
        
        const { data: roles } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id);
        
        const isProvider = roles?.some(r => r.role === 'provider');
        const isAdmin = roles?.some(r => r.role === 'admin');
        setHasProviderRole(isProvider || isAdmin);
        
        // Read onboarding state from DB (single source of truth)
        const { data: providerData } = await supabase
          .from('providers')
          .select('skills, zone_served, display_name, avatar_url, onboarding_complete, onboarding_step')
          .eq('user_id', user.id)
          .maybeSingle();
        
        const dbComplete = providerData?.onboarding_complete === true;
        const dbStep = providerData?.onboarding_step;
        
        console.log('[Onboarding] DB check:', { userId: user.id, dbComplete, dbStep, isProvider, skills: providerData?.skills?.length });
        setDebugInfo({ userId: user.id, onboardingComplete: dbComplete, dbStep });
        setOnboardingComplete(dbComplete);
        
        // If DB says complete, redirect immediately
        if (dbComplete && (isProvider || isAdmin)) {
          console.log('[Onboarding] onboarding_complete=true, redirecting to portal');
          navigate(ROUTES.PROVIDER_PORTAL, { replace: true });
          setCheckingStatus(false);
          return;
        }
        
        hasCheckedOnboarding.current = true;
        
        // Resume from saved DB step (if past auth)
        const resumeStep = dbStep ? (STEP_NUMBER_MAP[dbStep] || 3) : 3;
        if (currentStep <= 2) {
          const targetStep = Math.max(3, resumeStep);
          console.log('[Onboarding] Resuming from step:', targetStep, '(db:', dbStep, ')');
          setCurrentStep(targetStep);
        }
        
        const { data: userData } = await supabase
          .from('users')
          .select('full_name, phone')
          .eq('id', user.id)
          .single();

        if (userData) {
          setProfileData(prev => ({
            ...prev,
            displayName: userData.full_name || '',
            phone: userData.phone || '',
          }));
          setSignupData(prev => ({
            ...prev,
            fullName: userData.full_name || '',
            phone: userData.phone || ''
          }));
        }
        
        // Pre-populate existing provider data
        if (providerData) {
          if (providerData.skills) setSelectedSkills(providerData.skills);
          if (providerData.zone_served) setWorkZone(providerData.zone_served);
          if (providerData.display_name) {
            setProfileData(prev => ({
              ...prev,
              displayName: providerData.display_name || prev.displayName
            }));
          }
          if (providerData.avatar_url) {
            setProfileData(prev => ({ ...prev, avatarUrl: providerData.avatar_url || '' }));
          }
        }
        
        setCheckingStatus(false);
      };

      checkOnboardingStatus();
    }
  }, [user, authMode, navigate]);

  const totalSteps = 8;
  const progress = Math.max(0, ((currentStep - 1) / (totalSteps - 2)) * 100);

  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [showVerificationPending, setShowVerificationPending] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

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
    const { error, data } = await signUp(
      signupData.email,
      signupData.password,
      signupData.fullName,
      formattedPhone,
      true,
      'provider'
    );

    if (error) {
      const errMsg = error.message || '';
      const errStatus = (error as any).status || (error as any).statusCode;
      console.log('[Onboarding Signup] Auth error:', { message: errMsg, status: errStatus, code: (error as any).code });

      let errorMessage = errMsg;
      let errorField = 'email';
      
      // Only treat as "already exists" for very specific Supabase error strings
      const isAlreadyRegistered = 
        errMsg.includes('User already registered') ||
        errMsg.includes('already registered') ||
        (errMsg.includes('duplicate key') && errMsg.includes('auth'));

      if (errMsg.toLowerCase().includes('weak') || errMsg.toLowerCase().includes('password') || errMsg.toLowerCase().includes('easy to guess')) {
        console.log('[Onboarding Signup] Branch: weak password');
        errorMessage = 'Elige una contraseña más única. Prueba añadir números, mayúsculas o símbolos.';
        errorField = 'password';
      } else if (isAlreadyRegistered) {
        console.log('[Onboarding Signup] Branch: already registered (explicit error)');
        errorMessage = 'Este correo ya tiene cuenta.';
        errorField = 'email';
        toast.error('Este correo ya está registrado', {
          description: 'Puedes iniciar sesión o reenviar el código de verificación.',
          duration: 8000,
          action: {
            label: 'Iniciar sesión',
            onClick: () => {
              setAuthMode('login');
              setLoginData({ email: signupData.email, password: '' });
            }
          }
        });
        setSignupErrors({ [errorField]: errorMessage });
        setSaving(false);
        return;
      } else {
        console.log('[Onboarding Signup] Branch: generic error');
      }
      
      toast.error('Error en el registro', { description: errorMessage });
      setSignupErrors({ [errorField]: errorMessage });
      setSaving(false);
      return;
    }

    // Log signup response for debugging
    const identities = data?.user?.identities;
    const userConfirmedAt = data?.user?.confirmed_at;
    const userCreatedAt = data?.user?.created_at;
    console.log('[Onboarding Signup] Success response:', {
      hasUser: !!data?.user,
      identitiesCount: identities?.length,
      confirmedAt: userConfirmedAt,
      createdAt: userCreatedAt,
      hasSession: !!data?.session,
    });

    // Detect TRULY already-confirmed users:
    // Empty identities AND user has confirmed_at set = genuine existing confirmed account
    // Empty identities WITHOUT confirmed_at = repeated signup of unconfirmed user (allow to proceed)
    if (identities?.length === 0 && userConfirmedAt) {
      console.log('[Onboarding Signup] Branch: already confirmed account (identities=0, confirmed_at set)');
      toast.error('Este correo ya tiene cuenta verificada', {
        description: 'Inicia sesión con tu contraseña.',
        duration: 8000,
        action: {
          label: 'Iniciar sesión',
          onClick: () => {
            setAuthMode('login');
            setLoginData({ email: signupData.email, password: '' });
          }
        }
      });
      setSaving(false);
      return;
    }

    // If identities is empty but not confirmed, this is a repeated unconfirmed signup — proceed normally
    if (identities?.length === 0 && !userConfirmedAt) {
      console.log('[Onboarding Signup] Branch: repeated signup of unconfirmed user — proceeding to verification');
    } else {
      console.log('[Onboarding Signup] Branch: new signup — proceeding to verification');
    }

    // Send confirmation email directly via edge function (bypasses unconfigured Auth Hook)
    console.log('[Onboarding] Sending confirmation email via send-signup-confirmation edge function');
    try {
      const { error: emailError } = await supabase.functions.invoke('send-signup-confirmation', {
        body: {
          email: signupData.email,
          redirectTo: `${window.location.origin}/auth/callback?login_context=provider`
        }
      });
      if (emailError) {
        console.warn('[Onboarding] Edge function email send failed:', emailError);
      } else {
        console.log('[Onboarding] Confirmation email sent successfully');
      }
    } catch (emailErr) {
      console.warn('[Onboarding] Edge function email call failed (non-critical):', emailErr);
    }

    localStorage.setItem('new_provider_signup', 'true');
    localStorage.setItem('login_context', 'provider');
    
    setVerificationEmail(signupData.email);
    setShowEmailVerification(true);
    startResendCooldown();
    
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
    // Navigation handled by useEffect based on onboarding status
  };

  const handleGoogleLogin = async () => {
    setSaving(true);
    localStorage.setItem('login_context', 'provider');
    
    const { error } = await signInWithGoogle(true, 'provider');
    
    if (error) {
      toast.error('Error con Google', { description: error.message });
      setSaving(false);
    }
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

  const startResendCooldown = useCallback(() => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const handleResendVerification = async (email: string) => {
    if (resendCooldown > 0) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke('send-signup-confirmation', {
        body: {
          email,
          redirectTo: `${window.location.origin}/auth/callback?login_context=provider`
        }
      });
      
      if (error) {
        toast.error('Error al reenviar', { description: error.message });
      } else {
        toast.success('Correo reenviado', {
          description: 'Revisa tu bandeja de entrada'
        });
        startResendCooldown();
      }
    } catch (err: any) {
      toast.error('Error al reenviar', { description: err.message || 'Error desconocido' });
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

  // Persist current step to DB when advancing
  const persistStepToDB = useCallback(async (stepNum: number) => {
    if (!user) return;
    const stepName = STEP_NAME_MAP[stepNum] || 'auth';
    console.log('[Onboarding] Persisting step to DB:', stepName);
    await supabase
      .from('providers')
      .update({ onboarding_step: stepName })
      .eq('user_id', user.id);
  }, [user]);

  const goToNext = () => {
    if (currentStep < totalSteps) {
      const nextStep = currentStep + 1;
      setSlideDirection('forward');
      setCurrentStep(nextStep);
      persistStepToDB(nextStep);
    }
  };

  const goToPrevious = () => {
    if (currentStep > 1) {
      setSlideDirection('backward');
      if (currentStep === 3 && !user) {
        setCurrentStep(2);
        return;
      }
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
      // 🔥 CRITICAL: Ensure provider role exists before anything else
      const { data: existingRoles } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id);
      
      const hasProviderRole = existingRoles?.some(r => r.role === 'provider');
      
      if (!hasProviderRole) {
        console.log('[ProviderOnboarding] Creating missing provider role...');
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({ user_id: user.id, role: 'provider' });
        
        if (roleError && roleError.code !== '23505') { // 23505 = duplicate key
          console.error('[ProviderOnboarding] Error creating provider role:', roleError);
          // Don't throw - continue with profile update, role might be created elsewhere
        } else {
          console.log('[ProviderOnboarding] Provider role created successfully');
        }
      }

      const { error: providerError } = await supabase
        .from('providers')
        .update({
          display_name: profileData.displayName,
          skills: selectedSkills,
          zone_served: workZone || `${workZoneRadius}km radius`,
          current_latitude: workZoneCoords?.lat || null,
          current_longitude: workZoneCoords?.lng || null,
          onboarding_complete: true,
          onboarding_step: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (providerError) throw providerError;
      console.log('[ProviderOnboarding] DB updated: onboarding_complete=true');

      const { error: userError } = await supabase
        .from('users')
        .update({
          full_name: profileData.displayName,
          phone: profileData.phone,
          bio: profileData.bio
        })
        .eq('id', user.id);

      if (userError) throw userError;

      // Ensure provider_details record is linked
      const { data: existingDetails } = await supabase
        .from('provider_details')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!existingDetails) {
        const { data: providerRecord } = await supabase
          .from('providers')
          .select('id')
          .eq('user_id', user.id)
          .single();
        
        if (providerRecord) {
          await supabase
            .from('provider_details')
            .insert({
              provider_id: providerRecord.id,
              user_id: user.id,
              verification_status: 'pending'
            });
          console.log('[ProviderOnboarding] provider_details created');
        }
      }

      localStorage.setItem('selected_role', 'provider');

      toast.success('¡Perfil completado!', {
        description: 'Tu cuenta está lista para recibir trabajos'
      });

      localStorage.removeItem('new_provider_signup');
      clearFormData();

      // Only redirect AFTER DB write succeeds
      navigate(ROUTES.PROVIDER_PORTAL, { replace: true });
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
        return (profileData.avatarUrl || '').length > 0 && (profileData.bio || '').trim().length > 0;
      case 4:
        return selectedSkills.length > 0;
      case 5:
        // Allow advancing if we have valid coordinates (zone name is optional - geocoding may fail)
        return workZoneCoords !== null && (workZoneCoords.lat !== 0 || workZoneCoords.lng !== 0);
      case 6:
        // Documents step is optional, always allow to proceed
        return true;
      default:
        return true;
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );

  // Step 1 removed - now starts at step 2 (auth)

  // Show loading state while checking user status
  if (user && checkingStatus) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative">
        <button
          onClick={() => navigate(hasProviderRole ? ROUTES.PROVIDER_PORTAL : ROUTES.HOME)}
          className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground z-10"
          title="Salir"
        >
          <X className="w-6 h-6" />
        </button>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando tu perfil...</p>
        </div>
      </div>
    );
  }

  // Main wizard layout for steps 2-7
  return (
    <div className="min-h-screen bg-background md:bg-gradient-to-br md:from-primary/5 md:via-background md:to-accent/10">
      {/* Dev debug panel */}
      {import.meta.env.DEV && debugInfo.userId && (
        <div className="fixed bottom-2 left-2 z-50 bg-card/90 border border-border text-xs p-2 rounded shadow max-w-[250px] font-mono text-muted-foreground">
          <div>uid: {debugInfo.userId.slice(0, 8)}…</div>
          <div>onboarding_complete: {String(debugInfo.onboardingComplete ?? 'n/a')}</div>
          <div>db_step: {debugInfo.dbStep ?? 'n/a'}</div>
          <div>ui_step: {currentStep}</div>
        </div>
      )}
      {/* Mobile Header */}
      <div className="md:hidden sticky top-0 z-20 bg-background border-b">
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={goToPrevious}
            disabled={currentStep === 1}
            className="p-2 -ml-2 text-foreground disabled:opacity-30"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <img src={chambyLogo} alt="Chamby" className="h-32" />
          <button 
            onClick={() => navigate(hasProviderRole ? ROUTES.PROVIDER_PORTAL : ROUTES.HOME)}
            className="p-2 -mr-2 text-muted-foreground hover:text-foreground"
            title="Salir"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Progress Track */}
        {currentStep >= 2 && currentStep <= 7 && (
          <div className="px-4 pb-4">
            <div className="flex items-center justify-between text-[10px] font-semibold tracking-wider mb-2">
              {PROGRESS_STEPS.map((step) => (
                <span 
                  key={step.id}
                  className={cn(
                    "transition-colors",
                    currentStep >= step.id ? "text-primary" : "text-muted-foreground/50"
                  )}
                >
                  {step.label}
                </span>
              ))}
            </div>
            <div className="relative h-1 bg-muted rounded-full">
              <div 
                className="absolute h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
              {/* Progress dots */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-2 h-2 rounded-full bg-primary" />
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 left-1/4 w-2 h-2 rounded-full transition-colors",
                currentStep >= 3 ? "bg-primary" : "bg-muted-foreground/30"
              )} />
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 left-1/2 w-2 h-2 rounded-full transition-colors",
                currentStep >= 4 ? "bg-primary" : "bg-muted-foreground/30"
              )} />
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 left-3/4 w-2 h-2 rounded-full transition-colors",
                currentStep >= 5 ? "bg-primary" : "bg-muted-foreground/30"
              )} />
              <div className={cn(
                "absolute top-1/2 -translate-y-1/2 right-0 w-2 h-2 rounded-full transition-colors",
                currentStep >= 6 ? "bg-primary" : "bg-muted-foreground/30"
              )} />
            </div>
          </div>
        )}
      </div>

      {/* Desktop Card Wrapper */}
      <div className="md:flex md:items-center md:justify-center md:min-h-screen md:p-8">
        <Card className="hidden md:block w-full max-w-2xl shadow-floating border-2">
          {/* Desktop Progress Bar */}
          <div className="h-2 bg-muted">
            <div 
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
          
          {/* Desktop Header with Exit */}
          <div className="flex items-center justify-between px-8 pt-6">
            <div /> {/* Spacer */}
            <button 
              onClick={() => navigate(hasProviderRole ? ROUTES.PROVIDER_PORTAL : ROUTES.HOME)}
              className="p-2 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted transition-colors"
              title="Salir"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Desktop Content */}
          <div className="p-8 pt-4 min-h-[500px]">
            {renderStepContent()}
          </div>

          {/* Desktop Navigation */}
          <div className="px-8 py-6 border-t bg-muted/30 flex justify-between items-center">
            <Button
              variant="ghost"
              onClick={goToPrevious}
              disabled={currentStep === 1 || saving}
            >
              Atrás
            </Button>
            <span className="text-sm text-muted-foreground">
              Paso {currentStep} de {totalSteps}
            </span>
            {renderNextButton()}
          </div>
        </Card>

        {/* Mobile Content */}
        <div className="md:hidden flex flex-col min-h-[calc(100vh-120px)]">
          <div 
            key={currentStep}
            className={cn(
              "flex-1 px-6 py-6 overflow-y-auto pb-32",
              slideDirection === 'forward' ? 'animate-slide-in-right' : 'animate-slide-in-left'
            )}
          >
            {renderStepContent()}
          </div>

          {/* Mobile Fixed Bottom Navigation - Centered, Next on top */}
          <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t safe-area-pb">
            <div className="flex flex-col items-center gap-3 max-w-sm mx-auto">
              {renderNextButton(true)}
              {currentStep > 2 && (
                <button 
                  onClick={goToPrevious}
                  disabled={saving}
                  className="text-sm font-medium text-muted-foreground uppercase tracking-wider disabled:opacity-30"
                >
                  Atrás
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {renderModals()}
    </div>
  );

  function renderStepContent() {
    switch (currentStep) {
      case 2:
        return renderAuthStep();
      case 3:
        return renderProfileStep();
      case 4:
        return renderSkillsStep();
      case 5:
        return renderZoneStep();
      case 6:
        return renderDocumentsStep();
      case 7:
        return renderAvailabilityStep();
      case 8:
        return renderCompletionStep();
      default:
        return null;
    }
  }

  function renderAuthStep() {
    if (user) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Conversational Header */}
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            {authMode === 'signup' ? '¡Hola! Vamos a crear tu cuenta' : '¡Bienvenido de vuelta!'}
          </h2>
          <p className="text-muted-foreground">
            {authMode === 'signup' 
              ? 'Necesitamos algunos datos para empezar' 
              : 'Ingresa tus datos para continuar'}
          </p>
        </div>

        {/* Google Sign-in */}
        <Button
          variant="outline"
          className="w-full py-6 text-base border-2 hover:bg-muted/50 rounded-xl"
          onClick={handleGoogleLogin}
          disabled={saving}
        >
          <GoogleIcon />
          Continuar con Google
        </Button>
        
        {/* Existing account detection happens inline at email validation */}

        <div className="relative">
          <Separator />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-background px-4 text-sm text-muted-foreground">
            o con email
          </span>
        </div>
        
        {/* Signup Form */}
        {authMode === 'signup' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                NOMBRE COMPLETO
              </Label>
              <Input
                placeholder="Juan Pérez"
                value={signupData.fullName}
                onChange={(e) => setSignupData({ ...signupData, fullName: e.target.value })}
                className={cn(
                  "h-14 text-base border-2 rounded-xl px-4",
                  signupErrors.fullName && 'border-destructive'
                )}
              />
              {signupErrors.fullName && (
                <p className="text-destructive text-sm">{signupErrors.fullName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                EMAIL
              </Label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={signupData.email}
                onChange={(e) => setSignupData({ ...signupData, email: e.target.value })}
                className={cn(
                  "h-14 text-base border-2 rounded-xl px-4",
                  signupErrors.email && 'border-destructive'
                )}
              />
              {signupErrors.email && (
                <div className="space-y-1.5">
                  <p className="text-destructive text-sm">{signupErrors.email}</p>
                  {signupErrors.email.includes('ya tiene cuenta') && (
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setAuthMode('login');
                          setLoginData({ email: signupData.email, password: '' });
                          setSignupErrors({});
                        }}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        Iniciar sesión
                      </button>
                      <span className="text-muted-foreground text-sm">·</span>
                      <button
                        type="button"
                        onClick={() => {
                          setVerificationEmail(signupData.email);
                          handleResendVerification(signupData.email);
                          setShowVerificationPending(true);
                          setSignupErrors({});
                        }}
                        className="text-sm text-primary font-medium hover:underline"
                      >
                        Reenviar código
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                TELÉFONO
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
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                CONTRASEÑA
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Crea una contraseña segura"
                  value={signupData.password}
                  onChange={(e) => setSignupData({ ...signupData, password: e.target.value })}
                  className={cn(
                    "h-14 text-base border-2 rounded-xl px-4 pr-12",
                    signupErrors.password && 'border-destructive'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              <PasswordStrengthBar password={signupData.password} />
              {signupErrors.password && (
                <p className="text-destructive text-sm">{signupErrors.password}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                CONFIRMAR CONTRASEÑA
              </Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={signupData.confirmPassword}
                  onChange={(e) => setSignupData({ ...signupData, confirmPassword: e.target.value })}
                  className={cn(
                    "h-14 text-base border-2 rounded-xl px-4 pr-12",
                    signupErrors.confirmPassword && 'border-destructive'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {signupErrors.confirmPassword && (
                <p className="text-destructive text-sm">{signupErrors.confirmPassword}</p>
              )}
            </div>
          </div>
        )}

        {/* Login Form */}
        {authMode === 'login' && (
          <div className="space-y-5">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                EMAIL
              </Label>
              <Input
                type="email"
                placeholder="tu@email.com"
                value={loginData.email}
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                className={cn(
                  "h-14 text-base border-2 rounded-xl px-4",
                  loginErrors.email && 'border-destructive'
                )}
              />
              {loginErrors.email && (
                <p className="text-destructive text-sm">{loginErrors.email}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
                CONTRASEÑA
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Tu contraseña"
                  value={loginData.password}
                  onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                  className={cn(
                    "h-14 text-base border-2 rounded-xl px-4 pr-12",
                    loginErrors.password && 'border-destructive'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {loginErrors.password && (
                <p className="text-destructive text-sm">{loginErrors.password}</p>
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

        <p className="text-center text-sm text-muted-foreground pt-2">
          ¿Ya tienes cuenta?{' '}
          <button
            type="button"
            onClick={() => navigate(ROUTES.PROVIDER_LOGIN)}
            className="text-primary hover:underline font-medium"
          >
            Inicia sesión
          </button>
        </p>
      </div>
    );
  }

  function renderProfileStep() {
    const handleProfilePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !user) return;

      setSaving(true);
      try {
        const fileExt = file.name.split('.').pop();
        const filePath = `${user.id}/avatar.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(filePath);

        // Update both tables
        await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', user.id);
        await supabase.from('providers').update({ avatar_url: publicUrl }).eq('user_id', user.id);

        setProfileData(prev => ({ ...prev, avatarUrl: publicUrl }));
        toast.success('¡Foto actualizada!');
      } catch (err: any) {
        console.error('Error uploading photo:', err);
        toast.error('Error al subir la foto');
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Tu perfil profesional
          </h2>
          <p className="text-muted-foreground">
            Agrega una foto y describe tu experiencia
          </p>
        </div>

        {/* Profile Photo Upload - Mandatory */}
        <div className="flex flex-col items-center gap-3">
          <label htmlFor="profile-photo-upload" className="cursor-pointer group">
            <div className={cn(
              "w-28 h-28 rounded-full border-4 border-dashed flex items-center justify-center overflow-hidden transition-all",
              profileData.avatarUrl 
                ? "border-primary" 
                : "border-muted-foreground/30 group-hover:border-primary/50"
            )}>
              {profileData.avatarUrl ? (
                <img src={profileData.avatarUrl} alt="Foto de perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-2">
                  <User className="w-8 h-8 mx-auto text-muted-foreground/50 mb-1" />
                  <span className="text-[10px] text-muted-foreground">Toca para subir</span>
                </div>
              )}
            </div>
          </label>
          <input
            id="profile-photo-upload"
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={handleProfilePhotoUpload}
          />
          <p className="text-xs text-muted-foreground">
            Foto de perfil <span className="text-destructive">*</span> obligatoria
          </p>
        </div>

        {/* Work Experience Description */}
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            EXPERIENCIA LABORAL <span className="text-destructive">*</span>
          </Label>
          <Textarea
            placeholder="Describe tu experiencia: ¿Qué tipo de trabajos has realizado? ¿Cuántos años de experiencia tienes?"
            value={profileData.bio}
            onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
            className="text-base border-2 rounded-xl px-4 py-3 resize-none min-h-[120px]"
            rows={4}
          />
          <p className="text-[11px] text-muted-foreground">
            Esto ayudará a los clientes a conocer tu trabajo
          </p>
        </div>
      </div>
    );
  }

  function renderSkillsStep() {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            ¿Qué servicios ofreces?
          </h2>
          <p className="text-muted-foreground">
            Selecciona al menos 1 habilidad
          </p>
        </div>

        {/* Visual Skill Grid - 2 columns, larger cards */}
        <div className="grid grid-cols-2 gap-3">
          {SKILL_OPTIONS.map((skill) => {
            const Icon = skill.icon;
            const isSelected = selectedSkills.includes(skill.name);
            
            return (
              <button
                key={skill.name}
                onClick={() => toggleSkill(skill.name)}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-muted hover:border-primary/50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
                  skill.bgColor
                )}>
                  <Icon className={cn("w-5 h-5", skill.iconColor)} />
                </div>
                <span className="text-xs font-medium leading-tight flex-1">
                  {skill.name}
                </span>
                {isSelected && (
                  <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* Custom Skill Input */}
        <div className="pt-4 border-t">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-2 block">
            AGREGAR OTRA HABILIDAD
          </Label>
          <div className="flex gap-2">
            <Input
              placeholder="Ej: Aire acondicionado"
              value={customSkill}
              onChange={(e) => setCustomSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addCustomSkill()}
              className="h-12 text-base border-2 rounded-xl flex-1"
            />
            <Button 
              onClick={addCustomSkill}
              disabled={!customSkill.trim()}
              className="h-12 px-4 rounded-xl"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Selected custom skills */}
        {selectedSkills.filter(s => !SKILL_OPTIONS.find(opt => opt.name === s)).length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {selectedSkills
              .filter(s => !SKILL_OPTIONS.find(opt => opt.name === s))
              .map((skill) => (
                <span
                  key={skill}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium"
                >
                  {skill}
                  <button onClick={() => removeSkill(skill)} className="hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </span>
              ))}
          </div>
        )}

        <p className={cn(
          "text-sm text-center font-medium",
          selectedSkills.length === 0 ? "text-destructive/70" : "text-muted-foreground"
        )}>
          {selectedSkills.length === 0 
            ? 'Selecciona al menos 1 habilidad para continuar'
            : `${selectedSkills.length} habilidad${selectedSkills.length !== 1 ? 'es' : ''} seleccionada${selectedSkills.length !== 1 ? 's' : ''}`
          }
        </p>
      </div>
    );
  }

  function renderDocumentsStep() {
    return (
      <DocumentsStep isOptional={true} />
    );
  }

  function renderZoneStep() {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            ¿Dónde trabajas?
          </h2>
          <p className="text-muted-foreground">
            Define tu área de servicio en el mapa
          </p>
        </div>

        <WorkZonePicker 
          initialLat={workZoneCoords?.lat}
          initialLng={workZoneCoords?.lng}
          initialRadius={workZoneRadius}
          onZoneChange={handleWorkZoneChange}
        />
      </div>
    );
  }

  function renderAvailabilityStep() {
    return (
      <div className="space-y-6">
        <div className="mb-6">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            ¿Cuándo estás disponible?
          </h2>
          <p className="text-muted-foreground">
            Podrás cambiar esto después
          </p>
        </div>

        <div className="space-y-3">
          {[
            { id: 'weekdays-9-5', title: 'Lunes a Viernes', desc: '9:00 AM - 5:00 PM' },
            { id: 'weekdays-extended', title: 'Lunes a Viernes Extendido', desc: '7:00 AM - 9:00 PM' },
            { id: 'flexible', title: 'Flexible', desc: 'Disponible cualquier día y horario' },
            { id: 'weekends', title: 'Solo fines de semana', desc: 'Sábados y domingos' },
          ].map((option) => (
            <button
              key={option.id}
              className={cn(
                "w-full border-2 rounded-xl p-4 text-left transition-all",
                availability === option.id 
                  ? "border-primary bg-primary/5 shadow-md" 
                  : "border-muted hover:border-primary/50"
              )}
              onClick={() => setAvailability(option.id)}
            >
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                  availability === option.id ? "border-primary" : "border-muted-foreground"
                )}>
                  {availability === option.id && (
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-foreground">{option.title}</p>
                  <p className="text-sm text-muted-foreground">{option.desc}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  function renderCompletionStep() {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 animate-bounce-subtle">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
          ¡Todo Listo!
        </h1>
        <p className="text-muted-foreground text-lg max-w-sm mx-auto">
          Tu perfil está completo. Ya puedes comenzar a recibir trabajos.
        </p>
        
        <div className="bg-muted/50 rounded-xl p-5 border max-w-sm mx-auto text-left">
          <h3 className="font-semibold mb-3 text-sm">Resumen de tu perfil:</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Nombre: {profileData.displayName}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              {selectedSkills.length} habilidades
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Zona: {workZone}
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              Disponibilidad configurada
            </li>
          </ul>
        </div>
      </div>
    );
  }

  function renderNextButton(isMobile = false) {
    if (currentStep < totalSteps) {
      const handleClick = () => {
        if (currentStep === 2 && !user) {
          if (authMode === 'signup') {
            handleSignup();
          } else {
            handleLogin();
          }
        } else {
          goToNext();
        }
      };

      const buttonText = saving 
        ? 'Procesando...' 
        : currentStep === 2 && !user 
          ? (authMode === 'signup' ? 'Crear Cuenta' : 'Iniciar Sesión')
          : currentStep === 6
            ? 'Continuar'
            : 'Siguiente';

      return (
        <div className={cn("flex flex-col gap-2", isMobile ? "w-full" : "")}>
          <Button
            onClick={handleClick}
            disabled={!canGoNext() || saving}
            className={cn(
              "font-semibold shadow-lg bg-primary text-primary-foreground hover:bg-primary/90",
              isMobile ? "w-full py-4 text-base rounded-xl" : ""
            )}
          >
            {buttonText}
            {currentStep === 2 && authMode === 'login' && !user ? (
              <LogIn className="w-4 h-4 ml-2" />
            ) : (
              <ArrowRight className="w-4 h-4 ml-2" />
            )}
          </Button>
          {currentStep === 6 && isMobile && (
            <p className="text-xs text-center text-muted-foreground">
              Puedes completar la verificación después
            </p>
          )}
        </div>
      );
    }

    return (
      <Button
        onClick={handleFinish}
        disabled={saving}
        className={cn(
          "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg",
          isMobile ? "w-full py-4 text-base rounded-xl" : ""
        )}
      >
        {saving ? 'Guardando...' : 'Ir al Portal'}
      </Button>
    );
  }

  function renderModals() {
    return (
      <>
        {/* Email Verification Modal */}
        <Dialog open={showEmailVerification} onOpenChange={setShowEmailVerification}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5 text-primary" />
                Verifica tu correo
              </DialogTitle>
              <DialogDescription className="space-y-3 pt-2">
                <p>Hemos enviado un correo de verificación a:</p>
                <p className="font-semibold text-foreground">{verificationEmail}</p>
                <p>Por favor revisa tu bandeja de entrada y haz clic en el enlace.</p>
                <div className="bg-accent/20 border border-accent rounded-lg p-3 text-sm">
                  <p className="font-medium text-foreground mb-1">💡 Consejo:</p>
                  <p>Si no ves el correo, revisa tu carpeta de spam.</p>
                </div>
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-end">
              <Button onClick={() => {
                setShowEmailVerification(false);
                setShowVerificationPending(true);
              }}>
                Entendido
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Verification Pending */}
        {showVerificationPending && (
          <div className="fixed inset-0 bg-background/95 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md shadow-floating border-2">
              <div className="p-6 sm:p-8 text-center space-y-5">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <Mail className="w-10 h-10 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Revisa tu correo 📧</h2>
                  <p className="text-muted-foreground">
                    Te enviamos un enlace a{' '}
                    <span className="font-semibold text-foreground">{verificationEmail}</span>
                  </p>
                </div>

                {/* Help microcopy */}
                <div className="bg-accent/20 border border-accent rounded-lg p-3 text-left text-sm space-y-1">
                  <p className="font-medium text-foreground">💡 ¿No lo ves?</p>
                  <ul className="text-muted-foreground space-y-0.5 list-disc list-inside">
                    <li>Revisa tu carpeta de <strong>spam</strong> o <strong>promociones</strong></li>
                    <li>Verifica que el email sea correcto</li>
                    <li>Espera unos minutos, a veces tarda</li>
                  </ul>
                </div>
                
                <div className="space-y-3 pt-2 border-t">
                  <p className="text-sm font-medium text-foreground pt-3">O ingresa el código:</p>
                  <Input
                    placeholder="Código de verificación"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    className="text-center text-lg tracking-widest font-mono h-14"
                    maxLength={6}
                  />
                  <Button
                    onClick={handleVerifyWithCode}
                    className="w-full h-12"
                    disabled={verifyingCode || !verificationCode.trim()}
                  >
                    {verifyingCode ? 'Verificando...' : 'Verificar'}
                  </Button>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={() => handleResendVerification(verificationEmail)}
                    variant="outline"
                    className="w-full"
                    disabled={saving || resendCooldown > 0}
                  >
                    {resendCooldown > 0 
                      ? `Reenviar en ${resendCooldown}s` 
                      : 'Reenviar correo'}
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowVerificationPending(false);
                        setVerificationEmail('');
                        setVerificationCode('');
                      }}
                      className="flex-1 text-sm"
                    >
                      <ArrowLeft className="w-4 h-4 mr-1" />
                      Cambiar correo
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowVerificationPending(false);
                        setAuthMode('login');
                        setLoginData({ email: verificationEmail, password: '' });
                      }}
                      className="flex-1 text-sm"
                    >
                      Ya verifiqué
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground pt-1">
                    ¿Sigues sin recibir el correo?{' '}
                    <a href="mailto:soporte@chamby.mx" className="text-primary hover:underline">
                      Contacta soporte
                    </a>
                  </p>
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
                  ? 'Te enviamos un correo con instrucciones.'
                  : 'Ingresa tu email para restablecer tu contraseña.'}
              </DialogDescription>
            </DialogHeader>
            {!resetSent ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setShowResetPassword(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleResetPassword} disabled={saving}>
                    {saving ? 'Enviando...' : 'Enviar'}
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
      </>
    );
  }
}
