

## Fix: Persist `showSummary` state across OAuth redirects

All 6 booking flows have the same bug: `showSummary` is not persisted, so after OAuth redirect the user lands on a step instead of the summary.

### Strategy

Use a single `localStorage` key `booking_show_summary` to persist the summary state. Three touch points per flow:

1. **`handleShowSummary`** — set `localStorage.setItem('booking_show_summary', 'true')` when showing summary
2. **Load effect (on mount)** — check for the flag; if `true` AND saved data exists, restore form data and `setShowSummary(true)` (skip `setCurrentStep`)
3. **`handleSubmit` success path** — `localStorage.removeItem('booking_show_summary')` alongside `clearFormData()`
4. **`handleBack` from summary** — `localStorage.removeItem('booking_show_summary')` when user goes back from summary

### Files to modify (6 total)

| File | Form data key | handleShowSummary line | Load effect line | handleSubmit clearFormData line |
|------|--------------|----------------------|-----------------|-------------------------------|
| `HandymanBookingFlow.tsx` | `handymanFormData` | ~280 | ~162 | ~450 |
| `GardeningBookingFlow.tsx` | `gardeningFormData` | ~197 | ~91 | ~351 |
| `PlumbingBookingFlow.tsx` | `plumbingFormData` | ~197 | ~97 | ~355 |
| `ElectricalBookingFlow.tsx` | `electricalFormData` | ~227 | ~129 | ~385 |
| `CleaningBookingFlow.tsx` | `cleaningFormData` | ~176 | ~96 | ~333 |
| `AutoWashBookingFlow.tsx` | `autoWashFormData` | ~164 | ~89 | ~316 |

### Example change (Handyman — same pattern for all 6)

**handleShowSummary:**
```typescript
const handleShowSummary = () => {
  if (!user) { setShowAuthModal(true); return; }
  localStorage.setItem('booking_show_summary', 'true');
  setShowSummary(true);
};
```

**Load effect — add check before existing restore:**
```typescript
useEffect(() => {
  const saved = loadFormData();
  const shouldShowSummary = localStorage.getItem('booking_show_summary') === 'true';

  if (shouldShowSummary && saved?.handymanFormData) {
    const restored = { ...saved.handymanFormData };
    // (same date/photo validation as existing)
    setFormData(prev => ({ ...prev, ...restored }));
    setShowSummary(true);
    setIsLoading(false);
    return; // skip step restoration — summary covers everything
  }

  // existing logic unchanged...
}, []);
```

**handleSubmit success (after `clearFormData()`):**
```typescript
localStorage.removeItem('booking_show_summary');
clearFormData();
```

**handleBack:**
```typescript
const handleBack = () => {
  if (showSummary) { setShowSummary(false); localStorage.removeItem('booking_show_summary'); return; }
  if (currentStep > 1) setCurrentStep(currentStep - 1);
};
```

