import { useMemo } from 'react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PasswordStrengthBarProps {
  password: string;
  className?: string;
}

interface Requirement {
  label: string;
  met: boolean;
}

export function PasswordStrengthBar({ password, className }: PasswordStrengthBarProps) {
  const requirements: Requirement[] = useMemo(() => [
    { label: 'Mínimo 8 caracteres', met: password.length >= 8 },
    { label: 'Al menos una mayúscula (A-Z)', met: /[A-Z]/.test(password) },
    { label: 'Al menos una minúscula (a-z)', met: /[a-z]/.test(password) },
    { label: 'Al menos un número (0-9)', met: /[0-9]/.test(password) },
    { label: 'Al menos un caracter especial (!@#$%^&*)', met: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
  ], [password]);

  const strength = useMemo(() => {
    const metCount = requirements.filter(r => r.met).length;
    return metCount;
  }, [requirements]);

  const strengthPercent = (strength / requirements.length) * 100;

  const getBarColor = () => {
    if (strength === 0) return 'bg-muted';
    if (strength === 1) return 'bg-red-500';
    if (strength === 2) return 'bg-orange-500';
    if (strength === 3) return 'bg-yellow-500';
    if (strength === 4) return 'bg-lime-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength === 1) return 'Muy débil';
    if (strength === 2) return 'Débil';
    if (strength === 3) return 'Regular';
    if (strength === 4) return 'Buena';
    return 'Fuerte';
  };

  const getLabelColor = () => {
    if (strength === 0) return 'text-muted-foreground';
    if (strength === 1) return 'text-red-500';
    if (strength === 2) return 'text-orange-500';
    if (strength === 3) return 'text-yellow-600';
    if (strength === 4) return 'text-lime-600';
    return 'text-green-500';
  };

  if (!password) return null;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Strength Bar */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Seguridad</span>
          <span className={cn("text-xs font-medium", getLabelColor())}>
            {getStrengthLabel()}
          </span>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all duration-300 ease-out rounded-full",
              getBarColor()
            )}
            style={{ width: `${strengthPercent}%` }}
          />
        </div>
      </div>

      {/* Requirements Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
        {requirements.map((req, index) => (
          <div
            key={index}
            className={cn(
              "flex items-center gap-1.5 text-xs transition-colors",
              req.met ? "text-green-600" : "text-muted-foreground"
            )}
          >
            {req.met ? (
              <Check className="w-3.5 h-3.5 flex-shrink-0" />
            ) : (
              <X className="w-3.5 h-3.5 flex-shrink-0 text-muted-foreground/50" />
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
