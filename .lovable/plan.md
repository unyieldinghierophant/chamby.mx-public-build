

## Fix: Booking Flow Scroll & Header

### Problem
1. The fixed header with the Chamby logo wastes ~64px of vertical space on mobile throughout the entire booking flow
2. The `min-h-screen` on the content wrapper combined with the fixed header creates scroll jank and "pull back" behavior
3. Steps should start at the very top — no branding header needed during booking

### Changes

**1. `src/pages/BookJob.tsx` — Remove fixed header, simplify layout**
- Remove the entire `<header>` block (logo + X button)
- Replace with a minimal inline top bar: just a back arrow (or X) on the left, no logo, no fixed positioning — use normal document flow
- Remove `min-h-screen` from the content wrapper to eliminate overscroll bounce
- Change padding from `pt-[calc(4rem+12px)]` to `pt-3` (12px) since there's no fixed header to clear
- Keep the X button to navigate home, but place it inline at the top-right of the content area

**2. `src/components/handyman/HandymanBookingFlow.tsx` — Move step indicator to top**
- Remove `mt-3 md:mt-8` gap before step content — steps render immediately
- The `HandymanStepIndicator` already renders at the top of the component; it stays as-is
- Add a mobile-visible compact progress bar (thin colored bar showing step progress) since the current step indicator is `hidden lg:flex`

**3. Add `ScrollToTop` component**
- Create `src/components/ScrollToTop.tsx` that scrolls to top on route change
- Add it inside `<BrowserRouter>` in `App.tsx` to prevent stale scroll positions between steps/pages

### Result
- No fixed header stealing 64px on mobile
- Native document scrolling (no overscroll fighting)
- Steps start immediately at the top with just a small close button
- Smooth, lag-free vertical scrolling

