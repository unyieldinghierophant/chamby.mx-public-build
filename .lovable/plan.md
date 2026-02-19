

## Replace All Spinner Loading States with Skeleton Screens

### What changes
Every loading screen in the app currently shows a spinning circle, which feels slow and bare. This plan replaces all of them with skeleton loading screens that mirror the shape of the actual content (cards, text, buttons, images) so the page feels instant and polished.

### Approach

**1. Upgrade `FullPageSkeleton` (used as the global fallback)**

Replace the current spinner-based `FullPageSkeleton` in `src/components/skeletons/index.tsx` with a proper skeleton that shows a header bar, hero area, and content blocks -- matching the general app layout.

**2. Create new context-specific skeletons**

Add these new skeletons to `src/components/skeletons/index.tsx`:

- `ProviderPortalSkeleton` -- sidebar placeholder + top bar + content area (used in `ProviderPortal.tsx`)
- `ProviderJobsSkeleton` -- tabs + job card placeholders (used in `ProviderJobs.tsx`)  
- `JobTimelineSkeleton` -- timeline header + status steps + details cards (used in `JobTimelinePage.tsx`)
- `GenericPageSkeleton` -- header + centered content cards (used in profile, settings, and other simple pages)

**3. Replace spinners in all 27 files**

Each file's loading spinner gets replaced with the appropriate skeleton:

| Skeleton | Files using it |
|----------|---------------|
| `FullPageSkeleton` | `Index.tsx`, `RoleSelection.tsx`, `AuthCallback.tsx`, `ResetPassword.tsx` |
| `ProviderPortalSkeleton` | `ProviderPortal.tsx` |
| `ProviderDashboardSkeleton` | `ProviderDashboardHome.tsx` (already done) |
| `ProviderJobsSkeleton` | `ProviderJobs.tsx` loading states |
| `JobTimelineSkeleton` | `JobTimelinePage.tsx` |
| `GenericPageSkeleton` | `ProtectedRoute.tsx`, `ProviderProfile.tsx`, `ProfileSettings.tsx`, `UserProfile.tsx`, `SavedLocations.tsx`, `BookingForm.tsx`, `ProviderVerification.tsx`, `ProviderNotifications.tsx`, `ProviderCalendar.tsx`, `RescheduleRequest.tsx`, `UserLanding.tsx`, `EsperandoProveedor.tsx`, `SecuritySettings.tsx` |
| `HomePageSkeleton` | `Home.tsx` (already done) |
| Inline skeleton blocks | `VerificationOverlay.tsx`, `SecuritySettings.tsx` (activity section), admin pages |

**4. No rendering until data is ready**

The existing pattern is correct: each page returns the skeleton while `loading === true` and only renders real content after all data (icons, text, colors) is available. This plan preserves that pattern -- we are only changing WHAT is shown during loading, not WHEN.

### Technical details

**New skeletons added to `src/components/skeletons/index.tsx`:**

```text
ProviderPortalSkeleton
+------------------------------------------+
| [==] Header Bar         [avatar] [menu]  |
+------+-----------------------------------+
|      |  [====] Page title                |
| Side |  [===========] Subtitle           |
| bar  |                                   |
|      |  +--------+  +--------+           |
|      |  | Card 1 |  | Card 2 |           |
|      |  +--------+  +--------+           |
|      |                                   |
|      |  +----------------------------+   |
|      |  |  Job card skeleton         |   |
|      |  +----------------------------+   |
+------+-----------------------------------+
```

```text
GenericPageSkeleton
+------------------------------------------+
| [==] Header Bar              [back btn]  |
+------------------------------------------+
|                                          |
|   [avatar circle]                        |
|   [====] Name                            |
|   [========] Description                 |
|                                          |
|   +----------------------------------+   |
|   | Setting row skeleton             |   |
|   +----------------------------------+   |
|   | Setting row skeleton             |   |
|   +----------------------------------+   |
+------------------------------------------+
```

**Files modified (summary):**

- `src/components/skeletons/index.tsx` -- add 4 new skeleton components, redesign `FullPageSkeleton`
- ~20 page/component files -- swap spinner div for skeleton component import + usage
- `src/components/ProtectedRoute.tsx` -- swap spinner for `GenericPageSkeleton`
- `src/pages/ProviderPortal.tsx` -- swap spinner for `ProviderPortalSkeleton`

All skeleton components use the existing `Skeleton` primitive from `src/components/ui/skeleton.tsx` with the existing `animate-pulse` animation and `bg-muted` color, so they match the design system automatically.
