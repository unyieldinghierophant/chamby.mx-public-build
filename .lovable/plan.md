

# Plan: Cookie Consent Banner (Uber-style)

## Overview
Add a mobile-friendly cookie consent banner that slides up from the bottom, similar to the Uber screenshot. It will persist the user's choice in localStorage and set a cookie for tracking consent.

## What It Does
- Shows a bottom sheet/card on first visit with: title, explanation text, and three buttons (Cookie Settings, Reject, Accept)
- Stores the user's choice so it only appears once
- Sets a `chamby_cookie_consent` cookie with the value `accepted`, `rejected`, or `custom`
- On "Accept": enables analytics/tracking cookies
- On "Reject": only essential cookies remain
- "Cookie Settings" can link to a future settings page or toggle categories (for now, same as reject)

## Visual Design (matching the screenshot)
- Fixed to bottom of screen
- White card with rounded top corners
- Bold title: "Usamos cookies"
- Body text explaining usage
- Three buttons in a row: "Configuracion" (text), "Rechazar" (outlined), "Aceptar" (filled black/primary)
- Appears above the mobile bottom nav if present

## Technical Details

### New File: `src/components/CookieConsent.tsx`
- Checks `localStorage.getItem('chamby_cookie_consent')` on mount
- If no consent stored, renders the banner
- On Accept: sets `localStorage` + `document.cookie` with consent value, hides banner
- On Reject: sets localStorage to rejected, hides banner
- Uses `framer-motion` for slide-up animation (already installed)
- Responsive: full-width on mobile, max-w-lg centered on desktop
- z-index high enough to sit above everything (z-[60])

### Modified File: `src/App.tsx`
- Import and render `<CookieConsent />` inside `BrowserRouter` but outside `Routes`, so it appears on all pages

### Cookie Details
- Cookie name: `chamby_cookie_consent`
- Values: `accepted` | `rejected`
- Expiry: 365 days
- Path: `/`

No external cookie library needed -- just native `document.cookie` and `localStorage`.

