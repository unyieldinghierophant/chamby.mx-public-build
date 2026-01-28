

## Animated Guadalajara Pin - SVG Implementation

### Overview
Replace the current div-based pin with a professional SVG pin element positioned at Guadalajara's coordinates within the Jalisco silhouette. The pin will feature a teardrop marker, ripple animation, float effect, and an interactive tooltip.

---

### 1. Create New SVG Pin Component

Replace the current `GuadalajaraPin` component with an inline SVG approach:

```tsx
const GuadalajaraPin = memo(({ prefersReducedMotion, isMobile, showTooltip, onToggleTooltip }: {
  prefersReducedMotion: boolean;
  isMobile: boolean;
  showTooltip: boolean;
  onToggleTooltip: () => void;
}) => {
  // Pin will be positioned using SVG coordinates relative to the Jalisco map
  // Guadalajara location: approximately cx="200" cy="220" in the viewBox
});
```

---

### 2. SVG Pin Structure

The pin will consist of these SVG elements layered z-0 to z-20:

```tsx
<svg viewBox="0 0 60 80" className="w-12 h-16">
  {/* Ripple circle - z-0 (behind marker) */}
  <circle 
    cx="30" cy="60" r="20"
    fill="none"
    stroke="rgba(255,255,255,0.35)"
    strokeWidth="2"
    className="ripple-animation"
  />
  
  {/* Teardrop marker - z-10 */}
  <path
    d="M30,5 C30,5 10,28 10,42 C10,55 18,65 30,65 C42,65 50,55 50,42 C50,28 30,5 30,5 Z"
    fill="#FACC15"
    filter="url(#pinShadow)"
    className="marker-float-animation"
  />
  
  {/* White center dot - z-20 */}
  <circle cx="30" cy="45" r="6" fill="white" />
</svg>
```

---

### 3. Animation Keyframes (CSS)

Add these keyframes to `src/index.css`:

```css
/* Pin marker float animation */
@keyframes pinFloat {
  0%, 100% {
    transform: translateY(0) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.03);
  }
}

/* Ripple expand and fade animation */
@keyframes pinRipple {
  0% {
    transform: scale(0.6);
    opacity: 0.35;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}
```

---

### 4. Pin Component Implementation

```tsx
const GuadalajaraPin = memo(({ prefersReducedMotion, isMobile }: Props) => {
  const [showTooltip, setShowTooltip] = useState(false);
  
  const handleInteraction = () => {
    if (isMobile) {
      setShowTooltip(prev => !prev); // Toggle on tap
    }
  };
  
  return (
    <div 
      className="absolute z-20 cursor-pointer"
      style={{ 
        left: isMobile ? '52%' : '50%', 
        top: isMobile ? '52%' : '48%', 
        transform: 'translate(-50%, -50%)' 
      }}
      onClick={handleInteraction}
      onMouseEnter={() => !isMobile && setShowTooltip(true)}
      onMouseLeave={() => !isMobile && setShowTooltip(false)}
    >
      <svg 
        viewBox="0 0 60 80" 
        className="w-10 h-14 md:w-12 md:h-16"
        aria-label="Guadalajara location marker"
      >
        <defs>
          {/* Shadow filter for teardrop */}
          <filter id="pinShadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="rgba(0,0,0,0.3)" />
          </filter>
        </defs>
        
        {/* Ripple circles (multiple for continuous effect) */}
        {!prefersReducedMotion && (
          <>
            <circle 
              cx="30" cy="60" r="15"
              fill="none"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
              style={{
                animation: 'pinRipple 2s ease-out infinite',
                transformOrigin: '30px 60px'
              }}
            />
            <circle 
              cx="30" cy="60" r="15"
              fill="none"
              stroke="rgba(255,255,255,0.25)"
              strokeWidth="1.5"
              style={{
                animation: 'pinRipple 2s ease-out infinite 0.8s',
                transformOrigin: '30px 60px'
              }}
            />
          </>
        )}
        
        {/* Teardrop marker */}
        <g style={{
          animation: prefersReducedMotion ? 'none' : 'pinFloat 2s ease-in-out infinite',
          transformOrigin: '30px 35px'
        }}>
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
```

---

### 5. Accessibility Features

| Feature | Implementation |
|---------|----------------|
| `prefers-reduced-motion` | Disable all animations when enabled |
| `aria-label` | Add descriptive label to SVG |
| Keyboard focus | Add `tabIndex={0}` and `onKeyDown` handler |
| Mobile tap | Toggle tooltip on tap instead of hover |

```tsx
// Keyboard accessibility
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    setShowTooltip(prev => !prev);
  }
}}
tabIndex={0}
role="button"
aria-expanded={showTooltip}
```

---

### 6. CSS Additions to `src/index.css`

```css
/* Pin float animation - gentle bob + scale */
@keyframes pinFloat {
  0%, 100% {
    transform: translateY(0px) scale(1);
  }
  50% {
    transform: translateY(-2px) scale(1.03);
  }
}

/* Ripple expanding circle animation */
@keyframes pinRipple {
  0% {
    transform: scale(0.6);
    opacity: 0.35;
    stroke-width: 2;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
    stroke-width: 0.5;
  }
}
```

---

### 7. Layering Structure

| Layer | Element | z-index |
|-------|---------|---------|
| Map silhouette | Jalisco SVG | z-0 |
| Contours | Ellipses | z-0 |
| Ripple circles | SVG circles | z-10 |
| Teardrop marker | SVG path | z-15 |
| White dot | SVG circle | z-18 |
| Tooltip | Glass pill div | z-20 |
| Hero content | Text + CTA | z-30 |

---

### 8. Files to Modify

| File | Changes |
|------|---------|
| `src/components/ParallaxJaliscoBackground.tsx` | Replace `GuadalajaraPin` with new SVG-based component |
| `src/index.css` | Add `pinFloat` and `pinRipple` keyframe animations |

---

### Visual Result

```text
              ╭─────╮
             ╱       ╲
            │    ●    │  ← White center dot
            │         │
             ╲       ╱
              ╰──┬──╯     ← Yellow teardrop (#FACC15)
                 │           with shadow
           ○ ○ ○ │ ○ ○ ○  ← Expanding ripple circles
                 │           (fading white strokes)
                 ▼
          ┌───────────┐
          │Guadalajara│   ← Glass tooltip (on hover/tap)
          └───────────┘
```

---

### Animation Timing

| Animation | Duration | Easing | Loop |
|-----------|----------|--------|------|
| Float | 2.0s | ease-in-out | infinite |
| Scale | 2.0s | ease-in-out | infinite |
| Ripple 1 | 2.0s | ease-out | infinite |
| Ripple 2 | 2.0s (0.8s delay) | ease-out | infinite |

