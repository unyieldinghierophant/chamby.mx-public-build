
# Plan: Optimize Search Bar Placeholder Examples for Mobile

## Problem
On mobile devices, the dynamic typing placeholder examples in the HeroSearchBar get cut off because they're too long for the smaller screen width. Examples like "Arreglar mi lavadora" (20 characters) may not fit completely.

## Solution
Create two sets of typing examples - shorter ones for mobile and the current ones for desktop - and use a responsive approach to select the appropriate set based on screen size.

## Changes

### src/components/HeroSearchBar.tsx

1. **Add shorter mobile-friendly examples:**
```typescript
const TYPING_EXAMPLES_MOBILE = [
  'Pintar pared',
  'Armar cama', 
  'Cortar pasto',
  'Lavar auto',
  'Mover muebles'
];

const TYPING_EXAMPLES_DESKTOP = [
  'Arreglar mi lavadora',
  'Pintar mi pared',
  'Armar mi cama',
  'Ayudarme a mover',
  'Lavar mi auto'
];
```

2. **Add mobile detection hook:**
   - Use the existing `use-mobile` hook or create a simple width check using `window.innerWidth`
   - Switch between `TYPING_EXAMPLES_MOBILE` and `TYPING_EXAMPLES_DESKTOP` based on screen size

3. **Update the typing effect to use the responsive array:**
   - The typing animation will automatically use shorter strings on mobile
   - All examples will fit comfortably in the search bar without cutoff

## Technical Details

- Mobile breakpoint: 640px (Tailwind's `sm` breakpoint)
- Max character length for mobile examples: ~12 characters
- This ensures text fits with the search icon (left) and arrow button (right)

## Files to Modify
- `src/components/HeroSearchBar.tsx` - Add mobile examples and responsive selection logic
