

## Fix Header Proportions with Large Logo

### Problem
The current logo height (`h-40 md:h-48` = 160px/192px) is expanding the header container, creating excessive white space and pushing the main content down too far.

### Solution
Use negative margins on the logo to allow it to visually overflow the header without affecting the container's layout height. This technique keeps the logo large and visible while maintaining a compact, proportional header.

---

### Changes to `src/pages/Index.tsx`

**Line 58 - Adjust header container padding:**
```
Before: pt-4 pb-2 md:py-2
After:  py-2
```
Simplify to consistent vertical padding.

**Line 60 - Add negative margins to the logo:**
```
Before: className="h-40 md:h-48 w-auto"
After:  className="h-24 md:h-28 w-auto -my-4 md:-my-6"
```

This change:
- Reduces the logo to a more reasonable size (`h-24 md:h-28` = 96px/112px) while still being prominent
- Uses negative vertical margins (`-my-4 md:-my-6`) to allow the logo to visually extend beyond the header's natural boundaries without increasing the header height
- Keeps the header compact at approximately 56-64px height while the logo appears larger

**Line 151 - Adjust main content top padding:**
```
Before: className="pt-20"
After:  className="pt-16"
```
Reduce the padding since the header will now be smaller.

---

### Visual Result

| Aspect | Before | After |
|--------|--------|-------|
| Header height | ~200px (bloated) | ~56-64px (compact) |
| Logo visibility | Very large, pushes content | Large but contained |
| Overall layout | Unbalanced | Clean and proportional |

---

### File to Modify

| File | Changes |
|------|---------|
| `src/pages/Index.tsx` | Adjust header padding, add negative margins to logo, reduce main content top padding |

