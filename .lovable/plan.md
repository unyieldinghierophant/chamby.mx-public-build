

## Fix: Search dropdown displacement on mobile keyboard open

### Problem
Both `HeroSearchBar` and `CatalogSearchBar` use `createPortal` + `position: fixed` to render the dropdown. When the mobile keyboard opens, the visual viewport shrinks/shifts but `getBoundingClientRect` returns layout viewport coordinates, causing the dropdown to float in the wrong position or get displaced.

### Solution
Remove the portal approach entirely. Render the dropdown inline as an absolutely-positioned child of the search bar's own container. This guarantees it always sits directly below the input regardless of viewport changes from keyboard.

### Changes

**File: `src/components/HeroSearchBar.tsx`**
- Remove `createPortal` import
- Remove `dropdownStyle` state, `updateDropdownPosition` callback, and the scroll/resize useEffect
- Remove `id="hero-search-dropdown"` portal check in click-outside handler
- Move dropdown JSX inline inside the `searchRef` div, as a sibling after the input wrapper
- Style: `absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto z-50 bg-background rounded-xl shadow-lg border`
- The parent `searchRef` div already has `relative`, so this works

**File: `src/components/CatalogSearchBar.tsx`**
- Same changes: remove `createPortal`, `dropdownStyle`, portal positioning logic
- Render dropdown inline with `absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto z-50`
- Ensure the parent container has `overflow-visible` (no `overflow-hidden` ancestor clipping — the previous portal was added to escape this, but we need to check the parent)

**Overflow concern:** The original portal was added to escape `overflow-hidden` on parent containers. We need to ensure the search bar's ancestors don't clip. The Hero section wrapper that previously had `overflow-hidden` had the grid overlay removed already. If any parent still clips, we add `overflow-visible` to the immediate search wrapper only.

### Result
- Dropdown locked under search bar via CSS `position: absolute` relative to parent
- No JS listeners needed for repositioning
- Works on iOS Safari + Android Chrome regardless of keyboard state
- Internal scroll via `max-h-60 overflow-y-auto`

