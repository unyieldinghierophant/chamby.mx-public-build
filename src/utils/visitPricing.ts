/**
 * Visit Fee Pricing — Single Source of Truth
 *
 * All monetary values are stored in centavos (integer) to avoid
 * floating-point rounding issues.  Display helpers convert to
 * human-readable MXN strings.
 *
 * Pricing model v3 (fee-absorbed):
 *   Customer pays subtotal (base + stripe fee) + IVA on base.
 *   Stripe fee is absorbed into the subtotal — NOT shown as a line item.
 *   Provider payout is a fixed amount (does NOT include IVA).
 */

// ── Core constants (centavos) ───────────────────────────────
export const VISIT_BASE_FEE_CENTS    = 35_000;  // $350.00 MXN (service base)
export const STRIPE_FEE_CENTS        =  1_810;  // $18.10 MXN (absorbed, not shown)
export const SUBTOTAL_CENTS          = 36_810;  // $368.10 MXN (base + stripe fee)
export const IVA_RATE                = 0.16;
export const IVA_AMOUNT_CENTS        =  5_600;  // 16% of $350 base
export const CUSTOMER_TOTAL_CENTS    = 42_410;  // $424.10 MXN
export const PROVIDER_PAYOUT_CENTS   = 25_000;  // $250.00 MXN (fixed)
export const CHAMBY_COMMISSION_CENTS = 10_000;  // $100.00 MXN (fixed)

// ── Derived display values (pesos, already formatted) ───────
export const SUBTOTAL         = SUBTOTAL_CENTS         / 100; // 368.10
export const IVA_AMOUNT       = IVA_AMOUNT_CENTS       / 100; // 56
export const CUSTOMER_TOTAL   = CUSTOMER_TOTAL_CENTS   / 100; // 424.10
export const PROVIDER_PAYOUT  = PROVIDER_PAYOUT_CENTS  / 100; // 250
export const CHAMBY_COMMISSION = CHAMBY_COMMISSION_CENTS / 100; // 100

// ── Formatters ──────────────────────────────────────────────

/** Format centavos → "$350.00" */
export const formatCentavos = (centavos: number): string =>
  `$${(centavos / 100).toFixed(2)}`;

/** Format pesos → "$350.00" */
export const formatPesos = (pesos: number): string =>
  `$${pesos.toFixed(2)}`;

/** Format pesos → "$350.00 MXN" */
export const formatPesosMXN = (pesos: number): string =>
  `$${pesos.toFixed(2)} MXN`;

// ── Pre-formatted strings (most common usage) ───────────────
// NOTE: UI shows "Subtotal" and "IVA" only — no Stripe fee line item
export const DISPLAY = {
  subtotal:        formatPesosMXN(SUBTOTAL),           // "$368.10 MXN"
  iva:             formatPesosMXN(IVA_AMOUNT),          // "$56.00 MXN"
  customerTotal:   formatPesosMXN(CUSTOMER_TOTAL),      // "$424.10 MXN"
  providerPayout:  formatPesosMXN(PROVIDER_PAYOUT),     // "$250.00 MXN"
  chambyFee:       formatPesosMXN(CHAMBY_COMMISSION),   // "$100.00 MXN"
} as const;
