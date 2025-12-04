import { cn } from "@/lib/utils";
import { Shield, Clock, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VerificationStatus = 'none' | 'pending' | 'verified' | 'rejected';

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const STATUS_CONFIG: Record<VerificationStatus, {
  label: string;
  description: string;
  icon: typeof Shield;
  bgColor: string;
  textColor: string;
  iconColor: string;
}> = {
  none: {
    label: 'Sin Verificar',
    description: 'Sube tus documentos para verificar tu cuenta',
    icon: AlertCircle,
    bgColor: 'bg-muted',
    textColor: 'text-muted-foreground',
    iconColor: 'text-muted-foreground'
  },
  pending: {
    label: 'Verificación Pendiente',
    description: 'Estamos revisando tus documentos',
    icon: Clock,
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    iconColor: 'text-amber-600 dark:text-amber-400'
  },
  verified: {
    label: 'Verificado',
    description: 'Tu cuenta ha sido verificada',
    icon: CheckCircle2,
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    iconColor: 'text-emerald-600 dark:text-emerald-400'
  },
  rejected: {
    label: 'Verificación Rechazada',
    description: 'Hay un problema con tus documentos. Por favor revisa y vuelve a subir.',
    icon: XCircle,
    bgColor: 'bg-destructive/10',
    textColor: 'text-destructive',
    iconColor: 'text-destructive'
  }
};

const SIZE_CONFIG = {
  sm: {
    badge: 'px-2 py-0.5 text-xs gap-1',
    icon: 'w-3 h-3'
  },
  md: {
    badge: 'px-2.5 py-1 text-sm gap-1.5',
    icon: 'w-4 h-4'
  },
  lg: {
    badge: 'px-3 py-1.5 text-base gap-2',
    icon: 'w-5 h-5'
  }
};

export const VerificationBadge = ({
  status,
  size = 'md',
  showLabel = true,
  className
}: VerificationBadgeProps) => {
  const config = STATUS_CONFIG[status];
  const sizeConfig = SIZE_CONFIG[size];
  const Icon = config.icon;

  const badge = (
    <div
      className={cn(
        "inline-flex items-center rounded-full font-medium",
        config.bgColor,
        config.textColor,
        sizeConfig.badge,
        className
      )}
    >
      <Icon className={cn(sizeConfig.icon, config.iconColor)} />
      {showLabel && <span>{config.label}</span>}
    </div>
  );

  if (!showLabel) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">{config.label}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
};

// Banner component for showing verification status prominently
interface VerificationBannerProps {
  status: VerificationStatus;
  onUploadClick?: () => void;
  className?: string;
}

export const VerificationBanner = ({
  status,
  onUploadClick,
  className
}: VerificationBannerProps) => {
  const config = STATUS_CONFIG[status];
  const Icon = config.icon;

  if (status === 'verified') return null;

  return (
    <div
      className={cn(
        "rounded-lg p-4 flex items-start gap-3",
        config.bgColor,
        className
      )}
    >
      <Icon className={cn("w-5 h-5 mt-0.5 shrink-0", config.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium", config.textColor)}>{config.label}</p>
        <p className="text-sm text-muted-foreground mt-0.5">{config.description}</p>
        {status === 'none' && onUploadClick && (
          <button
            onClick={onUploadClick}
            className="text-sm font-medium text-primary hover:underline mt-2"
          >
            Subir documentos →
          </button>
        )}
        {status === 'rejected' && onUploadClick && (
          <button
            onClick={onUploadClick}
            className="text-sm font-medium text-primary hover:underline mt-2"
          >
            Volver a subir documentos →
          </button>
        )}
      </div>
    </div>
  );
};