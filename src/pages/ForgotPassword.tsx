import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { ArrowLeft, Mail, Loader2, CheckCircle } from 'lucide-react';
import ChambyLogoText from '@/components/ChambyLogoText';
import { ROUTES } from '@/constants/routes';

type Step = 'request' | 'sent';

const RESEND_COOLDOWN = 30;

const ForgotPassword = () => {
  const { resetPassword } = useAuth();

  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // Countdown timer for resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const validateEmail = (val: string) => {
    if (!val) return 'Ingresa tu email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Ingresa un email válido';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validateEmail(email);
    if (err) { setEmailError(err); return; }
    setEmailError('');
    setLoading(true);

    const { error } = await resetPassword(email);

    setLoading(false);

    if (error) {
      // Don't reveal whether the email exists — show a generic error only for
      // real failures (network, rate limit). For "not found", proceed to sent
      // screen anyway to prevent email enumeration.
      if (error.message?.toLowerCase().includes('rate') || error.message?.toLowerCase().includes('network')) {
        setEmailError('Demasiados intentos. Espera un momento e intenta de nuevo.');
        return;
      }
    }

    setStep('sent');
    setCooldown(RESEND_COOLDOWN);
  };

  const handleResend = async () => {
    if (cooldown > 0 || resendLoading) return;
    setResendLoading(true);
    setResendSuccess(false);
    await resetPassword(email);
    setResendLoading(false);
    setResendSuccess(true);
    setCooldown(RESEND_COOLDOWN);
    setTimeout(() => setResendSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex flex-col">
      <header className="p-4">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Volver
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-border/20">

            {step === 'request' && (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="flex justify-center mb-4">
                    <ChambyLogoText size="xl" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Olvidé mi contraseña</h1>
                  <p className="text-muted-foreground text-sm mt-1">
                    Escribe tu email y te enviamos un enlace para recuperar tu acceso.
                  </p>
                </CardHeader>

                <CardContent className="pt-4 space-y-5">
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className={emailError ? 'text-destructive' : ''}>
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={e => { setEmail(e.target.value); setEmailError(''); }}
                        className={`h-12 text-base ${emailError ? 'border-destructive' : ''}`}
                        placeholder="tu@email.com"
                        autoComplete="email"
                        autoFocus
                        required
                      />
                      {emailError && (
                        <p className="text-destructive text-sm">{emailError}</p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-semibold"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        'Enviar enlace'
                      )}
                    </Button>
                  </form>

                  <div className="text-center pt-2 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      ¿Recuerdas tu contraseña?{' '}
                      <Link to={ROUTES.LOGIN} className="text-primary font-medium hover:underline">
                        Iniciar sesión
                      </Link>
                    </p>
                  </div>
                </CardContent>
              </>
            )}

            {step === 'sent' && (
              <>
                <CardHeader className="text-center pb-2">
                  <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Mail className="w-7 h-7 text-primary" />
                  </div>
                  <h1 className="text-2xl font-bold text-foreground">Revisa tu correo</h1>
                </CardHeader>

                <CardContent className="pt-2 space-y-5">
                  <p className="text-center text-muted-foreground text-sm leading-relaxed">
                    Enviamos un enlace a{' '}
                    <span className="font-semibold text-foreground">{email}</span>
                    . Haz clic en el enlace del email para crear tu nueva contraseña.
                  </p>

                  <div className="bg-muted/40 rounded-lg px-4 py-3">
                    <p className="text-xs text-muted-foreground text-center leading-relaxed">
                      ¿No lo ves? Revisa tu carpeta de spam o correo no deseado.
                    </p>
                  </div>

                  {/* Resend */}
                  <div className="text-center">
                    {resendSuccess ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4" />
                        Reenviado
                      </span>
                    ) : cooldown > 0 ? (
                      <span className="text-sm text-muted-foreground">
                        Reenviar en {cooldown}s
                      </span>
                    ) : (
                      <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-sm text-primary font-medium hover:underline disabled:opacity-50 inline-flex items-center gap-1.5"
                      >
                        {resendLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                        Reenviar email
                      </button>
                    )}
                  </div>

                  <div className="text-center pt-2 border-t border-border">
                    <Link
                      to={ROUTES.LOGIN}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      Volver al inicio de sesión
                    </Link>
                  </div>
                </CardContent>
              </>
            )}

          </Card>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
