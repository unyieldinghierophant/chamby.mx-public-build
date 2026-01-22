import { memo } from 'react';

interface MexicoMapSVGProps {
  className?: string;
  opacity?: number;
}

// Simplified Mexico silhouette SVG optimized for hero background
export const MexicoMapSVG = memo(({ className = '', opacity = 0.1 }: MexicoMapSVGProps) => (
  <svg
    viewBox="0 0 1000 600"
    className={className}
    style={{ opacity }}
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="mexicoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.15" />
        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.05" />
      </linearGradient>
      <filter id="mapBlur">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>
    
    {/* Main Mexico silhouette - simplified path */}
    <path
      d="M120,180 
         Q150,140 200,130 L260,100 Q320,85 380,90 L460,105 
         Q540,120 620,145 L700,170 Q760,195 800,240 
         L830,300 Q850,370 820,430 L780,480 
         Q720,520 640,530 L560,510 Q500,495 440,460 
         L380,420 Q320,395 270,410 L200,450 
         Q150,475 120,430 L90,360 Q75,280 100,220 L120,180 Z"
      fill="url(#mexicoGradient)"
      stroke="hsl(var(--primary))"
      strokeWidth="1"
      strokeOpacity="0.2"
    />
    
    {/* Baja California peninsula */}
    <path
      d="M60,120 Q85,95 110,105 L130,150 Q145,210 120,260 
         L85,300 Q60,275 50,240 L35,180 Q45,140 60,120 Z"
      fill="url(#mexicoGradient)"
      stroke="hsl(var(--primary))"
      strokeWidth="0.5"
      strokeOpacity="0.15"
    />
    
    {/* Yucatan peninsula */}
    <path
      d="M700,380 Q750,355 800,365 L850,400 
         Q875,435 850,475 L800,500 Q750,515 710,490 
         L680,445 Q670,410 700,380 Z"
      fill="url(#mexicoGradient)"
      stroke="hsl(var(--primary))"
      strokeWidth="0.5"
      strokeOpacity="0.15"
    />
  </svg>
));

MexicoMapSVG.displayName = 'MexicoMapSVG';

// Contour lines layer for depth
export const ContourLinesSVG = memo(({ className = '', opacity = 0.03 }: MexicoMapSVGProps) => (
  <svg
    viewBox="0 0 1000 600"
    className={className}
    style={{ opacity }}
    preserveAspectRatio="xMidYMid slice"
    aria-hidden="true"
  >
    {/* Inner contour lines */}
    <path
      d="M180,220 Q220,180 280,170 L360,150 Q440,140 520,160 L620,190 Q700,220 740,280 L760,350 Q770,410 740,460"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="1"
      strokeOpacity="0.5"
    />
    <path
      d="M220,260 Q260,220 320,210 L400,195 Q480,185 560,210 L640,245 Q700,275 730,330"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="0.5"
      strokeOpacity="0.3"
    />
    <path
      d="M280,300 Q320,270 380,260 L460,250 Q530,245 600,275 L660,310"
      fill="none"
      stroke="hsl(var(--primary))"
      strokeWidth="0.5"
      strokeOpacity="0.2"
    />
  </svg>
));

ContourLinesSVG.displayName = 'ContourLinesSVG';
