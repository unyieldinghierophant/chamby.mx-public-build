import { useState, useEffect, useCallback, memo, useRef } from 'react';

interface JobDot {
  id: number;
  x: number;
  y: number;
  opacity: number;
  scale: number;
}

interface FloatingCard {
  id: number;
  x: number;
  y: number;
  service: string;
  price: string;
  city: string;
  opacity: number;
}

const JOB_TYPES = [
  { service: 'Plomería', price: '$1,200', cities: ['Guadalajara', 'Zapopan', 'Tlaquepaque'] },
  { service: 'Electricista', price: '$850', cities: ['CDMX', 'Monterrey', 'Puebla'] },
  { service: 'Limpieza', price: '$600', cities: ['Guadalajara', 'León', 'Querétaro'] },
  { service: 'Mudanza', price: '$2,500', cities: ['CDMX', 'Guadalajara', 'Monterrey'] },
  { service: 'Pintura', price: '$1,800', cities: ['Zapopan', 'Tlajomulco', 'Tonalá'] },
  { service: 'Jardinería', price: '$450', cities: ['Guadalajara', 'Zapopan', 'Tlaquepaque'] },
  { service: 'Carpintería', price: '$1,500', cities: ['CDMX', 'Guadalajara', 'Querétaro'] },
  { service: 'Herrería', price: '$2,200', cities: ['Monterrey', 'León', 'Puebla'] },
];

// Mexico map SVG path (simplified outline)
const MexicoMapPath = memo(({ opacity }: { opacity: number }) => (
  <svg
    viewBox="0 0 800 500"
    className="absolute inset-0 w-full h-full transition-opacity duration-500"
    style={{ opacity }}
    preserveAspectRatio="xMidYMid slice"
  >
    <defs>
      <linearGradient id="mapGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="rgba(255,255,255,0.3)" />
        <stop offset="100%" stopColor="rgba(255,255,255,0.1)" />
      </linearGradient>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
        <feMerge>
          <feMergeNode in="coloredBlur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
    </defs>
    <path
      d="M150,150 Q180,120 220,130 L280,100 Q320,90 360,95 L420,110 Q480,120 520,140 L580,160 Q620,180 640,220 L660,280 Q670,340 650,380 L620,420 Q580,450 520,460 L460,440 Q420,430 380,400 L340,360 Q300,340 260,350 L200,380 Q160,400 140,360 L120,300 Q110,240 130,200 L150,150 Z"
      fill="url(#mapGradient)"
      stroke="rgba(255,255,255,0.25)"
      strokeWidth="1.5"
      filter="url(#glow)"
    />
    {/* Baja California */}
    <path
      d="M80,100 Q100,80 120,90 L140,130 Q150,180 130,220 L100,250 Q80,230 70,200 L60,150 Q70,120 80,100 Z"
      fill="url(#mapGradient)"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="1"
      filter="url(#glow)"
    />
    {/* Yucatan */}
    <path
      d="M580,320 Q620,300 660,310 L700,340 Q720,370 700,400 L660,420 Q620,430 590,410 L570,370 Q560,340 580,320 Z"
      fill="url(#mapGradient)"
      stroke="rgba(255,255,255,0.2)"
      strokeWidth="1"
      filter="url(#glow)"
    />
  </svg>
));

MexicoMapPath.displayName = 'MexicoMapPath';

// Grid pattern component
const GridPattern = memo(() => (
  <div 
    className="absolute inset-0 opacity-[0.03]"
    style={{
      backgroundImage: `
        linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
      `,
      backgroundSize: '60px 60px',
    }}
  />
));

GridPattern.displayName = 'GridPattern';

// Single glowing dot component with parallax
const GlowingDot = memo(({ dot, parallaxOffset, baseOpacity }: { dot: JobDot; parallaxOffset: number; baseOpacity: number }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${dot.x}%`,
      top: `${dot.y}%`,
      opacity: dot.opacity * baseOpacity,
      transform: `scale(${dot.scale}) translateY(${parallaxOffset * 0.3}px)`,
      transition: 'opacity 1.5s ease-in-out, transform 0.5s ease-out',
      willChange: 'opacity, transform',
    }}
  >
    {/* Outer glow */}
    <div className="absolute -inset-3 bg-white/20 rounded-full blur-md" />
    {/* Inner bright dot */}
    <div className="relative w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
  </div>
));

GlowingDot.displayName = 'GlowingDot';

// Floating job card component with parallax
const FloatingJobCard = memo(({ card, parallaxOffset, baseOpacity, isMobile }: { card: FloatingCard; parallaxOffset: number; baseOpacity: number; isMobile: boolean }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${card.x}%`,
      top: `${card.y}%`,
      opacity: card.opacity * baseOpacity,
      transform: `translate(-50%, -50%) translateY(${parallaxOffset * 0.4}px)`,
      transition: 'opacity 1s ease-in-out, transform 0.3s ease-out',
      willChange: 'opacity, transform',
    }}
  >
    <div className={`relative flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg ${isMobile ? 'px-2 py-1.5' : 'px-3 py-2'}`}>
      {/* Yellow indicator dot */}
      <div className={`bg-yellow-400 rounded-full shadow-[0_0_6px_rgba(250,204,21,0.6)] ${isMobile ? 'w-1.5 h-1.5' : 'w-2 h-2'}`} />
      <div className={`text-white font-medium whitespace-nowrap ${isMobile ? 'text-xs' : 'text-sm'}`}>
        {card.service} · <span className="text-white/90">{card.price}</span>
      </div>
      <div className={`text-white/60 ${isMobile ? 'text-[10px]' : 'text-xs'}`}>{card.city}</div>
    </div>
  </div>
));

FloatingJobCard.displayName = 'FloatingJobCard';

interface InteractiveHeroBackgroundProps {
  onJobCardVisible?: (visible: boolean) => void;
  scrollY?: number;
  parallaxOffset?: number;
  dotOpacity?: number;
  cardOpacity?: number;
  mapOpacity?: number;
}

const InteractiveHeroBackground = ({ 
  onJobCardVisible,
  scrollY = 0,
  parallaxOffset = 0,
  dotOpacity = 0.6,
  cardOpacity = 0.5,
  mapOpacity = 0.2
}: InteractiveHeroBackgroundProps) => {
  const [dots, setDots] = useState<JobDot[]>([]);
  const [cards, setCards] = useState<FloatingCard[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [dotIdCounter, setDotIdCounter] = useState(0);
  const [cardIdCounter, setCardIdCounter] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Generate random position within safe bounds
  const getRandomPosition = useCallback(() => ({
    x: 15 + Math.random() * 70, // 15-85% horizontal
    y: 25 + Math.random() * 50, // 25-75% vertical
  }), []);

  // Add a new dot with smoother animation
  const addDot = useCallback(() => {
    const pos = getRandomPosition();
    const newDot: JobDot = {
      id: dotIdCounter,
      x: pos.x,
      y: pos.y,
      opacity: 0,
      scale: 0.5,
    };
    
    setDotIdCounter(prev => prev + 1);
    setDots(prev => [...prev.slice(-15), newDot]); // Keep max 15 dots
    
    // Fade in with requestAnimationFrame for smoother rendering
    setTimeout(() => {
      requestAnimationFrame(() => {
        setDots(prev => 
          prev.map(d => d.id === newDot.id ? { ...d, opacity: 1, scale: 1 } : d)
        );
      });
    }, 150); // Increased from 50ms to 150ms
    
    // Fade out after 3-6 seconds
    const fadeOutTime = 3000 + Math.random() * 3000;
    setTimeout(() => {
      requestAnimationFrame(() => {
        setDots(prev => 
          prev.map(d => d.id === newDot.id ? { ...d, opacity: 0, scale: 0.5 } : d)
        );
      });
    }, fadeOutTime);
    
    // Remove after fade out
    setTimeout(() => {
      setDots(prev => prev.filter(d => d.id !== newDot.id));
    }, fadeOutTime + 1500);
  }, [dotIdCounter, getRandomPosition]);

  // Add a floating card with smoother animation
  const addCard = useCallback(() => {
    const jobType = JOB_TYPES[Math.floor(Math.random() * JOB_TYPES.length)];
    const city = jobType.cities[Math.floor(Math.random() * jobType.cities.length)];
    const pos = getRandomPosition();
    
    const newCard: FloatingCard = {
      id: cardIdCounter,
      x: pos.x,
      y: pos.y,
      service: jobType.service,
      price: jobType.price,
      city,
      opacity: 0,
    };
    
    setCardIdCounter(prev => prev + 1);
    setCards(prev => {
      // Max 2 cards at a time (1 on mobile)
      const maxCards = isMobile ? 1 : 2;
      const newCards = prev.length >= maxCards ? prev.slice(1) : prev;
      return [...newCards, newCard];
    });
    
    // Notify parent that a card is visible
    onJobCardVisible?.(true);
    
    // Fade in with requestAnimationFrame for smoother rendering
    setTimeout(() => {
      requestAnimationFrame(() => {
        setCards(prev => 
          prev.map(c => c.id === newCard.id ? { ...c, opacity: 1 } : c)
        );
      });
    }, 150); // Increased from 50ms to 150ms
    
    // Fade out after 2.5 seconds
    setTimeout(() => {
      requestAnimationFrame(() => {
        setCards(prev => 
          prev.map(c => c.id === newCard.id ? { ...c, opacity: 0 } : c)
        );
      });
    }, 2500);
    
    // Remove after fade out
    setTimeout(() => {
      setCards(prev => {
        const filtered = prev.filter(c => c.id !== newCard.id);
        if (filtered.length === 0) {
          onJobCardVisible?.(false);
        }
        return filtered;
      });
    }, 3300);
  }, [cardIdCounter, getRandomPosition, onJobCardVisible, isMobile]);

  // Use refs to avoid interval recreation
  const addDotRef = useRef(addDot);
  const addCardRef = useRef(addCard);
  
  useEffect(() => {
    addDotRef.current = addDot;
    addCardRef.current = addCard;
  });

  // Initialize dots and set up intervals with stable refs
  useEffect(() => {
    // Add initial dots (fewer on mobile)
    const initialCount = isMobile ? 4 : 8;
    const initialDots = Array.from({ length: initialCount }, (_, i) => {
      const pos = getRandomPosition();
      return {
        id: i,
        x: pos.x,
        y: pos.y,
        opacity: 0.4 + Math.random() * 0.3, // Start more subtle
        scale: 0.8 + Math.random() * 0.4,
      };
    });
    setDots(initialDots);
    setDotIdCounter(initialCount);

    // Add new dots every 3-5 seconds (slower on mobile) - use refs for stable intervals
    const dotIntervalTime = isMobile ? 4000 + Math.random() * 2000 : 2500 + Math.random() * 1500;
    const dotInterval = setInterval(() => {
      addDotRef.current();
    }, dotIntervalTime);

    // Add new cards every 5-7 seconds (slower intervals) - use refs for stable intervals
    const cardIntervalTime = isMobile ? 6000 + Math.random() * 2000 : 4500 + Math.random() * 1500;
    const cardInterval = setInterval(() => {
      addCardRef.current();
    }, cardIntervalTime);

    // Initial card after 2 seconds (delayed start)
    const initialCardTimeout = setTimeout(() => {
      addCardRef.current();
    }, 2000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(cardInterval);
      clearTimeout(initialCardTimeout);
    };
  }, [getRandomPosition, isMobile]); // Removed addDot and addCard from deps

  return (
    <div 
      className="absolute inset-0 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Deep blue gradient base */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(221,83%,40%)]" />
      
      {/* Subtle radial overlay for depth */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]" />
      
      {/* Grid pattern */}
      <GridPattern />
      
      {/* Mexico map outline with parallax */}
      <div 
        className="absolute inset-0 transition-transform duration-100"
        style={{ transform: `translateY(${parallaxOffset * 0.2}px)` }}
      >
        <MexicoMapPath opacity={mapOpacity} />
      </div>
      
      {/* Glowing dots layer with parallax */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: isHovered ? 1 : 0.85 }}
      >
        {dots.map(dot => (
          <GlowingDot 
            key={dot.id} 
            dot={dot} 
            parallaxOffset={parallaxOffset}
            baseOpacity={dotOpacity}
          />
        ))}
      </div>
      
      {/* Floating job cards layer with parallax */}
      <div className="absolute inset-0">
        {cards.map(card => (
          <FloatingJobCard 
            key={card.id} 
            card={card}
            parallaxOffset={parallaxOffset}
            baseOpacity={cardOpacity}
            isMobile={isMobile}
          />
        ))}
      </div>
      
      {/* Subtle vignette for focus */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.15)_100%)]" />
      
      {/* Bottom gradient transition */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
    </div>
  );
};

export default InteractiveHeroBackground;
