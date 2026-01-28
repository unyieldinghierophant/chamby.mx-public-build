

## Remove the Unwanted Guadalajara Pin from Hero Background

### Problem Identified
The white/yellow blot you're seeing is the `GuadalajaraPin` component - a yellow teardrop marker with white pulsing ripple circles positioned at 50% left / 48% top of the hero background. It's appearing directly behind your hero text and search bar, creating visual clutter.

---

### Solution
**Completely remove the GuadalajaraPin component** from the `ParallaxJaliscoBackground.tsx` file. This will eliminate the white blot entirely while keeping the Jalisco map silhouette and other subtle background elements.

---

### Changes to `src/components/ParallaxJaliscoBackground.tsx`

**1. Remove the GuadalajaraPin component definition (lines 82-176)**

Delete the entire `GuadalajaraPin` component that creates the teardrop marker and ripple effects.

**2. Remove GuadalajaraPin from the rendered output**

Remove these lines from both the static and animated render sections:
```tsx
// Line 332 - Remove from static version:
<GuadalajaraPin prefersReducedMotion={true} isMobile={isMobile} />

// Line 362 - Remove from animated version:
<GuadalajaraPin prefersReducedMotion={false} isMobile={isMobile} />
```

---

### Changes to `src/index.css`

**Remove the pin animation keyframes** (no longer needed):
```css
/* Delete these keyframes */
@keyframes pinFloat { ... }
@keyframes pinRipple { ... }

/* Delete these classes */
.pin-float { ... }
.pin-ripple { ... }
.pin-ripple-delayed { ... }
```

---

### What Remains After Removal

The hero background will still have:
- Blue gradient base
- Subtle Jalisco map silhouette (very faint, wraps around the content)
- Subtle contour lines/ellipses
- Floating dots for depth
- Grid mesh pattern
- Parallax scroll and tilt effects

**No more white/yellow blot** in the center of your hero.

---

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ParallaxJaliscoBackground.tsx` | Remove `GuadalajaraPin` component definition and all usages |
| `src/index.css` | Remove `pinFloat`, `pinRipple` keyframes and related classes |

