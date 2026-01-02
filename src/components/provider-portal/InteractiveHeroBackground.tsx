import { useState, useEffect, useCallback, memo } from 'react';

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
const MexicoMapPath = memo(() => (
  <svg
    viewBox="0 0 800 500"
    className="absolute inset-0 w-full h-full opacity-20"
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

// Single glowing dot component
const GlowingDot = memo(({ dot }: { dot: JobDot }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${dot.x}%`,
      top: `${dot.y}%`,
      opacity: dot.opacity,
      transform: `scale(${dot.scale})`,
      transition: 'opacity 1.5s ease-in-out, transform 0.5s ease-out',
    }}
  >
    {/* Outer glow */}
    <div className="absolute -inset-3 bg-white/20 rounded-full blur-md" />
    {/* Inner bright dot */}
    <div className="relative w-2 h-2 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.8)]" />
  </div>
));

GlowingDot.displayName = 'GlowingDot';

// Floating job card component
const FloatingJobCard = memo(({ card }: { card: FloatingCard }) => (
  <div
    className="absolute pointer-events-none"
    style={{
      left: `${card.x}%`,
      top: `${card.y}%`,
      opacity: card.opacity,
      transform: 'translate(-50%, -50%)',
      transition: 'opacity 0.8s ease-in-out',
    }}
  >
    <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/20 shadow-lg">
      {/* Yellow indicator dot */}
      <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_6px_rgba(250,204,21,0.6)]" />
      <div className="text-white text-sm font-medium whitespace-nowrap">
        {card.service} · <span className="text-white/90">{card.price}</span>
      </div>
      <div className="text-white/60 text-xs">{card.city}</div>
    </div>
  </div>
));

FloatingJobCard.displayName = 'FloatingJobCard';

interface InteractiveHeroBackgroundProps {
  onJobCardVisible?: (visible: boolean) => void;
}

const InteractiveHeroBackground = ({ onJobCardVisible }: InteractiveHeroBackgroundProps) => {
  const [dots, setDots] = useState<JobDot[]>([]);
  const [cards, setCards] = useState<FloatingCard[]>([]);
  const [isHovered, setIsHovered] = useState(false);
  const [dotIdCounter, setDotIdCounter] = useState(0);
  const [cardIdCounter, setCardIdCounter] = useState(0);

  // Generate random position within safe bounds
  const getRandomPosition = useCallback(() => ({
    x: 15 + Math.random() * 70, // 15-85% horizontal
    y: 25 + Math.random() * 50, // 25-75% vertical
  }), []);

  // Add a new dot
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
    
    // Fade in
    setTimeout(() => {
      setDots(prev => 
        prev.map(d => d.id === newDot.id ? { ...d, opacity: 1, scale: 1 } : d)
      );
    }, 50);
    
    // Fade out after 3-6 seconds
    const fadeOutTime = 3000 + Math.random() * 3000;
    setTimeout(() => {
      setDots(prev => 
        prev.map(d => d.id === newDot.id ? { ...d, opacity: 0, scale: 0.5 } : d)
      );
    }, fadeOutTime);
    
    // Remove after fade out
    setTimeout(() => {
      setDots(prev => prev.filter(d => d.id !== newDot.id));
    }, fadeOutTime + 1500);
  }, [dotIdCounter, getRandomPosition]);

  // Add a floating card
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
      // Max 2 cards at a time
      const newCards = prev.length >= 2 ? prev.slice(1) : prev;
      return [...newCards, newCard];
    });
    
    // Notify parent that a card is visible
    onJobCardVisible?.(true);
    
    // Fade in
    setTimeout(() => {
      setCards(prev => 
        prev.map(c => c.id === newCard.id ? { ...c, opacity: 1 } : c)
      );
    }, 50);
    
    // Fade out after 2.5 seconds
    setTimeout(() => {
      setCards(prev => 
        prev.map(c => c.id === newCard.id ? { ...c, opacity: 0 } : c)
      );
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
  }, [cardIdCounter, getRandomPosition, onJobCardVisible]);

  // Initialize dots and set up intervals
  useEffect(() => {
    // Add initial dots
    const initialDots = Array.from({ length: 8 }, (_, i) => {
      const pos = getRandomPosition();
      return {
        id: i,
        x: pos.x,
        y: pos.y,
        opacity: 0.6 + Math.random() * 0.4,
        scale: 0.8 + Math.random() * 0.4,
      };
    });
    setDots(initialDots);
    setDotIdCounter(8);

    // Add new dots every 2-4 seconds
    const dotInterval = setInterval(() => {
      addDot();
    }, 2000 + Math.random() * 2000);

    // Add new cards every 4-6 seconds
    const cardInterval = setInterval(() => {
      addCard();
    }, 4000 + Math.random() * 2000);

    // Initial card after 1 second
    const initialCardTimeout = setTimeout(() => {
      addCard();
    }, 1000);

    return () => {
      clearInterval(dotInterval);
      clearInterval(cardInterval);
      clearTimeout(initialCardTimeout);
    };
  }, [addDot, addCard, getRandomPosition]);

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
      
      {/* Mexico map outline */}
      <MexicoMapPath />
      
      {/* Glowing dots layer */}
      <div 
        className="absolute inset-0 transition-opacity duration-300"
        style={{ opacity: isHovered ? 1 : 0.85 }}
      >
        {dots.map(dot => (
          <GlowingDot key={dot.id} dot={dot} />
        ))}
      </div>
      
      {/* Floating job cards layer */}
      <div className="absolute inset-0">
        {cards.map(card => (
          <FloatingJobCard key={card.id} card={card} />
        ))}
      </div>
      
      {/* Subtle vignette for focus */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.15)_100%)]" />
    </div>
  );
};

export default InteractiveHeroBackground;
