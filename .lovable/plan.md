

## Remove Translucent Glass Card from Hero

### Overview
Remove the frosted glass card (`bg-white/[0.07] backdrop-blur-lg`) that sits behind the hero text, search bar, and CTA button. The content will flow directly over the Jalisco background with just the dark overlay for readability.

---

### Changes to `src/components/Hero.tsx`

**Remove the glass card wrapper (line 34)**

The current structure:
```
Main Content Container (padding)
  └── Glass Card (bg-white/[0.07] backdrop-blur-lg border) ← REMOVE THIS
        └── Text Content
        └── Search Bar Section
```

Will become:
```
Main Content Container (padding)
  └── Text Content
  └── Search Bar Section
```

**Specific change:**
- Remove the `<div className="bg-white/[0.07] backdrop-blur-lg rounded-2xl md:rounded-3xl p-6 md:p-8 lg:p-10 border border-white/15 shadow-2xl max-w-4xl mx-auto">` wrapper
- Keep the inner content (text, search bar, CTA) with just the `max-w-4xl mx-auto` constraint for centering

---

### Visual Result

| Before | After |
|--------|-------|
| Glass card with blur effect behind content | Content directly over Jalisco map |
| White/translucent border visible | No card border |
| Subtle frosted glass appearance | Clean, open layout |

The dark overlay (`from-black/35 via-black/15 to-black/25`) will still ensure text readability over the background, and the text shadows will maintain legibility.

---

### File to Modify

| File | Changes |
|------|---------|
| `src/components/Hero.tsx` | Remove glass card div wrapper on line 34, keep inner content centered |

