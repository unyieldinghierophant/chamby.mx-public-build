
# Plan: Provider Portal Mobile UX Fixes

## ✅ COMPLETED

All issues have been addressed:

### 1. Job Detail Bottom Sheet ✅
- Created `JobDetailSheet.tsx` - Opens when clicking job cards
- Shows full image gallery, description, location, date/time, price
- "Aceptar Trabajo" button (disabled if has active job)

### 2. Provider-Specific Notifications ✅
- Created `useProviderNotifications.ts` hook
- Filters notifications to provider-relevant types only
- Used in bottom nav and notification sheet

### 3. Bottom Nav Redesign ✅
- Fixed badge to only show when count > 0 (red bubble)
- Added notifications bell icon with unread count badge
- 5 items: Inicio, Trabajos, Notif, Historial, Perfil

### 4. Mobile Header Removed ✅
- TopBar hidden on mobile (`hidden md:flex`)
- Floating header with logo + larger hamburger menu (h-10 w-10)
- Hamburger triggers existing sidebar

### 5. Job Card Click Handler ✅
- Changed from navigation to opening JobDetailSheet
- Added `onViewDetails` callback prop
- Wired up in both ProviderDashboardHome and AvailableJobs

### 6. Active Job Blocking ✅
- AvailableJobs now checks for active jobs
- Feed becomes grayed out with pointer-events-none when has active job
- Shows warning message

## Files Created
- `src/components/provider-portal/JobDetailSheet.tsx`
- `src/hooks/useProviderNotifications.ts`

## Files Modified
- `src/components/provider-portal/ProviderBottomNav.tsx`
- `src/components/provider-portal/ProviderTopBar.tsx`
- `src/pages/ProviderPortal.tsx`
- `src/components/provider-portal/JobCardMobile.tsx`
- `src/pages/provider-portal/ProviderDashboardHome.tsx`
- `src/pages/provider-portal/AvailableJobs.tsx`
- `src/components/provider-portal/NotificationBottomSheet.tsx`

