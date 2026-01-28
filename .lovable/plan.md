
## Enlarge Jalisco Map to Envelop Hero Section

### Problem
The current Jalisco silhouette is barely visible - appearing as just a small white dot (the Guadalajara pin). The SVG path is too small relative to the viewBox and the opacity is very low.

### Solution
Scale up the Jalisco map significantly so it envelops/wraps around the entire hero section as a prominent background element, while keeping text readable.

---

### Changes to `src/components/ParallaxJaliscoBackground.tsx`

**1. Scale up the SVG path using a transform**

Apply a scale transform to make the Jalisco silhouette 2-2.5x larger and reposition it to wrap around the content:

```tsx
// Current viewBox: "0 0 400 420"
// New approach: Use a larger viewBox and scale/translate the path

const JaliscoSilhouette = memo(({ y, isMobile }: { y: MotionValue<number>; isMobile: boolean }) => (
  <motion.svg
    viewBox="0 0 400 420"
    className="absolute w-[200%] h-[200%] -left-1/2 -top-1/4"
    preserveAspectRatio="xMidYMid meet"
    style={{ y }}
  >
    <path
      d={JALISCO_PATH}
      transform="translate(-50, -50) scale(1.2)"  // Scale up and recenter
      fill="url(#jaliscoGradient)"
      stroke="rgba(255,255,255,0.18)"
      strokeWidth="2"
      className="opacity-[0.15]"  // Increased from 0.10
    />
  </motion.svg>
));
```

**2. Increase opacity for visibility**

| Element | Current | New |
|---------|---------|-----|
| Jalisco fill gradient | 6-15% white | 10-20% white |
| Jalisco stroke | 12% white | 18-25% white |
| Path opacity class | `opacity-[0.10]` | `opacity-[0.18]` |
| Contour lines | `opacity-[0.03]` | `opacity-[0.06]` |

**3. Make SVG overflow the container**

Instead of constraining to `inset-0`, make the SVG larger than the container:

```tsx
// Desktop: 180% width/height, offset to center
// Mobile: 200% width/height, offset to center on GDL region

<motion.svg
  viewBox="0 0 400 420"
  className={cn(
    "absolute pointer-events-none",
    isMobile 
      ? "w-[250%] h-[250%] -left-[75%] -top-[40%]"  // Mobile: larger, centered on GDL
      : "w-[180%] h-[180%] -left-[40%] -top-[20%]"  // Desktop: wrap around
  )}
  preserveAspectRatio="xMidYMid meet"
  style={{ y }}
>
```

**4. Adjust Guadalajara pin position**

Move pin relative to the enlarged map so it stays in the correct geographic position:

```tsx
const GuadalajaraPin = memo(({ prefersReducedMotion, isMobile }) => (
  <div 
    className="absolute z-20"
    style={{ 
      // Position relative to enlarged map
      left: isMobile ? '55%' : '52%', 
      top: isMobile ? '48%' : '45%', 
      transform: 'translate(-50%, -50%)' 
    }}
  >
```

**5. Update gradient for better contrast**

```tsx
<defs>
  <linearGradient id="jaliscoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stopColor="rgba(255,255,255,0.22)" />  // Was 0.15
    <stop offset="50%" stopColor="rgba(255,255,255,0.12)" />
    <stop offset="100%" stopColor="rgba(255,255,255,0.08)" />  // Was 0.06
  </linearGradient>
</defs>
```

**6. Add subtle glow/shadow to make shape more visible**

```tsx
<filter id="jaliscoGlow">
  <feGaussianBlur stdDeviation="8" result="blur" />  // Increased from 3
  <feFlood floodColor="rgba(255,255,255,0.1)" />
  <feComposite in2="blur" operator="in" />
  <feMerge>
    <feMergeNode />
    <feMergeNode in="SourceGraphic" />
  </feMerge>
</filter>
```

---

### Visual Result

```text
┌─────────────────────────────────────────┐
│     ╭──────────────────────╮            │
│   ╭─╯  JALISCO SILHOUETTE  ╰──╮         │
│  ╭╯    (faded, 18% opacity)    ╰╮       │
│ ╭╯  ┌────────────────────┐      ╰╮      │
│╭╯   │   SERVICIOS DEL    │       ╰╮     │
││    │   HOGAR FUERA      │  •GDL  │     │
│╰╮   │   DE ESTE MUNDO    │       ╭╯     │
│ ╰╮  │   [Search Bar]     │      ╭╯      │
│  ╰╮ │   [CTA Button]     │     ╭╯       │
│   ╰─┤────────────────────┤───╭╯         │
│     ╰────────────────────╯               │
└─────────────────────────────────────────┘
```

The map now wraps around the glass card content, creating a sense of place while maintaining text readability.

---

### Summary of Changes

| File | Changes |
|------|---------|
| `ParallaxJaliscoBackground.tsx` | Scale SVG to 180-250%, increase opacity to 15-20%, enhance glow filter, reposition pin |

---

### Technical Notes

- SVG uses percentage-based positioning (`w-[180%] -left-[40%]`) to overflow container
- Parent container keeps `overflow-hidden` on the rounded card to clip edges nicely
- Glass card in Hero.tsx remains unchanged - already provides good text contrast
- Pin repositioned to match new map scale
- All changes respect `prefers-reduced-motion`
