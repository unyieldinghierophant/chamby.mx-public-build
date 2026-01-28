

## Use Jalisco PNG Image as Hero Background

### Overview
Replace the current SVG-based Jalisco silhouette with the uploaded PNG image (`jalisco_chamby.png`). This is a temporary solution until you can upload a proper vector SVG.

---

### File Operations

**1. Copy the image to the project**
```
Copy: user-uploads://jalisco_chamby.png → src/assets/jalisco-map.png
```

---

### Changes to `src/components/ParallaxJaliscoBackground.tsx`

**1. Import the PNG image**
```tsx
import jaliscoMapImage from '@/assets/jalisco-map.png';
```

**2. Replace the SVG-based JaliscoSilhouette component**

Create a new image-based component that:
- Uses the PNG as a centered background image
- Applies parallax scroll effect using framer-motion
- Scales appropriately for mobile/desktop
- Uses `object-fit: contain` to preserve aspect ratio
- Applies slight opacity for text readability

**3. Remove the old SVG components**

Remove:
- `JALISCO_PATH` constant (the old SVG path)
- `JaliscoSilhouette` component (SVG-based)
- `StaticJaliscoSilhouette` component (SVG-based)
- `ContourLines` component (no longer needed - the PNG has built-in effects)
- `StaticContourLines` component

**4. Keep these components**
- `GridMesh` - subtle grid pattern
- `FloatingDots` / `StaticFloatingDots` - depth dots (the PNG has stars but we can keep these for extra depth)

---

### New Component Structure

```tsx
const JaliscoMapImage = memo(({ y, isMobile }: { y: MotionValue<number>; isMobile: boolean }) => (
  <motion.div
    className="absolute inset-0 flex items-center justify-center pointer-events-none"
    style={{ y }}
  >
    <img
      src={jaliscoMapImage}
      alt=""
      className={cn(
        "object-contain opacity-90",
        isMobile ? "w-[140%] max-w-none" : "w-[120%] max-w-none"
      )}
    />
  </motion.div>
));
```

---

### Visual Result

| Before | After |
|--------|-------|
| SVG path-based silhouette | Full PNG image with glowing edges, stars, and network lines |
| Separate contour lines layer | Built into the PNG |
| Custom gradient fills | Uses the blue gradient from the image |

The hero will display:
- Blue gradient base (from the image itself)
- Glowing Jalisco map outline with internal municipality divisions
- Scattered star/dot effects
- Network/connection lines around the edges
- Parallax scroll and tilt effects preserved

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/assets/jalisco-map.png` | New file (copied from upload) |
| `src/components/ParallaxJaliscoBackground.tsx` | Replace SVG components with PNG image |

