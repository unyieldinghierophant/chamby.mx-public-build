
# Plan: Provider Portal Mobile-First UI/UX Tweaks

## Overview
This plan implements targeted UI/UX improvements to make the provider portal truly mobile-first, with clearer hierarchy and faster scanning - all while preserving existing business logic.

## Key Changes Summary

### 1. Availability Toggle Redesign
**Current:** Small iOS-style Switch in the profile header corner
**New:** Full-width stateful button above the jobs section

Changes to `ProviderDashboardHome.tsx`:
- Remove Switch from profile header section
- Add new `AvailabilityButton` component above "Trabajos Disponibles"
- Two visual states:
  - **Available (Primary filled):** "Disponible para trabajos"
  - **Not Available (Outlined):** "No disponible"
- Add microcopy below: "Recibe trabajos solo cuando estes disponible"
- When unavailable: Blur/overlay the jobs feed with message "Activa tu disponibilidad para ver trabajos"

### 2. Header Simplification
**Current:** Logo + Menu + Notifications + Avatar with dropdown
**New:** Keep TopBar minimal, move greeting/stats to dedicated card

Changes to `ProviderTopBar.tsx`:
- Keep: Menu icon, Notification bell, Avatar
- Remove: Any extra elements

Changes to `ProviderDashboardHome.tsx`:
- Create compact welcome card below header with:
  - "Hola, {name}"
  - Rating stars + completed jobs count
  - No availability toggle (moved to jobs section)

### 3. Verification Banner Compression
**Current:** Card-style with icon, text, and chevron button
**New:** Slim single-line banner

Changes to `ProviderDashboardHome.tsx`:
- Reduce padding from `p-2.5` to `py-2 px-3`
- Inline format: "Verificacion en revision . Ver estado ->"
- Make it horizontally clickable (entire banner)
- Optional: Add dismiss button (using existing state, no new persistence)

### 4. Lighter Job Filters (Segmented Tabs)
**Current:** Heavy pill buttons with icons
**New:** Light text-based segmented control

Changes to `JobSortingTabs.tsx`:
- Convert from filled pills to underlined text tabs
- Remove icons except location for "Mas cerca"
- Reduce visual weight with `border-b-2` for active state
- Keep horizontal scroll behavior

### 5. Job Card Height Reduction + Scanability
**Current:** Large 16:10 image, metadata pills
**New:** Compact layout with thumbnail approach

Changes to `JobCardMobile.tsx`:
- Reduce image from `aspect-[16/10]` to `aspect-[21/9]` (ultra-wide banner)
- Add photo count badge on image
- Restructure content:
  - Service icon + name (from category)
  - 1-2 line description (line-clamp-2)
  - Date + Time + Zone (city only)
  - Add "Visita pagada" trust badge when `visit_fee_paid === true`
- **Remove Accept button from list view** (per requirements)
- Card becomes tappable to open detail view

### 6. Active Job Pinning + Lock UI
**Current:** Active jobs shown in stats only
**New:** Pinned active job card + dimmed other jobs

Create new `ActiveJobCard.tsx` component:
- Distinct styling (primary border, background tint)
- Label: "Trabajo activo"
- Show key info: title, date, client
- Action button: "Ver detalles"

Changes to `ProviderDashboardHome.tsx`:
- Import and use `useActiveJobs` hook
- If `stats.activeJobs > 0`:
  - Fetch first active job details
  - Render `ActiveJobCard` at top of jobs section
  - Apply `opacity-50 pointer-events-none` to other job cards
  - Show overlay message: "Finaliza tu trabajo activo para aceptar otro"

### 7. Stats Cards Conditional Display
**Current:** Always shows 2 cards (Activos, Ganancias)
**New:** Hide or collapse when zero

Changes to `ProviderDashboardHome.tsx`:
- If `stats.activeJobs === 0 && earnings.total === 0`:
  - Hide stats grid entirely OR
  - Collapse to single compact row with muted styling
- If only one is zero, show both but muted for the empty one

### 8. Notifications Bottom Sheet
**Current:** Uses Popover for desktop, navigates to page on mobile
**New:** Bottom sheet (Drawer) on mobile for last 3 notifications

Create new `NotificationBottomSheet.tsx`:
- Uses existing `Drawer` component from vaul
- Shows last 3 notifications from existing `useNotifications` hook
- "Ver todas" button navigates to full page
- Keep all existing read-state logic intact

Changes to `ProviderTopBar.tsx`:
- On mobile: Bell click opens `NotificationBottomSheet`
- On desktop: Keep current Popover behavior

## Technical Details

### Files to Create
1. `src/components/provider-portal/AvailabilityButton.tsx` - Full-width toggle button
2. `src/components/provider-portal/ActiveJobCard.tsx` - Pinned active job display
3. `src/components/provider-portal/NotificationBottomSheet.tsx` - Mobile drawer for notifications

### Files to Modify
1. `src/pages/provider-portal/ProviderDashboardHome.tsx`
   - Remove Switch from profile section
   - Add AvailabilityButton above jobs
   - Add active job pinning logic
   - Conditional stats display
   - Jobs blur when unavailable

2. `src/components/provider-portal/JobSortingTabs.tsx`
   - Convert to light segmented text tabs
   - Remove most icons

3. `src/components/provider-portal/JobCardMobile.tsx`
   - Reduce image height
   - Add trust badge
   - Remove Accept button (card becomes tappable)
   - Streamline metadata display

4. `src/components/provider-portal/ProviderTopBar.tsx`
   - Integrate NotificationBottomSheet for mobile

### Dependencies
- Existing `useActiveJobs` hook (already in codebase)
- Existing `Drawer` component from vaul
- Existing `useNotifications` hook
- No new packages required

### Preserved Functionality
- Jobs fetching/filtering/sorting logic (untouched)
- Notification triggers and read-state pipeline (untouched)
- Availability backend behavior (only UI changes, same `isAvailable` state)
- Auth/session and routing (untouched)
- Real-time subscriptions (untouched)

## Visual Hierarchy (Mobile)
```text
+----------------------------------+
|  [=]  CHAMBY LOGO    [Bell] [Av] |  <- TopBar (h-14)
+----------------------------------+
|  Hola, Armando!                  |
|  * 4.8  |  * 12 trabajos         |  <- Welcome Card
+----------------------------------+
|  [!] Verificacion en revision -> |  <- Slim Banner (if applicable)
+----------------------------------+
|  [ Disponible para trabajos ]    |  <- Availability Button
|  Recibe trabajos solo cuando...  |
+----------------------------------+
|  [TRABAJO ACTIVO]                |  <- Pinned (if exists)
|  Reparacion de tuberia...        |
+----------------------------------+
|  Trabajos Disponibles (24)       |
|  Para ti | Mas cerca | ...       |  <- Light tabs
+----------------------------------+
|  [Job Card - Compact]            |
|  [Job Card - Dimmed if active]   |
|  ...                             |
+----------------------------------+
```

## Implementation Order
1. Create AvailabilityButton component
2. Create ActiveJobCard component
3. Modify ProviderDashboardHome (main layout changes)
4. Update JobSortingTabs (light tabs)
5. Update JobCardMobile (compact + no accept button)
6. Create NotificationBottomSheet
7. Update ProviderTopBar (integrate drawer)
8. Test all flows on mobile viewport
