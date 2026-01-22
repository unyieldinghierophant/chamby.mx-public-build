import { memo } from 'react';
import { motion } from 'framer-motion';

interface FloatingDotsProps {
  reducedMotion?: boolean;
}

const dots = [
  { x: 25, y: 30, size: 2, delay: 0 },
  { x: 70, y: 45, size: 1.5, delay: 0.5 },
  { x: 45, y: 65, size: 2.5, delay: 1 },
  { x: 80, y: 25, size: 1.5, delay: 1.5 },
  { x: 15, y: 55, size: 2, delay: 2 },
];

export const FloatingDots = memo(({ reducedMotion = false }: FloatingDotsProps) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
    {dots.map((dot, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-primary/10"
        style={{
          left: `${dot.x}%`,
          top: `${dot.y}%`,
          width: `${dot.size * 4}px`,
          height: `${dot.size * 4}px`,
        }}
        initial={{ opacity: 0 }}
        animate={
          reducedMotion
            ? { opacity: 0.3 }
            : {
                opacity: [0.1, 0.3, 0.1],
                y: [0, -10, 0],
              }
        }
        transition={
          reducedMotion
            ? { duration: 0.5, delay: dot.delay * 0.2 }
            : {
                duration: 4 + i * 0.5,
                repeat: Infinity,
                delay: dot.delay,
                ease: 'easeInOut',
              }
        }
      />
    ))}
  </div>
));

FloatingDots.displayName = 'FloatingDots';
