

# Fix: Handyman Search Intent Not Passed Through

## Problem

When a user searches "armar muebles" from the landing page, the system correctly routes them to the Handyman booking flow. However, the search text is never passed to `HandymanBookingFlow` -- unlike `ElectricalBookingFlow` which already receives an `intentText` prop. As a result:

- The description field starts empty
- The suggestion dropdown shows "Colgar una TV" as the first option
- The user's original search intent is lost

## Root Cause

In `BookJob.tsx` (line 58), `HandymanBookingFlow` is rendered without any props:
```
<HandymanBookingFlow />
```

While `ElectricalBookingFlow` (line 64) already receives the intent:
```
<ElectricalBookingFlow intentText={...} />
```

## Plan

### Step 1: Add `intentText` prop to HandymanBookingFlow

- Accept an optional `intentText` string prop
- On mount, if `intentText` is provided and the description is empty, pre-fill the description field with it
- Auto-detect `workType` from keywords (e.g., "armar" selects "armado", "reparar" selects "reparacion", "instalar" selects "instalacion")

### Step 2: Pass intentText from BookJob.tsx

Update the HandymanBookingFlow rendering in `BookJob.tsx` to pass the same intent text that Electrical already receives:
```
<HandymanBookingFlow intentText={prefillData?.description || prefillData?.service || descriptionParam || serviceParam || ''} />
```

### Keyword-to-WorkType Mapping

| Keywords | WorkType |
|----------|----------|
| armar, ensamblar, montar, mueble | armado |
| reparar, arreglar, componer, ajustar, bisagra | reparacion |
| instalar, colgar, montar tv, colocar, poner | instalacion |
| ajustar, manteni, calibrar | ajuste |

### Files Changed

| File | Change |
|------|--------|
| `src/pages/BookJob.tsx` | Pass `intentText` prop to HandymanBookingFlow |
| `src/components/handyman/HandymanBookingFlow.tsx` | Accept `intentText` prop, pre-fill description, auto-select workType |

