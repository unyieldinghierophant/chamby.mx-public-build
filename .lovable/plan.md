

## Re-add Jardineria Category to Landing Page

### Problem
The `jardineria` category was removed from the `VISIBLE_SLUGS_ORDERED` array in `CategoryTabs.tsx`. All its assets (icon, hero image) and slug mappings are still present -- it just needs to be added back to the visible list.

### Change
**File: `src/components/CategoryTabs.tsx`** (line 106-114)

Add `{ slug: 'jardineria', label: 'Jardineria' }` to the `VISIBLE_SLUGS_ORDERED` array, placing it after Limpieza (logical grouping). This brings the count to 8 visible categories.

```typescript
const VISIBLE_SLUGS_ORDERED = [
  { slug: 'plomeria', label: 'Fontanería' },
  { slug: 'electricidad', label: null },
  { slug: 'pintura', label: null },
  { slug: 'albanileria', label: 'Albañilería' },
  { slug: 'aire-acondicionado', label: null },
  { slug: 'limpieza', label: 'Limpieza' },
  { slug: 'jardineria', label: 'Jardinería' },
  { slug: 'general', label: null },
];
```

No other files need changes -- the icon map (`SLUG_ICON_MAP`), hero map (`SLUG_HERO_MAP`), and asset imports are all already in place for `jardineria`.

