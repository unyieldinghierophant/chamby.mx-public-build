import { memo } from 'react';
import { motion } from 'framer-motion';

interface LocationPinProps {
  x: number;
  y: number;
  label: string;
  delay?: number;
  reducedMotion?: boolean;
}

export const LocationPin = memo(({ x, y, label, delay = 0, reducedMotion = false }: LocationPinProps) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{ left: `${x}%`, top: `${y}%` }}
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: delay + 0.5, duration: 0.4, ease: 'easeOut' }}
  >
    {/* Pulse ring - disabled with reduced motion */}
    {!reducedMotion && (
      <motion.div
        className="absolute -inset-3 rounded-full bg-primary/20"
        animate={{
          scale: [1, 1.8, 1],
          opacity: [0.4, 0, 0.4],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          delay: delay,
          ease: 'easeInOut',
        }}
      />
    )}
    
    {/* Pin dot */}
    <div className="relative w-3 h-3 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.6)]">
      {/* Inner highlight */}
      <div className="absolute inset-0.5 rounded-full bg-white/40" />
    </div>
    
    {/* City label */}
    <span 
      className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-medium text-primary/70 whitespace-nowrap"
      style={{ textShadow: '0 1px 2px rgba(255,255,255,0.8)' }}
    >
      {label}
    </span>
  </motion.div>
));

LocationPin.displayName = 'LocationPin';
