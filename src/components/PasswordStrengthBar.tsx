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
    { label: 'Mínimo 6 caracteres', met: password.length >= 6 },
  ], [password]);

  // Calculate additional strength factors for better UX
  const strengthFactors = useMemo(() => {
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    return score;
  }, [password]);

  // Use strength factors for visual feedback (max 5)
  const strength = Math.min(strengthFactors, 5);
  const strengthPercent = (strength / 5) * 100;

  const getBarColor = () => {
    if (strength === 0) return 'bg-muted';
    if (strength === 1) return 'bg-orange-500';
    if (strength === 2) return 'bg-yellow-500';
    if (strength === 3) return 'bg-lime-500';
    if (strength >= 4) return 'bg-green-500';
    return 'bg-green-500';
  };

  const getStrengthLabel = () => {
    if (strength === 0) return '';
    if (strength === 1) return 'Aceptable';
    if (strength === 2) return 'Regular';
    if (strength === 3) return 'Buena';
    if (strength >= 4) return 'Fuerte';
    return 'Fuerte';
  };

  const getLabelColor = () => {
    if (strength === 0) return 'text-muted-foreground';
    if (strength === 1) return 'text-orange-500';
    if (strength === 2) return 'text-yellow-600';
    if (strength === 3) return 'text-lime-600';
    if (strength >= 4) return 'text-green-500';
    return 'text-green-500';
  };

  // Check if password meets minimum requirement
  const meetsMinimum = password.length >= 6;

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
      <div className="space-y-1.5">
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
        
        {/* Show helpful tips when password is short */}
        {password.length > 0 && password.length < 6 && (
          <p className="text-xs text-muted-foreground mt-2">
            Necesitas {6 - password.length} caracteres más
          </p>
        )}
        
        {/* Show tips for stronger password when minimum is met */}
        {meetsMinimum && strength < 3 && (
          <p className="text-xs text-muted-foreground mt-2">
            Añade mayúsculas, números o símbolos para mayor seguridad
          </p>
        )}
      </div>
    </div>
  );
}
