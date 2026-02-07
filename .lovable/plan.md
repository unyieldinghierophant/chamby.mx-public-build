
# Plan: Provider Portal Mobile UX Fixes

## Issues Identified

1. **Job Details Not Accessible**: Clicking on a job card navigates to `/provider-portal/available-jobs?highlight=${job.id}` but there's no job detail page or modal - just the list view
2. **AvailabilityButton Text Color**: The button shows correctly (blue bg with white text) - this is actually working as intended
3. **User Notifications in Provider Portal**: The `useNotifications` hook fetches ALL notifications for the user, not filtered by provider-specific types
4. **Bottom Nav Badge Display Issue**: The badge count "0" appears between the icon and text label instead of as a corner bubble
5. **Header Removal Request**: User wants to remove the TopBar header on mobile and move elements
6. **Notifications in Footer**: Add notification bell to bottom nav
7. **Hamburger Menu**: Make menu icon larger and position at top-right

---

## Solution Overview

### 1. Create Job Detail Bottom Sheet/Modal
Add a `JobDetailSheet.tsx` component that opens when clicking a job card, showing full job details with an "Accept" button.

### 2. Fix Bottom Nav Badge Positioning
The current code has the badge correctly positioned, but there may be a rendering issue. Will ensure the badge only shows when count > 0 and is properly positioned as a red bubble.

### 3. Filter Provider-Specific Notifications
Create a `useProviderNotifications` hook that filters notifications by provider-relevant types (job_assigned, job_cancelled, etc.)

### 4. Redesign Mobile Header/Navigation
- Remove the TopBar header on mobile (keep on desktop)
- Add a floating hamburger menu button at top-right
- Add notifications button to bottom nav (replacing one item or adding as 5th item)

---

## Technical Changes

### Files to Create

**`src/components/provider-portal/JobDetailSheet.tsx`**
- Bottom sheet/drawer component using vaul's Drawer
- Shows complete job information:
  - Full image gallery (swipeable)
  - Title and category
  - Full description/problem
  - Client info (if available)
  - Date, time, location (full address)
  - Price and visit fee status
  - "Aceptar Trabajo" button (disabled if provider has active job)
- Triggered when job card is clicked

**`src/hooks/useProviderNotifications.ts`**
- Wraps `useNotifications` and filters for provider-relevant notification types
- Types to include: `job_assigned`, `job_cancelled`, `new_job`, `payment_received`, `review_received`, etc.

### Files to Modify

**`src/components/provider-portal/JobCardMobile.tsx`**
- Change click handler to open JobDetailSheet instead of navigating
- Pass `onViewDetails` callback prop

**`src/components/provider-portal/ProviderBottomNav.tsx`**
- Fix badge: Only render when `badge > 0` (currently does this, but need to verify)
- Badge should be red bubble in top-right corner of icon (not between icon and text)
- Add notifications item with bell icon
- Restructure to 5 items: Inicio, Trabajos, Notificaciones, Historial, Perfil

**`src/pages/provider-portal/ProviderDashboardHome.tsx`**
- Import and render JobDetailSheet
- Add state for selected job
- Pass job selection handler to JobCardMobile

**`src/pages/provider-portal/AvailableJobs.tsx`**
- Same changes as ProviderDashboardHome for job detail sheet

**`src/components/provider-portal/ProviderTopBar.tsx`**
- Hide entire header on mobile (`hidden md:flex`)
- Or alternatively: Keep only logo, hide menu button (sidebar trigger)

**`src/pages/ProviderPortal.tsx`**
- Add floating hamburger menu button for mobile (positioned top-right)
- Make it larger (h-10 w-10 or similar)

---

## Visual Changes

### Mobile Bottom Nav (Updated Layout)
```
┌──────────────────────────────────────────┐
│   🏠    💼(🔴)  🔔(🔴)   📋      👤     │
│  Inicio Trabajos  Notif  Historial Perfil│
└──────────────────────────────────────────┘
```

### Mobile Header (Updated)
```
┌──────────────────────────────────────────┐
│  [CHAMBY LOGO]                    [☰]   │  <- Floating hamburger (larger)
└──────────────────────────────────────────┘
```

The hamburger opens the sidebar as before.

### Job Detail Sheet
```
┌──────────────────────────────────────────┐
│  ─── (drag handle)                       │
│  ┌────────────────────────────────────┐  │
│  │     [Image Gallery - swipe]        │  │
│  │         📷 1/3                     │  │
│  └────────────────────────────────────┘  │
│  Reparación de tubería                   │
│  Plomería • Urgente                      │
│                                          │
│  📝 Descripción                          │
│  Tengo una fuga en el baño que necesita │
│  reparación urgente...                   │
│                                          │
│  📍 Ubicación                            │
│  Av. Vallarta 1234, Guadalajara, Jalisco │
│                                          │
│  📅 Fecha y hora                         │
│  Lunes 10 Feb, 14:00                     │
│                                          │
│  💰 Tarifa: $500 MXN                     │
│  ✅ Visita pagada                        │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │       Aceptar Trabajo              │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

---

## Implementation Order

1. **Create `JobDetailSheet.tsx`** - New component for viewing job details
2. **Create `useProviderNotifications.ts`** - Filter notifications for providers
3. **Update `ProviderBottomNav.tsx`** - Add notifications, fix badge, 5 items
4. **Update `ProviderTopBar.tsx`** - Hide on mobile or simplify
5. **Update `ProviderPortal.tsx`** - Add floating hamburger for mobile
6. **Update `JobCardMobile.tsx`** - Open detail sheet on click
7. **Update `ProviderDashboardHome.tsx`** - Wire up job detail sheet
8. **Update `AvailableJobs.tsx`** - Wire up job detail sheet
9. **Update `NotificationBottomSheet.tsx`** - Use provider-filtered notifications

---

## Preserved Functionality

- All existing job fetching/sorting logic
- Accept job flow (just moved into detail sheet)
- Notification read-state and real-time updates
- Sidebar functionality (just trigger moved)
- All routing and authentication
