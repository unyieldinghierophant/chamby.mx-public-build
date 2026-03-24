

## Increase spacing between category icons

### Problem
On mobile (390px), 7 categories with `gap-4` and `w-[75px]` items feel cramped, especially with "Electrodomésticos" being a long label.

### Changes

**File: `src/components/CategoryTabs.tsx`**

1. **Increase gap** in TabsList (line 246): change `gap-4 sm:gap-6 md:gap-8` to `gap-6 sm:gap-8 md:gap-10`
2. **Slightly increase item width** (line 259): change `w-[75px] min-w-[75px]` to `w-[80px] min-w-[80px]` so labels have more breathing room
3. **Match skeleton gap** (line 226): update skeleton loading state gap from `gap-6` to `gap-6` (already matches, no change needed)

This gives ~8px more space between each category on mobile, making the row feel less cramped while keeping horizontal scroll natural.

