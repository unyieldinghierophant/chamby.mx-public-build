import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Eye, EyeOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { z } from 'zod';
import { PasswordStrengthBar } from '@/components/PasswordStrengthBar';
import ChambyLogoText from '@/components/ChambyLogoText';
import { ROUTES } from '@/constants/routes';

const passwordSchema = z.object({
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

type PageState = 'verifying' | 'ready' | 'error' | 'success';

const ResetPassword = () => {
  const { updatePassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [pageState, setPageState] = useState<PageState>('verifying');
  const [tokenError, setTokenError] = useState('');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ── Verify token on mount ──
  useEffect(() => {
    const verify = async () => {
      try {
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
        } else if (tokenHash && type === 'recovery') {
          const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
          if (error) throw error;
        } else {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error('no session');
        }
        setPageState('ready');
      } catch {
        setTokenError('Este enlace ya no es válido o ha expirado.');
        setPageState('error');
      }
    };
    verify();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});

    try {
      passwordSchema.parse({ password, confirmPassword });
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errs: Record<string, string> = {};
        err.issues.forEach(i => { if (i.path[0]) errs[i.path[0] as string] = i.message; });
        setFieldErrors(errs);
      }
      return;
    }

    setSubmitting(true);
    const { error } = await updatePassword(password);
    setSubmitting(false);

    if (error) {
      const msg = error.message?.toLowerCase() ?? '';
      if (msg.includes('weak') || msg.includes('easy to guess')) {
        setFieldErrors({ password: 'La contraseña es muy común. Elige una diferente.' });
      } else if (msg.includes('same')) {
        setFieldErrors({ password: 'La nueva contraseña debe ser diferente a la anterior.' });
      } else {
        setFieldErrors({ password: 'No se pudo actualizar la contraseña. Intenta de nuevo.' });
      }
      return;
    }

    setPageState('success');
  };

  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  // ── Verifying ──
  if (pageState === 'verifying') {
    return (
      <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
          <CardContent className="py-12 flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-sm text-muted-foreground">Verificando enlace...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Invalid token ──
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
          <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
            <AlertCircle className="w-12 h-12 text-destructive" />
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Enlace inválido</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {tokenError} Los enlaces de recuperación expiran en 1 hora.
              </p>
            </div>
            <Button asChild className="w-full h-12 text-base font-semibold mt-2">
              <Link to="/forgot-password">Solicitar nuevo enlace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Success ──
  if (pageState === 'success') {
    return (
      <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
          <CardContent className="py-10 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="w-14 h-14 text-green-500" />
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">¡Listo!</h2>
              <p className="text-sm text-muted-foreground">Tu contraseña fue actualizada exitosamente.</p>
            </div>
            <Button
              className="w-full h-12 text-base font-semibold mt-2"
              onClick={() => navigate(ROUTES.USER_LANDING)}
            >
              Continuar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ── Form ──
  return (
    <div className="min-h-screen bg-gradient-main bg-gradient-mesh flex flex-col">
      <header className="p-4">
        <Link
          to={ROUTES.LOGIN}
          className="inline-flex items-center text-primary hover:text-primary/80 transition-colors"
        >
          ← Volver
        </Link>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <Card className="bg-card/95 backdrop-blur-sm shadow-raised border-border/20">
            <CardHeader className="text-center pb-2">
              <div className="flex justify-center mb-4">
                <ChambyLogoText size="xl" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Elige una nueva contraseña</h1>
              <p className="text-muted-foreground text-sm mt-1">
                Debe tener al menos 6 caracteres.
              </p>
            </CardHeader>

            <CardContent className="pt-4">
              <form onSubmit={handleSubmit} className="space-y-5">

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className={fieldErrors.password ? 'text-destructive' : ''}>
                    Nueva contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setFieldErrors(fe => ({ ...fe, password: '' })); }}
                      className={`h-12 text-base pr-11 ${fieldErrors.password ? 'border-destructive' : ''}`}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-destructive text-sm">{fieldErrors.password}</p>
                  )}
                  <PasswordStrengthBar password={password} className="mt-2" />
                </div>

                {/* Confirm password */}
                <div className="space-y-2">
                  <Label htmlFor="confirm" className={fieldErrors.confirmPassword ? 'text-destructive' : ''}>
                    Confirmar contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm"
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => { setConfirmPassword(e.target.value); setFieldErrors(fe => ({ ...fe, confirmPassword: '' })); }}
                      className={`h-12 text-base pr-11 ${
                        fieldErrors.confirmPassword ? 'border-destructive'
                        : passwordsMatch ? 'border-green-500'
                        : ''
                      }`}
                      placeholder="Repite la contraseña"
                      autoComplete="new-password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {fieldErrors.confirmPassword && (
                    <p className="text-destructive text-sm">{fieldErrors.confirmPassword}</p>
                  )}
                  {passwordsMatch && !fieldErrors.confirmPassword && (
                    <p className="text-green-600 text-sm flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5" />
                      Las contraseñas coinciden
                    </p>
                  )}
                  {passwordsMismatch && !fieldErrors.confirmPassword && (
                    <p className="text-destructive text-sm">Las contraseñas no coinciden</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Guardar contraseña'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
