import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Icon3DProps {
  icon: LucideIcon;
  gradient?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Icon3D = ({ 
  icon: Icon, 
  gradient = 'from-blue-400 to-blue-600',
  size = 'md',
  className 
}: Icon3DProps) => {
  const sizes = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  const iconSizes = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12'
  };

  return (
    <div className={cn('relative group', className)}>
      {/* Outer glow layer */}
      <div className={cn(
        'absolute inset-0 opacity-20 blur-xl rounded-3xl group-hover:opacity-30 transition-opacity',
        'bg-gradient-to-br',
        gradient
      )} />
      
      {/* Main 3D container */}
      <div className={cn(
        sizes[size],
        'relative rounded-2xl flex items-center justify-center',
        'bg-gradient-to-br backdrop-blur-xl',
        'border border-white/30',
        'shadow-[0_8px_32px_0_rgba(31,38,135,0.15)]',
        'group-hover:shadow-[0_12px_48px_0_rgba(31,38,135,0.25)]',
        'group-hover:scale-105',
        'transition-all duration-300',
        gradient
      )}>
        {/* Inner highlight for depth */}
        <div className="absolute inset-[1px] rounded-2xl bg-gradient-to-br from-white/20 to-transparent" />
        
        {/* Icon */}
        <Icon 
          className={cn(
            iconSizes[size],
            'relative z-10 text-white drop-shadow-lg',
            'group-hover:scale-110 transition-transform duration-300'
          )} 
          strokeWidth={1.5} 
        />
        
        {/* Bottom shadow for lifted effect */}
        <div className="absolute -bottom-2 inset-x-4 h-4 bg-black/10 blur-lg rounded-full" />
      </div>
    </div>
  );
};
