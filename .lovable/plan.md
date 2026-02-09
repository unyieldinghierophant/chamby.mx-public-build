

# Plan: Integrate Google Analytics 4 with Cookie Consent

## Overview
Wire up real Google Analytics 4 (GA4) tracking that only activates when the user accepts cookies. Currently the cookie banner does nothing -- after this change, accepting will load the GA4 script and start collecting page views, user behavior, and events.

## How It Works

1. User visits the site -- no GA4 script is loaded (privacy-first)
2. Cookie banner appears
3. If "Aceptar": GA4 `gtag.js` script is injected into the page, tracking begins
4. If "Rechazar": nothing is loaded, only the consent cookie is set
5. On return visits: if consent was previously accepted, GA4 loads automatically on page load

## Technical Details

### New File: `src/lib/analytics.ts`
Utility module that handles GA4 script loading and event tracking:

- `initGA(measurementId: string)` -- dynamically injects the `gtag.js` script tag and initializes `gtag('config', ...)`
- `trackPageView(path: string)` -- sends a page_view event
- `trackEvent(name, params)` -- generic event tracking helper
- `isGALoaded()` -- checks if GA is already initialized (prevents double-loading)
- GA Measurement ID stored as a constant (it's a public/publishable key)

### Modified File: `src/components/CookieConsent.tsx`
- On "Aceptar": call `initGA()` after saving consent
- On mount: if consent was previously "accepted", call `initGA()` immediately

### Modified File: `src/App.tsx` (minor)
- Add a `useEffect` that calls `trackPageView` on route changes (using `useLocation` from react-router), but only if GA is loaded
- This will be a small `<AnalyticsTracker />` component rendered inside `BrowserRouter`

### What Gets Tracked
- **Page views**: Every route change (automatic)
- **Session data**: GA4 automatically collects session duration, bounce rate, geography, device type, browser, referral source
- **User engagement**: Scroll depth, outbound clicks (GA4 enhanced measurement -- enabled in GA dashboard, not in code)

### GA4 Measurement ID
- Stored as a constant in `src/lib/analytics.ts` (public key, safe for client-side)
- If the user doesn't have one yet, the code will use a placeholder `G-XXXXXXXXXX` that can be swapped later

### Privacy Compliance
- GA4 script is NEVER loaded unless user explicitly accepts
- On reject: zero tracking scripts, zero third-party cookies
- Consent choice persisted for 365 days
- If user clears localStorage, banner reappears

## Files Summary

| File | Action |
|------|--------|
| `src/lib/analytics.ts` | Create -- GA4 init, page view, event helpers |
| `src/components/CookieConsent.tsx` | Modify -- trigger `initGA()` on accept, auto-init on return visits |
| `src/App.tsx` | Modify -- add `AnalyticsTracker` component for route-change tracking |

