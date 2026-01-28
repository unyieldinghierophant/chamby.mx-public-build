

## Fix Category Cards Visibility - Remove Faded/Grey Filter

### Root Causes Identified

I found three issues causing the faded, grey appearance:

| Issue | Location | Effect |
|-------|----------|--------|
| Opacity animation starts at 0.4 | Line 86: `opacity = Math.min(1, 0.4 + scrollY * 0.6)` | Cards appear 60% transparent initially |
| TabsList has muted text color | UI component: `text-muted-foreground` class | All text appears grey |
| Semi-transparent background | Line 81: `bg-background/80` | Container looks washed out |

---

### Solution

Remove all opacity-reducing effects and ensure full visibility:

**File: `src/components/CategoryTabs.tsx`**

1. **Remove opacity from parallax animation (line 86-94)**
   - Delete the opacity calculation entirely
   - Keep only the translateY parallax effect for movement
   - Remove opacity from the style object

2. **Fix TabsList background (line 81)**
   - Change `bg-background/80` to `bg-background` (fully opaque)

3. **Add explicit text color to TabsTrigger (line 98-104)**
   - Add `text-foreground` class to ensure full color visibility
   - This overrides the inherited `text-muted-foreground` from the parent TabsList

---

### Code Changes

**Before (lines 86-97):**
```javascript
const parallaxOffset = Math.round((1 - scrollY) * (15 + index * 6));
const opacity = Math.min(1, 0.4 + scrollY * 0.6);

return (
  <TabsTrigger
    style={{
      transform: `translate3d(0, ${parallaxOffset}px, 0)`,
      opacity,
      willChange: 'transform, opacity',
      backfaceVisibility: 'hidden',
    }}
```

**After:**
```javascript
const parallaxOffset = Math.round((1 - scrollY) * (15 + index * 6));

return (
  <TabsTrigger
    style={{
      transform: `translate3d(0, ${parallaxOffset}px, 0)`,
      willChange: 'transform',
      backfaceVisibility: 'hidden',
    }}
```

**TabsList background (line 81):**
```
Before: bg-background/80
After:  bg-background
```

**TabsTrigger className (line 98):**
```
Add: text-foreground
```

---

### Result

- Category icons and text will appear at full opacity (100%)
- Background will be solid, not semi-transparent
- Text will use foreground color instead of muted grey
- Parallax movement effect is preserved (just without opacity fade)

