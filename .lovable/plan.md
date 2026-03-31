

## Fix: Booking Flow Step Layout, Pill Size, Progress Bar, Scroll

### Changes

**1. `src/pages/BookJob.tsx` — Move step title into the top bar area**
- Replace the standalone X close button with a top bar that includes: step title on the left, X button on the right
- The step title will be passed up from `HandymanBookingFlow` via a new prop or computed from `currentStep` directly in BookJob
- Actually, simpler: pass `currentStep` up isn't clean. Instead, move the top bar rendering INTO `HandymanBookingFlow` itself and remove the close button from BookJob entirely. BookJob becomes just a wrapper with background + padding.

**2. `src/components/handyman/HandymanBookingFlow.tsx` — Multiple fixes**

a) **Remove mobile progress bar** (lines 596-605) — delete the `lg:hidden` progress bar and "Paso X de 6" text

b) **Remove bottom step indicator dots** (lines 910-921) — delete the mobile dot indicators at the bottom

c) **Add inline top bar with step title + close button** — at the very top of the component, render a row with:
   - Left: step title text (e.g., "¿Qué necesitas?", "Ubicación", "Tamaño del trabajo", "Fecha y hora", "Fotos") using smaller bold text
   - Right: X close button to navigate home
   - This replaces the per-step `<h1>` headings inside each step — OR keep both but make the top bar a compact label and each step keeps its heading. Better: make the top bar the step counter/label ("Paso 1 · Servicio") and keep the h1 inside each step. This puts content right at the top.

   Actually, re-reading the request: "put the step title at the top of the screen where the header used to go". So the step title IS the top element. Remove the duplicate h1 inside each step to avoid repetition, or keep the h1 and just remove the progress bar so the h1 is the first thing visible.

   Simplest approach: just remove the progress bar + dots. The h1 inside each step already serves as the title. Without the progress bar, the h1 will be the first content element, sitting right at the top. Add a compact step counter next to the X button: "Paso 1 de 5" + X.

c) **Shrink sub-service pills** — reduce from `px-5 py-3 text-sm` to `px-3.5 py-2 text-xs` so they take less space on mobile

d) **Ensure smooth scrolling, no pull-back** — verify no `min-h-screen`, `overflow-hidden`, or `overscroll-none` on the wrapper. Add `overscroll-behavior: auto` if needed.

**3. `src/components/booking/LocationStep.tsx`** — Remove the h1 "Ubicación del servicio" title since it'll be handled by the top bar, OR keep it for consistency. Keep it — each step has its own contextual heading.

### Summary of visual result
- Top of screen: compact bar with "Paso X de 5" on left, X on right (12px from top)
- Immediately below: the step's h1 heading ("¿Qué necesitas?", etc.)
- No progress bar, no bottom dots
- Smaller pills that don't cramp the screen
- Smooth native scrolling with no pull-back artifacts

### Files to modify
- `src/pages/BookJob.tsx` — minor: keep as-is or move X button into flow component
- `src/components/handyman/HandymanBookingFlow.tsx` — remove progress bar, remove bottom dots, shrink pills, add top step counter with X button

