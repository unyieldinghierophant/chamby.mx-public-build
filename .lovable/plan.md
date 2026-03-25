

## Redesign Email Capture Modal — Ultra-minimal $100 MXN credit popup

### What changes

Strip the modal down to a clean, Stripe/Uber-style centered card. Remove the image carousel, wave divider, logo, and verbose copy. Replace with a focused value-prop layout.

### File: `src/components/EmailCaptureModalV2.tsx`

**Remove entirely:**
- Image carousel (CAROUSEL_IMAGES, currentImage state, intervalRef, carousel useEffect, WaveDivider component, AnimatePresence block)
- Chamby logo import and rendering
- Wave divider SVG component

**Capture step — new layout:**
```
[Wallet icon — Lucide "Wallet" in primary color, inside a primary/10 circle]

$100 MXN de crédito          ← DialogTitle, text-2xl font-extrabold
Para tu próximo servicio      ← text-sm text-muted-foreground
en Chamby

Se aplica automáticamente     ← text-xs text-muted-foreground
después de tu primer servicio

[Email input — placeholder "Tu correo"]
[CTA button — "Activar crédito", disabled until valid email]

Sin spam. Crédito válido      ← text-xs text-muted-foreground
por 14 días.
```

**Success step — new layout:**
```
[CheckCircle icon in primary/10 circle]

Crédito activado              ← text-xl font-bold
$100 MXN listo para usar      ← text-2xl font-bold text-primary
```
- Auto-close after 1.5s via `setTimeout(() => setOpen(false), 1500)` when step becomes "success"
- Remove the "¡Entendido!" button

**Edge function call:** Change `urgency: false` body — keep as-is, the server determines amount. The UI just displays $100 MXN as the marketing value.

**Styling:** Keep the existing Dialog/Drawer wrapper, rounded-3xl, `[&>button]:hidden`. Padding: `px-8 py-10` centered. Max-width stays `sm:max-w-[440px]`.

