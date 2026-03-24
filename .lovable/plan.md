

## Fix: Category spacing and Electrodomésticos label centering on mobile

### Problem
On mobile (390px), the tab triggers are `w-[80px]` with `gap-4` between them. "Electrodomésticos" is 16 characters and doesn't fit cleanly, causing misalignment with its icon.

### Changes

**File: `src/components/CategoryTabs.tsx`**

1. **Increase tab trigger width on mobile** from `w-[80px]` to `w-[85px]` (line 234)
2. **Increase gap** in TabsList from `gap-4` to `gap-5` (line 211)  
3. **Remove conditional font size** — use a single uniform size for all labels: `text-[10px] sm:text-[11px] md:text-sm` (lines 251-254). This makes "Electrodomésticos" the same size as other labels instead of shrinking it
4. **Set label width to match trigger width** — always `w-full` so text centers relative to the icon above it

This ensures all category labels are the same font size, properly centered under their icons, with enough breathing room between tabs for the longer text to wrap naturally.

