/**
 * Pricing Engine — Single Source of Truth
 *
 * All monetary values stored in centavos (integer) to avoid
 * floating-point issues. Display helpers convert to MXN strings.
 */

// ── IVA Rate ────────────────────────────────────────────────
export const VAT_RATE = 0.16;
export const VAT_LABEL = "IVA (16%)";

// ── Visit Fee Constants (centavos) ──────────────────────────
export const VISIT_BASE_CENTS       = 35_000;   // $350.00 MXN
export const VISIT_VAT_CENTS        = Math.round(VISIT_BASE_CENTS * VAT_RATE); // 5600
export const VISIT_TOTAL_CENTS      = VISIT_BASE_CENTS + VISIT_VAT_CENTS;      // 40600
export const VISIT_PROVIDER_NET_CENTS  = 25_000; // $250.00 MXN
export const VISIT_PLATFORM_FEE_CENTS  = 10_000; // $100.00 MXN

// ── Peso-denominated values (for DB columns stored in pesos) ──
export const VISIT_BASE_FEE = VISIT_BASE_CENTS / 100; // 350

// ── Generic Helpers ─────────────────────────────────────────

/** Calculate VAT in centavos from a base amount in centavos */
export const calcVat = (baseCents: number): number =>
  Math.round(baseCents * VAT_RATE);

/** Calculate total (base + VAT) in centavos */
export const calcTotalWithVat = (baseCents: number): number =>
  baseCents + calcVat(baseCents);

/** Format centavos → "$350.00 MXN" */
export const formatMXN = (cents: number): string =>
  `$${(cents / 100).toFixed(2)} MXN`;

/** Format centavos → "$350.00" (no currency suffix) */
export const formatMXNShort = (cents: number): string =>
  `$${(cents / 100).toFixed(2)}`;

/** Format pesos (number) → "$350.00 MXN" */
export const formatPesosMXN = (pesos: number): string =>
  `$${pesos.toFixed(2)} MXN`;

/** Format pesos (number) → "$350.00" */
export const formatPesosShort = (pesos: number): string =>
  `$${pesos.toFixed(2)}`;

// ── Visit Pricing Bundle ────────────────────────────────────

export const getVisitPricing = () => ({
  base: VISIT_BASE_CENTS,
  vat: VISIT_VAT_CENTS,
  total: VISIT_TOTAL_CENTS,
  providerNet: VISIT_PROVIDER_NET_CENTS,
  platformFee: VISIT_PLATFORM_FEE_CENTS,
});

// ── Invoice Helpers (pesos) ─────────────────────────────────

/** Calculate IVA in pesos from a subtotal in pesos */
export const calcInvoiceVat = (subtotalPesos: number): number =>
  Math.round(subtotalPesos * VAT_RATE * 100) / 100;

/** Calculate total in pesos (subtotal + IVA) */
export const calcInvoiceTotal = (subtotalPesos: number): number =>
  subtotalPesos + calcInvoiceVat(subtotalPesos);

// ── Pre-formatted Display Strings ───────────────────────────

export const VISIT_DISPLAY = {
  base:        formatMXN(VISIT_BASE_CENTS),         // "$350.00 MXN"
  vat:         formatMXN(VISIT_VAT_CENTS),           // "$56.00 MXN"
  total:       formatMXN(VISIT_TOTAL_CENTS),         // "$406.00 MXN"
  providerNet: formatMXN(VISIT_PROVIDER_NET_CENTS),  // "$250.00 MXN"
  platformFee: formatMXN(VISIT_PLATFORM_FEE_CENTS),  // "$100.00 MXN"
} as const;
