import { memo, useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useMotionValue, useSpring } from 'framer-motion';
import { MexicoMapSVG, ContourLinesSVG } from './MexicoMapSVG';
import { LocationPin } from './LocationPin';
import { FloatingDots } from './FloatingDots';

interface ParallaxMexicoBackgroundProps {
  className?: string;
}

// City pin positions (percentage-based, centered on CDMX region for mobile)
const CITY_PINS = [
  { id: 'cdmx', x: 48, y: 52, label: 'CDMX' },
  { id: 'gdl', x: 35, y: 45, label: 'GDL' },
  { id: 'mty', x: 55, y: 30, label: 'MTY' },
];

const ParallaxMexicoBackground = memo(({ className = '' }: ParallaxMexicoBackgroundProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  
  // Tilt values for device orientation / cursor
  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const smoothTiltX = useSpring(tiltX, { stiffness: 100, damping: 30 });
  const smoothTiltY = useSpring(tiltY, { stiffness: 100, damping: 30 });
  
  // Scroll-based parallax
  const { scrollY } = useScroll();
  const parallaxY1 = useTransform(scrollY, [0, 500], [0, 30]);
  const parallaxY2 = useTransform(scrollY, [0, 500], [0, 50]);
  const parallaxY3 = useTransform(scrollY, [0, 500], [0, 20]);
  
  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);
  
  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Disable tilt during scroll to prevent jitter
  useEffect(() => {
    let scrollTimeout: NodeJS.Timeout;
    
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => setIsScrolling(false), 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, []);
  
  // Device orientation for mobile tilt (only when not scrolling)
  useEffect(() => {
    if (reducedMotion || !isMobile) return;
    
    const handleOrientation = (e: DeviceOrientationEvent) => {
      if (isScrolling) return;
      const x = Math.max(-15, Math.min(15, (e.gamma || 0) * 0.3));
      const y = Math.max(-15, Math.min(15, (e.beta || 0) * 0.2 - 10));
      tiltX.set(x);
      tiltY.set(y);
    };
    
    // Request permission on iOS
    if (typeof DeviceOrientationEvent !== 'undefined' && 
        typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
      // Will be triggered by user interaction elsewhere
    } else {
      window.addEventListener('deviceorientation', handleOrientation);
    }
    
    return () => window.removeEventListener('deviceorientation', handleOrientation);
  }, [reducedMotion, isMobile, isScrolling, tiltX, tiltY]);
  
  // Desktop cursor-based tilt (only when not scrolling)
  useEffect(() => {
    if (reducedMotion || isMobile) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      if (isScrolling || !containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      
      const x = ((e.clientX - centerX) / rect.width) * 10;
      const y = ((e.clientY - centerY) / rect.height) * 10;
      
      tiltX.set(x);
      tiltY.set(y);
    };
    
    const handleMouseLeave = () => {
      tiltX.set(0);
      tiltY.set(0);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    containerRef.current?.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [reducedMotion, isMobile, isScrolling, tiltX, tiltY]);
  
  return (
    <div 
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Layer 1: Base gradient mesh */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(221,83%,35%)]" />
      
      {/* Layer 2: Radial overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_60%_40%,transparent_0%,rgba(0,0,0,0.15)_100%)]" />
      
      {/* Layer 3: Contour lines with parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ 
          y: reducedMotion ? 0 : parallaxY3,
          x: reducedMotion ? 0 : smoothTiltX,
        }}
      >
        <ContourLinesSVG className="w-full h-full" opacity={0.04} />
      </motion.div>
      
      {/* Layer 4: Mexico silhouette with parallax */}
      <motion.div 
        className="absolute inset-0"
        style={{ 
          y: reducedMotion ? 0 : parallaxY1,
          x: reducedMotion ? 0 : smoothTiltX,
          rotateY: reducedMotion ? 0 : smoothTiltX,
          rotateX: reducedMotion ? 0 : smoothTiltY,
        }}
      >
        <MexicoMapSVG 
          className={`w-full h-full ${isMobile ? 'scale-150 translate-x-[10%]' : 'scale-110'}`} 
          opacity={isMobile ? 0.12 : 0.1} 
        />
      </motion.div>
      
      {/* Layer 5: Floating dots for depth */}
      <motion.div 
        className="absolute inset-0"
        style={{ y: reducedMotion ? 0 : parallaxY2 }}
      >
        <FloatingDots reducedMotion={reducedMotion} />
      </motion.div>
      
      {/* Layer 6: Location pins with safe zone positioning */}
      <motion.div 
        className="absolute inset-0"
        style={{ 
          y: reducedMotion ? 0 : parallaxY1,
          x: reducedMotion ? 0 : smoothTiltX,
        }}
      >
        {CITY_PINS.map((pin, i) => (
          <LocationPin
            key={pin.id}
            x={isMobile ? pin.x + 5 : pin.x}
            y={isMobile ? pin.y + 15 : pin.y} // Push pins lower on mobile to avoid headline
            label={pin.label}
            delay={i * 0.3}
            reducedMotion={reducedMotion}
          />
        ))}
      </motion.div>
      
      {/* Subtle vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.2)_100%)]" />
    </div>
  );
});

ParallaxMexicoBackground.displayName = 'ParallaxMexicoBackground';

export default ParallaxMexicoBackground;
