import { memo, useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import Tilt from 'react-parallax-tilt';
import { cn } from '@/lib/utils';
import jaliscoMapImage from '@/assets/jalisco-map.png';

interface ParallaxJaliscoBackgroundProps {
  className?: string;
}

// Jalisco PNG image layer with parallax
const JaliscoMapImage = memo(({ y, isMobile }: { y: MotionValue<number>; isMobile: boolean }) => (
  <motion.div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    style={{ y }}
  >
    <img
      src={jaliscoMapImage}
      alt=""
      className={cn(
        "object-contain max-w-none",
        isMobile ? "w-[160%] opacity-95" : "w-[130%] opacity-90"
      )}
    />
  </motion.div>
));

JaliscoMapImage.displayName = 'JaliscoMapImage';

// Static version for reduced motion
const StaticJaliscoMapImage = memo(({ isMobile }: { isMobile: boolean }) => (
  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
    <img
      src={jaliscoMapImage}
      alt=""
      className={cn(
        "object-contain max-w-none",
        isMobile ? "w-[160%] opacity-95" : "w-[130%] opacity-90"
      )}
    />
  </div>
));

StaticJaliscoMapImage.displayName = 'StaticJaliscoMapImage';

// Floating dots for depth
const FloatingDots = memo(({ y, opacity }: { y: MotionValue<number>; opacity: MotionValue<number> }) => (
  <motion.div 
    className="absolute inset-0 pointer-events-none"
    style={{ y, opacity }}
  >
    <div className="absolute w-2 h-2 bg-white/30 rounded-full blur-[1px]" style={{ left: '22%', top: '28%' }} />
    <div className="absolute w-1.5 h-1.5 bg-white/25 rounded-full blur-[0.5px]" style={{ left: '72%', top: '38%' }} />
    <div className="absolute w-2.5 h-2.5 bg-white/20 rounded-full blur-[1px]" style={{ left: '32%', top: '72%' }} />
    <div className="absolute w-1 h-1 bg-white/35 rounded-full" style={{ left: '65%', top: '22%' }} />
    <div className="absolute w-1.5 h-1.5 bg-white/25 rounded-full blur-[0.5px]" style={{ left: '18%', top: '55%' }} />
    <div className="absolute w-1 h-1 bg-white/30 rounded-full" style={{ left: '78%', top: '65%' }} />
  </motion.div>
));

FloatingDots.displayName = 'FloatingDots';

// Grid mesh pattern
const GridMesh = memo(() => (
  <div 
    className="absolute inset-0 opacity-[0.025]"
    style={{
      backgroundImage: `
        radial-gradient(circle at 25% 25%, rgba(255,255,255,0.8) 1px, transparent 1px),
        radial-gradient(circle at 75% 75%, rgba(255,255,255,0.5) 1px, transparent 1px)
      `,
      backgroundSize: '48px 48px, 32px 32px',
    }}
  />
));

GridMesh.displayName = 'GridMesh';

const StaticFloatingDots = memo(() => (
  <div className="absolute inset-0 pointer-events-none opacity-[0.15]">
    <div className="absolute w-2 h-2 bg-white/30 rounded-full blur-[1px]" style={{ left: '22%', top: '28%' }} />
    <div className="absolute w-1.5 h-1.5 bg-white/25 rounded-full blur-[0.5px]" style={{ left: '72%', top: '38%' }} />
    <div className="absolute w-2.5 h-2.5 bg-white/20 rounded-full blur-[1px]" style={{ left: '32%', top: '72%' }} />
    <div className="absolute w-1 h-1 bg-white/35 rounded-full" style={{ left: '65%', top: '22%' }} />
  </div>
));

StaticFloatingDots.displayName = 'StaticFloatingDots';

const ParallaxJaliscoBackground = memo(({ className }: ParallaxJaliscoBackgroundProps) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll-based parallax with framer-motion
  const { scrollY } = useScroll();
  
  // Different parallax speeds for each layer
  const mapY = useTransform(scrollY, [0, 500], [0, 40]);
  const dotsY = useTransform(scrollY, [0, 500], [0, 80]);
  const dotsOpacity = useTransform(scrollY, [0, 300], [0.15, 0.05]);

  // Detect reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
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

  // Detect scrolling to disable tilt during scroll (prevents jitter)
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true);
      clearTimeout(scrollTimeoutRef.current);
      scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 150);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(scrollTimeoutRef.current);
    };
  }, []);

  // Calculate tilt angles (disabled during scroll or with reduced motion)
  const tiltEnabled = !prefersReducedMotion && !isScrolling;
  const maxTiltAngle = tiltEnabled ? 8 : 0;

  // Render static version for reduced motion
  if (prefersReducedMotion) {
    return (
      <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className || ''}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(221,83%,38%)]" />
        <GridMesh />
        <StaticJaliscoMapImage isMobile={isMobile} />
        <StaticFloatingDots />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.2)_100%)]" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`absolute inset-0 overflow-hidden ${className || ''}`}>
      <Tilt
        tiltMaxAngleX={maxTiltAngle}
        tiltMaxAngleY={maxTiltAngle}
        gyroscope={true}
        perspective={1200}
        transitionSpeed={400}
        className="w-full h-full"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Layer A: Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(221,83%,38%)]" />
        
        {/* Layer B: Grid mesh */}
        <GridMesh />
        
        {/* Layer C: Jalisco map PNG */}
        <JaliscoMapImage y={mapY} isMobile={isMobile} />
        
        {/* Layer D: Floating dots */}
        <FloatingDots y={dotsY} opacity={dotsOpacity} />
        
        {/* Subtle vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.2)_100%)]" />
      </Tilt>
    </div>
  );
});

ParallaxJaliscoBackground.displayName = 'ParallaxJaliscoBackground';

export default ParallaxJaliscoBackground;
