import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  opacity: number;
}

export const HeroParticles = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  // Generate particles with useMemo so they don't regenerate on every render
  const particles = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
      opacity: Math.random() * 0.5 + 0.2,
    }));
  }, []);

  // Floating lines/streaks for extra visual interest
  const streaks = useMemo(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      rotation: Math.random() * 360,
      length: Math.random() * 30 + 20,
      duration: Math.random() * 5 + 4,
      delay: Math.random() * 3,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <AnimatePresence>
        {isLoaded && (
          <>
            {/* Floating particles */}
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                initial={{ 
                  opacity: 0, 
                  scale: 0,
                  x: `${particle.x}%`,
                  y: `${particle.y}%`
                }}
                animate={{ 
                  opacity: [0, particle.opacity, particle.opacity, 0],
                  scale: [0, 1, 1, 0],
                  y: [`${particle.y}%`, `${particle.y - 20}%`],
                }}
                transition={{
                  duration: particle.duration,
                  delay: particle.delay,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute rounded-full bg-white/80"
                style={{
                  width: particle.size,
                  height: particle.size,
                  filter: 'blur(0.5px)',
                  boxShadow: '0 0 10px rgba(255, 255, 255, 0.5)',
                }}
              />
            ))}

            {/* Glowing orbs - larger, slower moving */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={`orb-${i}`}
                initial={{ 
                  opacity: 0,
                  x: `${20 + i * 15}%`,
                  y: `${30 + i * 10}%`,
                }}
                animate={{ 
                  opacity: [0, 0.3, 0.3, 0],
                  x: [`${20 + i * 15}%`, `${25 + i * 15}%`],
                  y: [`${30 + i * 10}%`, `${20 + i * 10}%`],
                }}
                transition={{
                  duration: 8 + i,
                  delay: i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute rounded-full"
                style={{
                  width: 60 + i * 20,
                  height: 60 + i * 20,
                  background: `radial-gradient(circle, rgba(255,255,255,0.4) 0%, transparent 70%)`,
                  filter: 'blur(8px)',
                }}
              />
            ))}

            {/* Light streaks */}
            {streaks.map((streak) => (
              <motion.div
                key={`streak-${streak.id}`}
                initial={{ 
                  opacity: 0,
                  x: `${streak.x}%`,
                  y: `${streak.y}%`,
                  rotate: streak.rotation,
                }}
                animate={{ 
                  opacity: [0, 0.3, 0],
                  x: [`${streak.x}%`, `${streak.x + 10}%`],
                }}
                transition={{
                  duration: streak.duration,
                  delay: streak.delay,
                  repeat: Infinity,
                  ease: "linear",
                }}
                className="absolute bg-gradient-to-r from-transparent via-white/30 to-transparent"
                style={{
                  width: streak.length,
                  height: 1,
                }}
              />
            ))}

            {/* Corner glow effects */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.2, 0.4, 0.2] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute top-0 left-0 w-1/3 h-1/3"
              style={{
                background: 'radial-gradient(circle at top left, rgba(255,255,255,0.15) 0%, transparent 60%)',
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.15, 0.3, 0.15] }}
              transition={{ duration: 5, delay: 1, repeat: Infinity, ease: "easeInOut" }}
              className="absolute bottom-0 right-0 w-1/2 h-1/2"
              style={{
                background: 'radial-gradient(circle at bottom right, rgba(255,255,255,0.1) 0%, transparent 60%)',
              }}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
