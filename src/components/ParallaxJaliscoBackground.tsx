import { memo, useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, MotionValue } from 'framer-motion';
import Tilt from 'react-parallax-tilt';

interface ParallaxJaliscoBackgroundProps {
  className?: string;
}

// Accurate Jalisco state silhouette SVG path (simplified from INEGI data)
const JALISCO_PATH = `M245,45 L270,48 L295,55 L320,68 L342,85 L358,108 L368,135 L372,165 L370,195 L362,225 L350,255 L335,282 L315,308 L290,330 L262,348 L230,362 L195,370 L160,372 L128,368 L98,358 L72,342 L52,320 L38,295 L30,268 L28,240 L32,212 L42,185 L58,160 L78,138 L102,120 L128,105 L155,92 L183,82 L210,72 L238,58 L245,45 Z`;

// Jalisco silhouette layer - enlarged to wrap around hero
const JaliscoSilhouette = memo(({ y, isMobile }: { y: MotionValue<number>; isMobile: boolean }) => (
  <motion.svg
    viewBox="0 0 400 420"
    className={
      isMobile 
        ? "absolute w-[280%] h-[280%] -left-[90%] -top-[50%] pointer-events-none"
        : "absolute w-[200%] h-[200%] -left-[50%] -top-[25%] pointer-events-none"
    }
    preserveAspectRatio="xMidYMid meet"
    style={{ y }}
  >
    <defs>
      <linearGradient id="jaliscoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
      </linearGradient>
      <filter id="jaliscoGlow">
        <feGaussianBlur stdDeviation="6" result="blur" />
        <feFlood floodColor="rgba(255,255,255,0.08)" />
        <feComposite in2="blur" operator="in" result="glow" />
        <feMerge>
          <feMergeNode in="glow" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
    <path
      d={JALISCO_PATH}
      fill="url(#jaliscoGradient)"
      stroke="rgba(255,255,255,0.20)"
      strokeWidth="2"
      filter="url(#jaliscoGlow)"
      className="opacity-[0.22]"
    />
  </motion.svg>
));

JaliscoSilhouette.displayName = 'JaliscoSilhouette';

// Contour lines layer - enlarged to match silhouette
const ContourLines = memo(({ y, isMobile }: { y: MotionValue<number>; isMobile: boolean }) => (
  <motion.svg
    viewBox="0 0 400 420"
    className={
      isMobile 
        ? "absolute w-[280%] h-[280%] -left-[90%] -top-[50%] opacity-[0.06] pointer-events-none"
        : "absolute w-[200%] h-[200%] -left-[50%] -top-[25%] opacity-[0.06] pointer-events-none"
    }
    preserveAspectRatio="xMidYMid meet"
    style={{ y }}
  >
    {/* Organic contour ellipses centered around Guadalajara region */}
    <ellipse cx="200" cy="220" rx="60" ry="45" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 6" />
    <ellipse cx="200" cy="220" rx="100" ry="75" fill="none" stroke="white" strokeWidth="0.7" strokeDasharray="6 8" />
    <ellipse cx="200" cy="220" rx="150" ry="110" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="8 12" />
    {/* Additional organic blob */}
    <path
      d="M120,180 Q160,150 200,160 Q240,170 260,200 Q280,240 260,280 Q230,310 190,300 Q150,290 130,250 Q110,210 120,180 Z"
      fill="none"
      stroke="white"
      strokeWidth="0.6"
      strokeDasharray="5 10"
    />
  </motion.svg>
));

ContourLines.displayName = 'ContourLines';

// Guadalajara pin with teardrop marker, float animation, ripple, and tooltip
const GuadalajaraPin = memo(({ prefersReducedMotion, isMobile }: { prefersReducedMotion: boolean; isMobile: boolean }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleInteraction = () => {
    if (isMobile) {
      setShowTooltip(prev => !prev);
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setShowTooltip(prev => !prev);
    }
  };
  
  return (
    <div 
      className="absolute z-20 cursor-pointer outline-none"
      style={{ 
        left: isMobile ? '52%' : '50%', 
        top: isMobile ? '52%' : '48%', 
        transform: 'translate(-50%, -50%)' 
      }}
      onClick={handleInteraction}
      onMouseEnter={() => !isMobile && setShowTooltip(true)}
      onMouseLeave={() => !isMobile && setShowTooltip(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Guadalajara location marker"
      aria-expanded={showTooltip}
    >
      <svg 
        viewBox="0 0 60 80" 
        className="w-10 h-14 md:w-12 md:h-16"
        aria-hidden="true"
      >
        <defs>
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>
        
        {/* Ripple circles - multiple for continuous effect */}
        {!prefersReducedMotion && (
          <>
            <circle 
              cx="30" cy="60" r="15"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
              className="pin-ripple"
            />
            <circle 
              cx="30" cy="60" r="15"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1.5"
              className="pin-ripple-delayed"
            />
          </>
        )}
        
        {/* Teardrop marker with float animation */}
        <g className={prefersReducedMotion ? '' : 'pin-float'}>
          <path
            d="M30,8 C30,8 12,30 12,43 C12,54 20,62 30,62 C40,62 48,54 48,43 C48,30 30,8 30,8 Z"
            fill="#FACC15"
            filter="url(#pinShadow)"
          />
          {/* White center dot */}
          <circle cx="30" cy="45" r="5" fill="white" />
        </g>
      </svg>
      
      {/* Tooltip - glass pill */}
      <div 
        className={`
          absolute top-full left-1/2 -translate-x-1/2 mt-2
          px-3 py-1.5 rounded-full
          bg-white/15 backdrop-blur-md border border-white/25
          text-white text-sm font-medium whitespace-nowrap
          shadow-lg transition-all duration-200
          ${showTooltip ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-1 pointer-events-none'}
        `}
      >
        Guadalajara
      </div>
    </div>
  );
});

GuadalajaraPin.displayName = 'GuadalajaraPin';

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

// Static versions for reduced motion - enlarged
const StaticJaliscoSilhouette = memo(({ isMobile }: { isMobile: boolean }) => (
  <svg
    viewBox="0 0 400 420"
    className={
      isMobile 
        ? "absolute w-[280%] h-[280%] -left-[90%] -top-[50%] pointer-events-none"
        : "absolute w-[200%] h-[200%] -left-[50%] -top-[25%] pointer-events-none"
    }
    preserveAspectRatio="xMidYMid meet"
  >
    <defs>
      <linearGradient id="jaliscoGradientStatic" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.25)" />
        <stop offset="50%" stopColor="rgba(255,255,255,0.15)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.10)" />
      </linearGradient>
    </defs>
    <path
      d={JALISCO_PATH}
      fill="url(#jaliscoGradientStatic)"
      stroke="rgba(255,255,255,0.20)"
      strokeWidth="2"
      className="opacity-[0.22]"
    />
  </svg>
));

StaticJaliscoSilhouette.displayName = 'StaticJaliscoSilhouette';

const StaticContourLines = memo(({ isMobile }: { isMobile: boolean }) => (
  <svg
    viewBox="0 0 400 420"
    className={
      isMobile 
        ? "absolute w-[280%] h-[280%] -left-[90%] -top-[50%] opacity-[0.06] pointer-events-none"
        : "absolute w-[200%] h-[200%] -left-[50%] -top-[25%] opacity-[0.06] pointer-events-none"
    }
    preserveAspectRatio="xMidYMid meet"
  >
    <ellipse cx="200" cy="220" rx="60" ry="45" fill="none" stroke="white" strokeWidth="1" strokeDasharray="4 6" />
    <ellipse cx="200" cy="220" rx="100" ry="75" fill="none" stroke="white" strokeWidth="0.7" strokeDasharray="6 8" />
    <ellipse cx="200" cy="220" rx="150" ry="110" fill="none" stroke="white" strokeWidth="0.5" strokeDasharray="8 12" />
  </svg>
));

StaticContourLines.displayName = 'StaticContourLines';

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
  const jaliscoY = useTransform(scrollY, [0, 500], [0, 50]);
  const contourY = useTransform(scrollY, [0, 500], [0, 30]);
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
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,hsl(221,83%,55%)_0%,transparent_50%)] opacity-30" />
        <GridMesh />
        <StaticJaliscoSilhouette isMobile={isMobile} />
        <StaticContourLines isMobile={isMobile} />
        <GuadalajaraPin prefersReducedMotion={true} isMobile={isMobile} />
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
        {/* Layer A: Gradient/mesh background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(221,83%,38%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,hsl(221,83%,55%)_0%,transparent_50%)] opacity-30" />
        <GridMesh />
        
        {/* Layer B: Jalisco silhouette */}
        <JaliscoSilhouette y={jaliscoY} isMobile={isMobile} />
        
        {/* Layer C: Contour lines */}
        <ContourLines y={contourY} isMobile={isMobile} />
        
        {/* Layer D: Guadalajara pin */}
        <GuadalajaraPin prefersReducedMotion={false} isMobile={isMobile} />
        
        {/* Layer E: Floating dots */}
        <FloatingDots y={dotsY} opacity={dotsOpacity} />
        
        {/* Subtle vignette for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.2)_100%)]" />
      </Tilt>
    </div>
  );
});

ParallaxJaliscoBackground.displayName = 'ParallaxJaliscoBackground';

export default ParallaxJaliscoBackground;
